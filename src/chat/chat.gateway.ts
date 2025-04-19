import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UseFilters } from '@nestjs/common';

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { RoomService } from 'src/room/room.service';
import { RoomUserStatus } from 'src/room/entities/room.user.meta';

import { ChatMessageType } from './entities/chat.meta';
import { ChatService } from './chat.service';
import { WsExceptionFilter } from './filters/ws-exception.filter';

@WebSocketGateway()
@UseFilters(WsExceptionFilter)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly roomService: RoomService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // TODO: 앱 프레임워크인 ReactNative에서 Websocket 연결 시 쿠키 전달 방법이 있는지 확인
      // 만약, 쿠키 전달을 하지 못한다면 인증 로직 수정해야 함
      const cookies = client.handshake.headers.cookie;
      const token = cookies
        ?.split('; ')
        ?.find((cookie) => cookie.startsWith('Authentication='))
        ?.split('=')[1];

      if (!token) {
        throw new WsException({
          message: '인증 토큰이 없습니다.',
        });
      }

      const payload: JwtPayload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET_KEY,
      });

      if (!payload) {
        throw new WsException({
          message: '인증 토큰이 유효하지 않습니다.',
        });
      }

      client.data.user = payload;
      client.data.rooms = new Set<string>();
    } catch (error) {
      // NOTE: @SubscribeMessage() 에노테이션이 붙지 않은 이벤트에서 발생한 에러는 ExceptionFilter에 전달되지 않음
      // 따라서 여기서 클라이언트에 에러 이벤트를 전송해야 함
      client.emit('error', {
        message: `웹소켓 연결에 실패했습니다. ${error.message}`,
      });
      client.disconnect();
      // 서버에 로그남기는 용도
      throw new WsException({
        message: `웹소켓 연결에 실패했습니다. ${error.message}`,
      });
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`${client.id} disconnected`);
    delete client.data.user;
    delete client.data.rooms;
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomUuid: string },
  ) {
    try {
      const { roomUuid } = data;
      // 방에 참여한 유저인지 확인
      const roomUser = await this.roomService.findUsersByRoomUuid(roomUuid);
      if (roomUser.length === 0) {
        throw new WsException('방을 찾을 수 없습니다.');
      }
      const userInRoom = roomUser.some(
        (user) =>
          user.userUuid === client.data.user.uuid &&
          user.status === RoomUserStatus.JOINED,
      );

      if (!userInRoom) {
        throw new WsException('방에 속한 유저가 아닙니다.');
      }

      // TODO: 채팅방 메세지 불러오기 기능 구현
      // 첫 입장 시 시스템 메시지 전송
      if (!client.data.rooms.has(roomUuid)) {
        // 유저 소켓의 rooms에 roomUuid 추가
        await client.join(roomUuid);
        client.data.rooms.add(roomUuid);

        // 방 참여 메시지 전송
        // 시스템 유저의 경우 senderUuid를 비워둠
        const systemMessage = await this.chatService.create({
          roomUuid: roomUuid,
          message: `${client.data.user.name} 님이 방에 참여했습니다.`,
          messageType: ChatMessageType.TEXT,
        });

        // 내 화면 반영을 위해 본인에게 메시지 전송
        client.emit('newMessage', systemMessage);
        // 방 유저들에게 메시지 전송
        client.to(roomUuid).emit('newMessage', systemMessage);
      } else {
        // TODO: 이미 참여한 방일 경우 메세지 읽음 처리
      }
    } catch (error) {
      throw new WsException(`방 참여에 실패했습니다. ${error.message}`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomUuid: string; message: string },
  ) {
    try {
      const { roomUuid, message } = payload;

      // 방에 참여한 유저인지 확인
      const roomUser = await this.roomService.findUsersByRoomUuid(roomUuid);
      if (roomUser.length === 0) {
        throw new WsException('방을 찾을 수 없습니다.');
      }
      const userInRoom = roomUser.some(
        (user) =>
          user.userUuid === client.data.user.uuid &&
          user.status === RoomUserStatus.JOINED,
      );
      if (!userInRoom) {
        throw new WsException('방에 속한 유저가 아닙니다.');
      }

      // 메시지 저장
      const chatMessage = await this.chatService.create({
        roomUuid,
        senderUuid: client.data.user.uuid,
        message,
        messageType: ChatMessageType.TEXT,
      });

      // 내 화면 반영을 위해 본인에게 메시지 전송
      client.emit('newMessage', chatMessage);
      // 본인을 제외한 방 유저들에게 메시지 전송
      client.to(roomUuid).emit('newMessage', chatMessage);
    } catch (error) {
      throw new WsException(`메시지 전송에 실패했습니다. ${error.message}`);
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomUuid: string,
  ) {
    try {
      // 방에 참여한 유저인지 확인
      if (!client.data.rooms.has(roomUuid)) {
        throw new WsException('방에 속한 유저가 아닙니다.');
      }

      // 유저 소켓의 rooms에서 roomUuid 제거
      await client.leave(roomUuid);
      client.data.rooms.delete(roomUuid);

      // 방 나가기 메시지 전송
      const systemMessage = await this.chatService.create({
        roomUuid,
        message: `${client.data.user.name} 님이 방에서 나갔습니다.`,
        messageType: ChatMessageType.TEXT,
      });

      client.to(roomUuid).emit('newMessage', systemMessage);
    } catch (error) {
      throw new WsException(`방 나가기에 실패했습니다. ${error.message}`);
    }
  }

  // TODO: 소켓이 끊어지고 다시 연결될 때 소켓 복원 기능 추가
}
