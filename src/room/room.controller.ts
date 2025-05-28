import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChatMessageType } from 'src/chat/entities/chat.meta';
import { ChatService } from 'src/chat/chat.service';
import { UserService } from 'src/user/user.service';
import { FcmService } from 'src/fcm/fcm.service';
import { NoContentException } from 'src/common/exception';
import { ResponseMyRoomDto } from 'src/room/dto/response-myroom.dto';

import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { RoomUser } from './entities/room-user.entity';
import { UpdateSettlementDto } from './dto/update-settlement.dto';
import { RoomWithUsersDto } from './dto/room-user-with-nickname.dto';
import { ResponseSettlementDto } from './dto/response-settlement.dto';
@ApiCookieAuth()
@ApiResponse({
  status: 401,
  description: '로그인이 되어 있지 않은 경우',
})
@ApiResponse({
  status: 404,
  description: '방이 존재하지 않는 경우',
})
@Controller('room')
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly userService: UserService,
    private readonly chatGateway: ChatGateway,
    private readonly chatService: ChatService,
    private readonly fcmService: FcmService,
  ) {}

  @Post()
  @ApiOperation({
    summary: '방을 생성하고 방 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '생성된 방 정보를 반환',
    type: [Room],
  })
  @ApiResponse({
    status: 400,
    description: '출발 시간이 현재보다 이전인 경우',
  })
  @ApiResponse({
    status: 500,
    description: '내부 트랜잭션 오류 등으로 방 생성이 실패할 경우',
  })
  async create(@Req() req, @Body() dto: CreateRoomDto) {
    const user = req.user as JwtPayload;
    return await this.roomService.create(user.uuid, dto);
  }

  @Get()
  @ApiOperation({
    summary: '모든 방의 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '출발 시간이 현재보다 이후이고, 모집 중인 모든 방을 반환',
    type: [Room],
  })
  findAll() {
    return this.roomService.findAll();
  }

  @Get('my')
  @ApiOperation({
    summary: '자신이 참여중인 방의 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '자신이 참여중인 방을 반환, 참여중인 방이 없을 경우 빈 배열 반환',
    type: [ResponseMyRoomDto],
  })
  findMyRoom(@Req() req) {
    const user = req.user as JwtPayload;
    return this.roomService.findMyRoomByUserUuid(user.uuid);
  }

  @Get(':uuid')
  @ApiOperation({
    summary: '특정 방의 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '특정 방을 반환, 방이 존재하지 않을 경우 null 반환',
    type: Room,
  })
  findOne(@Param('uuid') uuid: string) {
    return this.roomService.findOne(uuid);
  }

  @Patch(':uuid')
  @ApiOperation({
    summary: '방의 정보를 수정합니다. 방장, 관리자만 가능합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '수정된 방 정보를 반환',
    type: Room,
  })
  @ApiResponse({
    status: 400,
    description: '이미 종료된 방인 경우, 출발 시간이 현재보다 이전인 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우, 방장이나 관리자가 아닌 경우',
  })
  async update(
    @Param('uuid') uuid: string,
    @Req() req,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    const user = req.user as JwtPayload;
    return await this.roomService.update(uuid, updateRoomDto, user);
  }

  @Delete(':uuid')
  @ApiOperation({
    summary: '방을 삭제합니다. 방장, 관리자만 가능합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '상태가 DELETED로 변경된 방의 UUID를 반환',
    type: Room,
  })
  @ApiResponse({
    status: 400,
    description: '이미 삭제된 방인 경우, 이미 정산이 진행되고 있는 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우, 방장이나 관리자가 아닌 경우',
  })
  async remove(@Req() req, @Param('uuid') uuid: string) {
    const user = req.user as JwtPayload;
    return this.roomService.remove(uuid, user.uuid);
  }

  @Post(['join2/:uuid', 'join/:uuid'])
  @ApiOperation({
    summary:
      '[웹소켓 통합 버전-개발 중] 방에 참여합니다. 첫 입장 및 재입장 모든 경우에 호출됩니다',
  })
  @ApiResponse({
    status: 201,
    description:
      '참여한 방 정보를 반환, 첫 입장 혹은 퇴장 후 입장의 경우 방 전체에 채팅 메시지와 푸시 알림을 전송합니다.',
    type: RoomWithUsersDto,
  })
  @ApiResponse({
    status: 400,
    description:
      '방에 가입할 수 없는 상태(방이 활성화되지 않은 경우, 이미 가입된 방, 강퇴된 방)인 경우',
  })
  async joinRoom(@Req() req, @Param('uuid') uuid: string) {
    const user = req.user as JwtPayload;
    const { sendMessage, room } = await this.roomService.joinRoom(
      uuid,
      user.uuid,
    );
    if (sendMessage) {
      const nickname = await this.userService.getNickname(user.uuid);
      const message = `${nickname?.nickname} 님이 방에 참여했습니다.`;
      const chat = await this.chatService.create({
        roomUuid: uuid,
        message: message,
        messageType: ChatMessageType.TEXT,
      });
      this.chatGateway.sendMessage(uuid, chat);
    }
    this.chatGateway.updateUserFocusRoomUuid(user.uuid, uuid);
    await this.roomService.saveLastReadChat(uuid, user.uuid);
    return room;
  }

  @Put(['leave2/:uuid', 'leave/:uuid'])
  @ApiOperation({
    summary:
      '[웹소켓 통합 버전-개발 중] 방에서 나갑니다. 방에 퇴장 메세지를 전송합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '방의 현재 인원 수가 하나 줄고, 방 정보를 반환, 퇴장 메세지를 전송합니다.',
    type: RoomWithUsersDto,
  })
  @ApiResponse({
    status: 400,
    description:
      '방에 가입되어 있지 않은 경우, 방장이 탈퇴하는 경우에 다른 방장을 지정할 수 없는 경우, 이미 정산이 진행되고 있는 경우',
  })
  async leaveRoom(@Req() req, @Param('uuid') uuid: string) {
    const user = req.user as JwtPayload;
    const room = await this.roomService.leaveRoom(uuid, user.uuid);
    const nickname = await this.userService.getNickname(user.uuid);
    const message = `${nickname?.nickname} 님이 방에서 나갔습니다.`;
    const chat = await this.chatService.create({
      roomUuid: uuid,
      message: message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(uuid, chat);
    return room;
  }

  @Put(['kick2/:uuid', 'kick/:uuid'])
  @ApiOperation({
    summary:
      '[웹소켓 통합 버전-개발 중] 사용자를 추방합니다. 방장만 가능하며, 사용자의 상태를 KICKED로 변경합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: '강퇴 사유',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      '강퇴된 사용자와 방 정보를 반환, 방에 강퇴 메세지를 전송합니다.',
    type: Room,
  })
  @ApiResponse({
    status: 400,
    description: '방에 가입되어 있지 않은 경우, 자기 자신을 강퇴하는 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우, 방장이 아닌 경우',
  })
  async kickUserFromRoom(
    @Req() req,
    // TODO: 필터링 기능이 아니라서 쿼리 파라미터를 바디로 변경하는건 어떤지?
    @Query('userUuid') userUuid: string,
    @Param('uuid') uuid: string,
    @Body('reason') reason?: string,
  ) {
    const user = req.user as JwtPayload;
    const room = await this.roomService.kickUserFromRoom(
      uuid,
      user.uuid,
      userUuid,
      reason,
    );

    const nickname = await this.userService.getNickname(userUuid);
    const message = `방장에 의해 ${nickname?.nickname} 님이 방에서 강제퇴장 되었습니다.`;
    const chat = await this.chatService.create({
      roomUuid: uuid,
      message: message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(uuid, chat);

    return room;
  }

  @Post(['delegate2/:uuid', 'delegate/:uuid'])
  @ApiOperation({
    summary: '[웹소켓 통합 버전-개발 중] 방장 권한을 위임합니다.',
  })
  @ApiResponse({
    status: 201,
    description:
      '위임된 방장과 방 정보를 반환, 방에 방장이 위임되었다는 메세지를 전송합니다.',
    type: Room,
  })
  @ApiResponse({
    status: 400,
    description:
      '방에 가입되어 있지 않은 경우, 방장이 아닌 경우, 이미 방장인 경우',
  })
  async delegateRoom(
    @Req() req,
    @Param('uuid') uuid: string,
    // TODO: 필터링 기능이 아니라서 쿼리 파라미터를 바디로 변경하는건 어떤지?
    @Query('userUuid') userUuid: string,
  ) {
    const user = req.user as JwtPayload;
    const room = await this.roomService.delegateRoom(uuid, user.uuid, userUuid);
    const nickname = await this.userService.getNickname(user.uuid);
    const newRoomOwnerNickname = await this.userService.getNickname(userUuid);
    const message = `${nickname?.nickname} 님이 ${newRoomOwnerNickname?.nickname} 님에게 방장을 위임했습니다.`;
    const chat = await this.chatService.create({
      roomUuid: uuid,
      message: message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(uuid, chat);
    return room;
  }

  @Post([':uuid/settlement2', ':uuid/settlement'])
  @ApiOperation({
    summary: '[웹소켓 통합 버전-개발 중] 카풀 방의 정산 정보를 등록합니다.',
  })
  @ApiResponse({
    status: 201,
    description:
      '등록된 정산 정보를 반환합니다. `newMessage`이벤트로 방에 정산 메세지를 전송합니다. `newSettlement`이벤트로 방에 정산 정보를 전송합니다.',
    type: ResponseSettlementDto,
  })
  @ApiResponse({
    status: 400,
    description: '방이 종료된 경우, 이미 정산이 진행되고 있는 경우',
  })
  async requestSettlement(
    @Param('uuid') uuid: string,
    @Req() req,
    @Body() dto: CreateSettlementDto,
  ) {
    const user = req.user as JwtPayload;
    const responseSettlement = await this.roomService.requestSettlement(
      uuid,
      user.uuid,
      dto,
    );
    const message = `결제자 ${responseSettlement.payerNickname} 님이 정산 정보를 등록했습니다. 확인 후 송금을 진행해 주세요.`;
    const chat = await this.chatService.create({
      roomUuid: uuid,
      message: message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(uuid, chat);
    this.chatGateway.sendNewSettlement(uuid, responseSettlement);
    return responseSettlement;
  }

  @Get(':uuid/settlement')
  @ApiOperation({
    summary: '카풀 방의 정산 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '정산 정보를 조회합니다.',
    type: ResponseSettlementDto,
  })
  @ApiResponse({
    status: 400,
    description: '방이 종료된 경우, 정산이 진행되고 있지 않은 경우',
  })
  @ApiResponse({
    status: 404,
    description:
      '방이 존재하지 않는 경우, 정산 내역이 없는 경우, 정산자의 계좌 정보가 없는 경우',
  })
  async getSettlement(@Param('uuid') uuid: string) {
    return await this.roomService.getSettlement(uuid);
  }

  @Put([':uuid/settlement2', ':uuid/settlement'])
  @ApiOperation({
    summary:
      '[웹소켓 통합 버전-개발 중] 카풀 방의 정산 정보(정산 금액, 정산 계좌)를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '수정된 정산 정보를 반환합니다. `newMessage`이벤트로 방에 정산 정보가 수정되었다고 알리는 메세지를 전송합니다. `updatedSettlement`이벤트로 방에 정산 정보를 전송합니다.',
    type: ResponseSettlementDto,
  })
  @ApiResponse({
    status: 400,
    description: '방이 종료된 경우, 정산이 진행되고 있지 않은 경우',
  })
  @ApiResponse({
    status: 401,
    description: '정산자가 아닌 경우',
  })
  async updateSettlement(
    @Param('uuid') uuid: string,
    @Req() req,
    @Body() dto: UpdateSettlementDto,
  ) {
    const user = req.user as JwtPayload;
    const responseSettlement = await this.roomService.updateSettlement(
      uuid,
      user.uuid,
      dto,
    );

    const message = `결제자 ${responseSettlement.payerNickname} 님이 정산 정보를 수정했습니다.`;
    const chat = await this.chatService.create({
      roomUuid: uuid,
      message: message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(uuid, chat);
    this.chatGateway.sendUpdatedSettlement(uuid, responseSettlement);
    return responseSettlement;
  }

  @Delete([':uuid/settlement2', ':uuid/settlement'])
  @ApiOperation({
    summary: '[웹소켓 통합 버전-개발 중] 카풀 방의 정산 요청을 취소합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '정산이 취소된 방의 정보를 반환. `newMessage`이벤트로 방에 정산 요청이 취소되었다고 알리는 메세지를 전송합니다. `deletedSettlement`이벤트로 방에 정산 정보를 전송합니다.',
    type: Room,
  })
  @ApiResponse({
    status: 400,
    description: '정산이 진행되고 있지 않은 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우, 정산자가 아닌 경우',
  })
  async cancelSettlement(@Param('uuid') uuid: string, @Req() req) {
    const user = req.user as JwtPayload;
    const room = await this.roomService.cancelSettlement(uuid, user.uuid);

    const nickname = await this.userService.getNickname(user.uuid);
    const message = `결제자 ${nickname?.nickname} 님이 정산 요청을 취소했습니다. 다시 정산을 진행해 주세요.`;
    const chat = await this.chatService.create({
      roomUuid: uuid,
      message: message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(uuid, chat);
    this.chatGateway.sendDeletedSettlement(uuid);

    return room;
  }

  @Patch([':uuid/pay2', ':uuid/pay'])
  @ApiOperation({
    summary:
      '[웹소켓 통합 버전-개발 중] 카풀 방에 대한 유저의 정산 여부를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '수정된 정산 정보를 반환합니다. TODO: 정산자에게 정산 완료 알림 기능 추가 필요',
    type: RoomUser,
  })
  @ApiResponse({
    status: 400,
    description:
      '방에 가입되어 있지 않은 경우, 요청자가 정산자 본인이 아닌 경우, 정산이 진행되고 있지 않은 경우',
  })
  @ApiBody({
    description: '정산 여부를 전달합니다. 기존과 같은 값을 받으면 덮어씁니다.',
    schema: {
      type: 'object',
      properties: {
        isPaid: { type: 'boolean' },
      },
    },
  })
  async updateIsPaid(
    @Param('uuid') uuid: string,
    @Req() req,
    @Body() body: { isPaid: boolean },
  ) {
    const user = req.user as JwtPayload;
    const { payerUuid, roomUser } = await this.roomService.updateRoomUserIsPaid(
      uuid,
      user.uuid,
      body.isPaid,
    );
    if (body.isPaid) {
      const nickname = await this.userService.getNickname(user.uuid);
      const roomTitle = await this.roomService.getRoomTitle(uuid);
      const message = `${nickname?.nickname} 님이 정산을 완료했다고 알립니다. 확인해 보세요!`;
      this.fcmService
        .sendPushNotificationByUserUuid(
          payerUuid,
          `${roomTitle} 카풀 정산 완료 알림`,
          message,
          {
            roomUuid: uuid,
          },
        )
        .catch((error) => {
          console.error(error);
        });
    }
    return roomUser;
  }

  @Patch([':uuid/complete2', ':uuid/complete'])
  @ApiOperation({
    summary:
      '[웹소켓 통합 버전-개발 중] 모든 정산이 끝난 후 방을 완료 상태로 바꿉니다. 방장이 아닌 정산 신청자, 관리자만 가능합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '완료된 방 정보를 반환, 방에 완료 메세지 및 알림을 전송합니다.',
    type: Room,
  })
  @ApiResponse({
    status: 400,
    description: '방이 종료된 경우, 정산이 진행되고 있지 않은 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우, 정산자 혹은 관리자가 아닌 경우',
  })
  @ApiParam({
    name: 'uuid',
    description: '정산 완료를 요청할 방의 UUID',
  })
  async completeRoom(@Param('uuid') uuid: string, @Req() req) {
    const user = req.user as JwtPayload;
    const room = await this.roomService.completeRoom(
      uuid,
      user.uuid,
      user.userType,
    );
    const message = `정산이 모두 완료되었습니다.`;
    const chat = await this.chatService.create({
      roomUuid: uuid,
      message: message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(uuid, chat);
    return room;
  }

  @Post('unfocus')
  @ApiOperation({
    summary:
      '사용자가 채팅방에서 나갈때(뒤로가기 등) 호출되어 마지막으로 읽은 채팅의 위치를 기억합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'RoomUser 정보를 반환',
    type: RoomUser,
  })
  @ApiResponse({
    status: 204,
    description: '마지막으로 읽은 채팅이 없거나 소켓에 연결되지 않은 경우',
  })
  @ApiResponse({
    status: 400,
    description: '방이 존재하지 않는 경우, 방에 가입되어 있지 않은 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  async unfocus(@Req() req) {
    const user = req.user as JwtPayload;

    const uuid = this.chatGateway.getUserFocusRoomUuid(user.uuid);
    if (!uuid || typeof uuid !== 'string') throw new NoContentException();

    this.chatGateway.updateUserFocusRoomUuid(user.uuid);
    return await this.roomService.saveLastReadChat(uuid, user.uuid);
  }
}

/* docs 데코레이터 간소화 */
/*
  @ApiOperation({
    summary: '주어진 사용자를 주어진 방에 가입시킵니다.',
    responses: {
      200: {
        description: '가입된 방 정보를 반환',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Room',
            },
          },
        },
      },
      400: {
        description:
          '룸이 존재하지 않는 경우, 룸이 가입할 수 없는 상태(ACTIVATED 상태가 아님, 이미 가입된 룸, 강퇴된 룸)인 경우',
      },
      401: {
        description: '로그인이 되어 있지 않은 경우',
      },
    },
  })
 */
