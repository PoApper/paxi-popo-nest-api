import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Logger, UseFilters, Injectable } from '@nestjs/common';

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { RoomService } from 'src/room/room.service';
import { RoomUserStatus } from 'src/room/entities/room-user.meta';
import { FcmService } from 'src/fcm/fcm.service';
import { ResponseSettlementDto } from 'src/room/dto/response-settlement.dto';
import { Room } from 'src/room/entities/room.entity';
import { UpdateRoomDto } from 'src/room/dto/update-room.dto';

import { WsExceptionFilter } from './filters/ws-exception.filter';
import { Chat } from './entities/chat.entity';
@Injectable()
@WebSocketGateway()
@UseFilters(WsExceptionFilter)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly jwtService: JwtService,
    private readonly roomService: RoomService,
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

      const payload: JwtPayload = await this.jwtService.verify(token);

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
    if (client.data.focusedRoomUuid && client.data.user) {
      await this.roomService.saveLastReadChat(
        client.data.focusedRoomUuid as string,
        client.data.user.uuid as string,
      );
    }
    delete client.data;
  }

  async sendMessage(
    roomUuid: string,
    message: Chat,
    // 해당 함수를 호출하는 함수가 중요한 이벤트(정산 요청 등)라면, 유저의 음소거 요청을 무시하고 모든 유저에게 알림 전송
    // 현재는 일반 유저의 메세지(chatController.create())만 mute 가능함
    respectMuteSetting: boolean = false,
  ) {
    const roomUsers = await this.roomService.findUsersByRoomUuidAndStatus(
      roomUuid,
      RoomUserStatus.JOINED,
    );

    // FCM 알림 대상 사용자
    const usersToNotify: string[] = [];

    // sockets.adapter.rooms 에서 `user-${userUuid}` 키가 있는지 확인하고 active user 필터링
    for (const user of roomUsers) {
      const isActive = this.server.sockets.adapter.rooms.has(
        `user-${user.userUuid}`,
      );
      const isFocused = this.getUserFocusRoomUuid(user.userUuid) === roomUuid;

      // 유저가 소켓에 연결되어 있고, 현재 있는 방이 메세지를 보낼 방이면 웹소켓 메시지 전송
      if (isActive && isFocused) {
        this.server
          .to(`user-${user.userUuid}`)
          .emit('newMessage', instanceToPlain(message));
      } else {
        // 다른 방에 있거나 앱에 없는 사용자에게 FCM 알림 전송
        // 음소거 설정을 따르는지 확인
        if (respectMuteSetting && user.isMuted) continue;
        usersToNotify.push(user.userUuid);
      }
    }

    // 수집된 사용자들에게 한 번에 FCM 알림 전송
    if (usersToNotify.length > 0) {
      this.fcmService
        .sendPushNotificationByUserUuid(
          usersToNotify,
          `${await this.roomService.getRoomTitle(roomUuid)}`,
          message.message,
          {
            roomUuid: roomUuid,
          },
        )
        .catch(console.error);
    }
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

  async sendUpdatedRoom(
    roomUuid: string,
    updatedRoom: Room,
    diff: Record<string, any>,
  ) {
    const roomUsers = await this.roomService.findUsersByRoomUuidAndStatus(
      roomUuid,
      RoomUserStatus.JOINED,
    );

    const updatedRoomDto = plainToInstance(
      UpdateRoomDto,
      instanceToPlain(updatedRoom),
      { excludeExtraneousValues: true },
    );
    for (const user of roomUsers) {
      if (this.server.sockets.adapter.rooms.has(`user-${user.userUuid}`)) {
        this.server.to(`user-${user.userUuid}`).emit('updatedRoom', {
          updatedRoom: updatedRoomDto,
          diff: diff,
        });
      }
    }
  }

  async sendUpdateIsPaid(
    roomUuid: string,
    isPaid: boolean,
    userUuid: string,
    nickname: string,
  ) {
    const roomUsers = await this.roomService.findUsersByRoomUuidAndStatus(
      roomUuid,
      RoomUserStatus.JOINED,
    );

    for (const user of roomUsers) {
      if (this.server.sockets.adapter.rooms.has(`user-${user.userUuid}`)) {
        this.server
          .to(`user-${user.userUuid}`)
          .emit('updatedIsPaid', { isPaid, userUuid, nickname });
      }
    }
  }

  updateUserFocusRoomUuid(userUuid: string, roomUuid: string | null) {
    const userSocket = Array.from(this.server.sockets.sockets.values()).find(
      (socket) => socket.data.user.uuid === userUuid,
    );

    if (userSocket) {
      userSocket.data.focusedRoomUuid = roomUuid;
    }
  }

  getUserFocusRoomUuid(userUuid: string) {
    const userSocket = Array.from(this.server.sockets.sockets.values()).find(
      (socket) => socket.data.user.uuid === userUuid,
    );

    if (userSocket) return userSocket.data.focusedRoomUuid;
    else return null;
  }
}
