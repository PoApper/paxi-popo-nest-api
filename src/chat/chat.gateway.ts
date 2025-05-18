import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { instanceToPlain } from 'class-transformer';
import { Logger, UseFilters, Injectable } from '@nestjs/common';

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { RoomService } from 'src/room/room.service';
import { RoomUserStatus } from 'src/room/entities/room.user.meta';
import { FcmService } from 'src/fcm/fcm.service';
import { UserService } from 'src/user/user.service';
import { ResponseSettlementDto } from 'src/room/dto/response-settlement.dto';

import { ChatMessageType } from './entities/chat.meta';
import { ChatService } from './chat.service';
import { WsExceptionFilter } from './filters/ws-exception.filter';
import { Chat } from './entities/chat.entity';
@Injectable()
@WebSocketGateway()
@UseFilters(WsExceptionFilter)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly roomService: RoomService,
    private readonly userService: UserService,
    private readonly fcmService: FcmService,
  ) {}

  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  async handleConnection(client: Socket) {
    try {
      // NOTE: ReactNative에서 웹소켓 연결 시 쿠키 전달이 불가해 쿼리 파라미터로 토큰 전달
      const token = client.handshake.query.Authentication as string;

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
      client.data.focusedRoomUuid = '';
      // userUuid를 키로 하는 소켓 방 생성, controller에서 userUuid를 받아 메세지를 보낼 때 사용
      await client.join(`user-${payload.uuid}`);
    } catch (error) {
      // NOTE: @SubscribeMessage() 에노테이션이 붙지 않은 이벤트에서 발생한 에러는 ExceptionFilter에 전달되지 않음
      // 따라서 여기서 클라이언트에 에러 이벤트를 전송해야 함
      client.emit('error', {
        message: `웹소켓 연결에 실패했습니다. ${error.message}`,
      });
      client.disconnect();
      // 서버에 로그남기는 용도
      this.logger.error(`웹소켓 연결에 실패했습니다. ${error}`);
    }
  }

  async handleDisconnect(client: Socket) {
    console.log(`${client.id} disconnected`);
    await this.roomService.saveLastReadChat(
      client.data.focusedRoomUuid,
      client.data.user.uuid,
    );
    delete client.data.user;
    delete client.data.rooms;
    delete client.data.focusedRoomUuid;
  }

  // NOTE: 삭제 예정
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

      // 첫 입장 시 시스템 메시지 전송
      // TODO: 현재는 휘발 가능성이 있는 메모리에 첫 입장 여부를 판단하고 있음.
      // 이 상황에서는 서버가 껐다 켜지면 기존에 있던 유저들도 첫 입장으로 판단할 수 있음.
      // 첫 입장 여부를 판단할 다른 방법 필요
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
        client.emit('newMessage', instanceToPlain(systemMessage));
        // 방 유저들에게 메시지 전송
        client.to(roomUuid).emit('newMessage', instanceToPlain(systemMessage));

        // 푸시 알림 전송
        // 해당 방에 소켓이 연결된 유저의 uuid 불러오기
        const usersInSocketRoom = Array.from(
          this.server.sockets.adapter.rooms.get(roomUuid) || [],
        )
          .map(
            (socketId) =>
              this.server.sockets.sockets.get(socketId)?.data?.user.uuid,
          )
          .filter((user) => user !== undefined);
        // 방에 참여한 유저 중 소켓이 연결되지 않은 유저에게 푸시 알림 전송
        this.fcmService
          .sendPushNotificationByUserUuid(
            roomUser
              .map((user) => user.userUuid)
              .filter((uuid) => !usersInSocketRoom.includes(uuid)),
            `${await this.roomService.getRoomTitle(roomUuid)}`,
            systemMessage.message,
            {
              roomUuid: roomUuid,
            },
          )
          .catch(console.error);
      } else {
        // TODO: 이미 참여한 방일 경우 메세지 읽음 처리
      }
    } catch (error) {
      throw new WsException(`방 참여에 실패했습니다. ${error.message}`);
    }
  }

  async sendMessage(roomUuid: string, message: Chat) {
    const roomUsers = await this.roomService.findUsersByRoomUuidAndStatus(
      roomUuid,
      RoomUserStatus.JOINED,
    );

    // sockets.adapter.rooms 에서 `user-${userUuid}` 키가 있는지 확인하고 active user 필터링
    for (const user of roomUsers) {
      // 유저가 소켓에 연결되어 있다면 메시지 전송
      if (this.server.sockets.adapter.rooms.has(`user-${user.userUuid}`)) {
        this.server
          .to(`user-${user.userUuid}`)
          .emit('newMessage', instanceToPlain(message));
      }
    }
    // 모든 유저에게 알림 전송
    this.fcmService
      .sendPushNotificationByUserUuid(
        roomUsers.map((user) => user.userUuid),
        `${await this.roomService.getRoomTitle(roomUuid)}`,
        message.message,
        {
          roomUuid: roomUuid,
        },
      )
      .catch(console.error);
  }

  async sendUpdatedMessage(chat: Chat) {
    const roomUsers = await this.roomService.findUsersByRoomUuidAndStatus(
      chat.roomUuid,
      RoomUserStatus.JOINED,
    );

    for (const user of roomUsers) {
      if (this.server.sockets.adapter.rooms.has(`user-${user.userUuid}`)) {
        this.server
          .to(`user-${user.userUuid}`)
          .emit('updatedMessage', instanceToPlain(chat));
      }
    }
  }

  async sendDeletedMessage(roomUuid: string, chatUuid: string) {
    const roomUsers = await this.roomService.findUsersByRoomUuidAndStatus(
      roomUuid,
      RoomUserStatus.JOINED,
    );

    for (const user of roomUsers) {
      if (this.server.sockets.adapter.rooms.has(`user-${user.userUuid}`)) {
        this.server
          .to(`user-${user.userUuid}`)
          .emit('deletedMessage', { uuid: chatUuid });
      }
    }
  }

  // NOTE: 삭제 예정
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomUuid: string; message: string },
  ) {
    try {
      const { roomUuid, message } = payload;

      // 방에 참여한 유저인지 확인
      if (!client.data.rooms.has(roomUuid)) {
        throw new WsException('방에 속한 유저가 아닙니다.');
      }

      // 방에 속한 유저인지 확인
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
      // instanceToPlain()으로 id를 제외한 객체를 반환
      client.emit('newMessage', instanceToPlain(chatMessage));
      // 본인을 제외한 방 유저들에게 메시지 전송
      client.to(roomUuid).emit('newMessage', instanceToPlain(chatMessage));

      // 푸시 알림 전송
      // 해당 방에 소켓이 연결된 유저의 uuid 불러오기
      const usersInSocketRoom = Array.from(
        this.server.sockets.adapter.rooms.get(roomUuid) || [],
      )
        .map(
          (socketId) =>
            this.server.sockets.sockets.get(socketId)?.data?.user.uuid,
        )
        .filter((user) => user !== undefined);
      // 방에 참여한 유저 중 소켓이 연결되지 않은 유저에게 푸시 알림 전송
      this.fcmService
        .sendPushNotificationByUserUuid(
          roomUser
            .map((user) => user.userUuid)
            .filter((uuid) => !usersInSocketRoom.includes(uuid)),
          `${await this.roomService.getRoomTitle(roomUuid)} | ${await this.userService.getUserName(client.data.user.uuid)}`,
          message,
          {
            roomUuid: roomUuid,
          },
        )
        .catch(console.error);
    } catch (error) {
      throw new WsException(`메시지 전송에 실패했습니다. ${error.message}`);
    }
  }

  // NOTE: 삭제 예정
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

      client.to(roomUuid).emit('newMessage', instanceToPlain(systemMessage));
    } catch (error) {
      throw new WsException(`방 나가기에 실패했습니다. ${error.message}`);
    }
  }

  async sendNewSettlement(roomUuid: string, settlement: ResponseSettlementDto) {
    const roomUsers = await this.roomService.findUsersByRoomUuidAndStatus(
      roomUuid,
      RoomUserStatus.JOINED,
    );

    for (const user of roomUsers) {
      if (this.server.sockets.adapter.rooms.has(`user-${user.userUuid}`)) {
        this.server
          .to(`user-${user.userUuid}`)
          .emit('newSettlement', settlement);
      }
    }
  }

  async sendUpdatedSettlement(
    roomUuid: string,
    settlement: ResponseSettlementDto,
  ) {
    const roomUsers = await this.roomService.findUsersByRoomUuidAndStatus(
      roomUuid,
      RoomUserStatus.JOINED,
    );

    for (const user of roomUsers) {
      if (this.server.sockets.adapter.rooms.has(`user-${user.userUuid}`)) {
        this.server
          .to(`user-${user.userUuid}`)
          .emit('updatedSettlement', settlement);
      }
    }
  }

  async sendDeletedSettlement(roomUuid: string) {
    const roomUsers = await this.roomService.findUsersByRoomUuidAndStatus(
      roomUuid,
      RoomUserStatus.JOINED,
    );

    for (const user of roomUsers) {
      if (this.server.sockets.adapter.rooms.has(`user-${user.userUuid}`)) {
        this.server
          .to(`user-${user.userUuid}`)
          .emit('deletedSettlement', { roomUuid: roomUuid });
      }
    }
  }

  updateUserFocus(userUuid: string, roomUuid?: string) {
    const userSocket = Array.from(this.server.sockets.sockets.values()).find(
      (socket) => socket.data.user.uuid === userUuid,
    );

    if (userSocket) userSocket.data.focusedRoomUuid = roomUuid;
  }

  getUserFocus(userUuid: string) {
    const userSocket = Array.from(this.server.sockets.sockets.values()).find(
      (socket) => socket.data.user.uuid === userUuid,
    );

    if (userSocket) return userSocket.data.focusedRoomUuid;
    else return null;
  }
}
