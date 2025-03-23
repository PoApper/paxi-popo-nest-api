import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { GroupService } from 'src/group/group.service';

import { ChatMessageType } from './entities/chat.meta';
import { ChatService } from './chat.service';

// 시스템 유저의 UUID
const SYSTEM_USER_UUID = undefined;

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly groupService: GroupService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`${client.id} connected`);
    try {
      const cookies = client.handshake.headers.cookie;
      const token = cookies
        ?.split('; ')
        ?.find((cookie) => cookie.startsWith('Authentication='))
        ?.split('=')[1];

      console.log('token', token);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload: JwtPayload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET_KEY,
      });

      client.data.user = payload;
      client.data.groups = new Set<string>();
    } catch (e) {
      console.log('error', e);
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`${client.id} disconnected`);
    delete client.data.user;
    delete client.data.groups;
  }

  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupUuid: string },
  ) {
    try {
      const { groupUuid } = data;
      // 그룹 참여 유저 확인
      const groupUser = await this.groupService.findUsersByGroupUuid(groupUuid);
      const userInGroup = groupUser.some(
        (user) => user.userUuid === client.data.user.uuid,
      );

      if (!userInGroup) {
        client.emit('error', { message: '그룹에 속한 유저가 아닙니다.' });
        return;
      }

      // 유저 소켓의 groups에 groupUuid 추가
      client.join(groupUuid);
      client.data.groups.add(groupUuid);

      // 그룹 참여 메시지 전송
      const systemMessage = await this.chatService.create({
        groupUuid,
        senderUuid: SYSTEM_USER_UUID,
        message: `${client.data.user.name} 님이 그룹에 참여했습니다.`,
        messageType: ChatMessageType.TEXT,
      });

      client.to(groupUuid).emit('newMessage', systemMessage);
    } catch (error) {
      client.emit('error', { message: `그룹 참여 실패: ${error}` });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { groupUuid: string; message: string },
  ) {
    try {
      const { groupUuid, message } = payload;

      // 유저 그룹 확인
      if (!client.data.groups.has(groupUuid)) {
        client.emit('error', { message: '그룹에 속한 유저가 아닙니다.' });
        return;
      }

      // 메시지 저장
      const chatMessage = await this.chatService.create({
        groupUuid,
        senderUuid: client.data.user.uuid,
        message,
        messageType: ChatMessageType.TEXT,
      });

      // 그룹 메시지 전송
      client.to(groupUuid).emit('newMessage', chatMessage);
    } catch (error) {
      client.emit('error', { message: `메시지 전송 실패: ${error}` });
    }
  }

  @SubscribeMessage('leaveGroup')
  async handleLeaveGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() groupUuid: string,
  ) {
    try {
      // 유저 그룹 확인
      if (!client.data.groups.has(groupUuid)) {
        client.emit('error', { message: '그룹에 속한 유저가 아닙니다.' });
        return;
      }

      // 유저 소켓의 groups에서 groupUuid 제거
      client.leave(groupUuid);
      client.data.groups.delete(groupUuid);

      // 그룹 나가기 메시지 전송
      const systemMessage = await this.chatService.create({
        groupUuid,
        senderUuid: undefined,
        message: `${client.data.user.name} 님이 그룹에서 나갔습니다.`,
        messageType: ChatMessageType.TEXT,
      });

      client.to(groupUuid).emit('newMessage', systemMessage);
    } catch (error) {
      client.emit('error', { message: `그룹 나가기 실패: ${error}` });
    }
  }

  @SubscribeMessage('readMessage')
  handleReadMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { groupUuid: string; lastReadMessageId: string },
  ) {
    try {
      // 이것도 굳이 들고올 필요 없을 것 같음
      // DB에서 최신 메세지를 들고올 수 있기 때문
      const { groupUuid, lastReadMessageId } = payload;

      // 유저 그룹 확인
      if (!client.data.groups.has(groupUuid)) {
        client.emit('error', { message: '그룹에 속한 유저가 아닙니다.' });
        return;
      }

      // TODO: 메시지 읽음 처리를 위한 테이블을 생성해야됨
      // 일단 메시지 읽음 처리 확인 메시지 전송
      client.to(groupUuid).emit('messageRead', {
        userId: client.data.user.uuid,
        lastReadMessageId,
      });
    } catch (error) {
      client.emit('error', { message: `메시지 읽음 처리 실패: ${error}` });
    }
  }

  // TODO: 채팅 메세지 수정 기능 추가
  // TODO: 채팅 메세지 삭제 기능 추가
  // TODO: 소켓이 끊어지고 다시 연결될 때 소켓 복원 기능 추가
}
