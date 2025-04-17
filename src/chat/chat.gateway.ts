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

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { GroupService } from 'src/group/group.service';
import { GroupUserStatus } from 'src/group/entities/group.user.meta';

import { ChatMessageType } from './entities/chat.meta';
import { ChatService } from './chat.service';
// TODO: WSException 달기
// TODO: Websocket API Swagger 문서화 할 방법 찾기
// TODO: 유저가 방을 나갔을 때(Kicked or Leave) 호출되는 API 정리. 웹소켓이 아니라 그룹 모듈에서 호출되어야 할 것 같다. 그러면 user socket groups에서 빠져나가는 그룹의 uuid를 어떻게 지울 수 있을까?. groupservice에서?

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
      // TODO: 앱 프레임워크인 ReactNative에서 Websocket 연결 시 쿠키 전달 방법이 있는지 확인
      // 만약, 쿠키 전달을 하지 못한다면 인증 로직 수정해야 함
      const cookies = client.handshake.headers.cookie;
      const token = cookies
        ?.split('; ')
        ?.find((cookie) => cookie.startsWith('Authentication='))
        ?.split('=')[1];

      console.log('token', token);
      if (!token) {
        throw new WsException('인증 토큰이 없습니다.');
      }

      const payload: JwtPayload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET_KEY,
      });

      client.data.user = payload;
      client.data.groups = new Set<string>();
    } catch (error) {
      throw new WsException(`웹소켓 연결에 실패했습니다. ${error.message}`);
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
        (user) =>
          user.userUuid === client.data.user.uuid &&
          user.status === GroupUserStatus.JOINED,
      );

      if (!userInGroup) {
        throw new WsException('그룹에 속한 유저가 아닙니다.');
      }

      // TODO: 채팅방 메세지 불러오기 기능 구현
      // 첫 입장 시 시스템 메시지 전송
      if (!client.data.groups.has(groupUuid)) {
        // 유저 소켓의 groups에 groupUuid 추가
        client.join(groupUuid);
        client.data.groups.add(groupUuid);

        // 그룹 참여 메시지 전송
        // 시스템 유저의 경우 senderUuid를 비워둠
        const systemMessage = await this.chatService.create({
          groupUuid,
          message: `${client.data.user.name} 님이 그룹에 참여했습니다.`,
          messageType: ChatMessageType.TEXT,
        });

        // 내 화면 반영을 위해 본인에게 메시지 전송
        client.emit('newMessage', systemMessage);
        // 그룹 유저들에게 메시지 전송
        client.to(groupUuid).emit('newMessage', systemMessage);
      } else {
        // TODO: 이미 참여한 그룹일 경우 메세지 읽음 처리
      }
    } catch (error) {
      throw new WsException(`그룹 참여에 실패했습니다. ${error.message}`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { groupUuid: string; message: string },
  ) {
    try {
      const { groupUuid, message } = payload;

      // 그룹 참여 유저 확인
      // TODO: 혹은 client.data.groups.has(groupUuid) 로 확인할 수도 있을까?
      // 유저가 방을 나간 뒤에도 client.data가 유지된다면 DB 조회가 필요없으므로 이 방법이 나을 것 같다.
      const groupUser = await this.groupService.findUsersByGroupUuid(groupUuid);
      const userInGroup = groupUser.some(
        (user) =>
          user.userUuid === client.data.user.uuid &&
          user.status === GroupUserStatus.JOINED,
      );
      if (!userInGroup) {
        throw new WsException('그룹에 속한 유저가 아닙니다.');
      }

      // 메시지 저장
      const chatMessage = await this.chatService.create({
        groupUuid,
        senderUuid: client.data.user.uuid,
        message,
        messageType: ChatMessageType.TEXT,
      });

      // 내 화면 반영을 위해 본인에게 메시지 전송
      client.emit('newMessage', chatMessage);
      // 본인을 제외한 그룹 유저들에게 메시지 전송
      client.to(groupUuid).emit('newMessage', chatMessage);
    } catch (error) {
      throw new WsException(`메시지 전송에 실패했습니다. ${error.message}`);
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
        throw new WsException('그룹에 속한 유저가 아닙니다.');
      }

      // 유저 소켓의 groups에서 groupUuid 제거
      client.leave(groupUuid);
      client.data.groups.delete(groupUuid);

      // 그룹 나가기 메시지 전송
      const systemMessage = await this.chatService.create({
        groupUuid,
        message: `${client.data.user.name} 님이 그룹에서 나갔습니다.`,
        messageType: ChatMessageType.TEXT,
      });

      client.to(groupUuid).emit('newMessage', systemMessage);
    } catch (error) {
      throw new WsException(`그룹 나가기에 실패했습니다. ${error.message}`);
    }
  }

  // TODO: 채팅 메세지 수정 기능 추가 -> HTTP API로 구현
  // TODO: 채팅 메세지 삭제 기능 추가 -> HTTP API로 구현
  // TODO: 소켓이 끊어지고 다시 연결될 때 소켓 복원 기능 추가
}
