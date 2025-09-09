import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChatMessageType } from 'src/chat/entities/chat.meta';
import { ChatService } from 'src/chat/chat.service';
import { UserService } from 'src/user/user.service';
import { FcmService } from 'src/fcm/fcm.service';
import { NoContentException } from 'src/common/exception';
import { ResponseMyRoomDto } from 'src/room/dto/response-myroom.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UserType } from 'src/user/user.meta';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/authorization/roles.decorator';

import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { RoomUser } from './entities/room-user.entity';
import { UpdateSettlementDto } from './dto/update-settlement.dto';
import { RoomWithUsersDto } from './dto/room-user-with-nickname.dto';
import { ResponseSettlementDto } from './dto/response-settlement.dto';
import { RoomStatisticsResponseDto } from './dto/room-statistics.dto';

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

  // 아래쪽 GET :uuid 랑 겹쳐서 위쪽으로 컨트롤러 올림
  // TODO: 주간 통계 추가
  @Get('statistics')
  @ApiOperation({
    summary: '[관리자 전용] 기간별 방 생성 통계를 조회합니다.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    example: '20250101',
    description: '시작 날짜 (YYYYMMDD 형식)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    example: '20251231',
    description: '종료 날짜 (YYYYMMDD 형식)',
  })
  @ApiResponse({
    status: 200,
    description: '기간별 방 생성 통계를 반환',
    type: RoomStatisticsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  @ApiResponse({
    status: 403,
    description: '관리자 권한이 없는 경우',
  })
  @UseGuards(RolesGuard)
  @Roles(UserType.admin)
  async getRoomStatistics(
    @Query() query: { startDate: string; endDate: string },
  ): Promise<RoomStatisticsResponseDto> {
    const data = await this.roomService.getRoomStatistics(
      query.startDate,
      query.endDate,
    );
    return { data };
  }

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
  async create(@User() user: JwtPayload, @Body() dto: CreateRoomDto) {
    return await this.roomService.create(user.uuid, dto);
  }

  @Get()
  @ApiOperation({
    summary: '모든 방의 정보를 반환합니다.',
  })
  @ApiQuery({
    name: 'all',
    required: false,
    type: Boolean,
    default: false,
    description:
      'true면 모든 방을, 미설정 또는 false면 출발 시간이 현재보다 이후인 활성화된 방만 반환. 관리자 페이지에서 모든 방을 조회하기 위해 true를 설정함.',
  })
  @ApiResponse({
    status: 200,
    description: '출발 시간이 현재보다 이후이고, 모집 중인 모든 방을 반환',
    type: [Room],
  })
  findAll(
    @Query('all', new ParseBoolPipe({ optional: true })) all: boolean = false,
  ) {
    return this.roomService.findAll(all);
  }

  @Get('my/:userUuid')
  @ApiOperation({
    summary: '[관리자 전용] 특정 유저가 참여중인 방의 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '특정 유저가 참여중인 방을 반환',
    type: [ResponseMyRoomDto],
  })
  @ApiResponse({
    status: 403,
    description: '관리자 권한이 없는 경우',
  })
  @ApiResponse({
    status: 404,
    description: '유저가 존재하지 않는 경우',
  })
  @UseGuards(RolesGuard)
  @Roles(UserType.admin)
  findUserRooms(@Param('userUuid') userUuid: string) {
    return this.roomService.findMyRoomByUserUuid(userUuid);
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
  findMyRoom(@User() user: JwtPayload) {
    return this.roomService.findMyRoomByUserUuid(user.uuid);
  }

  @Get(':uuid')
  @ApiOperation({
    summary: '특정 방의 정보를 반환합니다. (복호화된 계좌번호 포함)',
  })
  @ApiResponse({
    status: 200,
    description: '복호화된 계좌번호가 포함된 방 정보를 반환',
    type: RoomWithUsersDto,
  })
  findOne(@Param('uuid') uuid: string) {
    return this.roomService.findOneWithRoomUsers(uuid);
  }

  @Patch(':uuid')
  @ApiOperation({
    summary: '방의 정보를 수정합니다. 방장, 관리자만 가능합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '수정된 방 정보를 반환합니다. 웹소켓의 `updatedRoom` 이벤트를 통해 수정된 방 정보를 전파합니다. `newMessage` 이벤트로 방 정보가 수정되었다고 알리는 메세지를 전송합니다.',
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
    @User() user: JwtPayload,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    const originalRoom = await this.roomService.findOne(uuid);
    const updatedRoom = await this.roomService.update(
      uuid,
      updateRoomDto,
      user,
    );

    const roomDiff = this.roomService.getRoomDiff(originalRoom, updatedRoom);

    // 사용성을 위해 수정된 내용이 없으면 에러 없이 방 정보를 반환
    if (Object.keys(roomDiff).length === 0) {
      return updatedRoom;
    }

    const message = this.roomService.generateRoomUpdateMessage(
      originalRoom,
      roomDiff,
    );
    const chat = await this.chatService.create({
      roomUuid: uuid,
      message: message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(uuid, chat);
    this.chatGateway.sendUpdatedRoom(uuid, updatedRoom, roomDiff);

    return updatedRoom;
  }

  @Delete(':uuid')
  @ApiOperation({
    summary: '방을 삭제합니다. 방장, 관리자만 가능합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '상태가 DELETED로 변경된 방의 UUID를 반환',
    type: String,
  })
  @ApiResponse({
    status: 400,
    description: '이미 삭제된 방인 경우, 이미 정산이 진행되고 있는 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우, 방장이나 관리자가 아닌 경우',
  })
  async remove(@User() user: JwtPayload, @Param('uuid') uuid: string) {
    return this.roomService.remove(uuid, user.uuid);
  }

  @Post('join/:uuid')
  @ApiOperation({
    summary: '방에 참여합니다. 첫 입장 및 재입장 모든 경우에 호출됩니다',
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
  async joinRoom(@User() user: JwtPayload, @Param('uuid') uuid: string) {
    const { sendMessage, room } = await this.roomService.joinRoom(
      uuid,
      user.uuid,
    );
    if (sendMessage) {
      const message = `${user.nickname} 님이 방에 참여했습니다.`;
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

  @Put('leave/:uuid')
  @ApiOperation({
    summary: '방에서 나갑니다. 방에 퇴장 메세지를 전송합니다.',
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
  async leaveRoom(@User() user: JwtPayload, @Param('uuid') uuid: string) {
    const room = await this.roomService.leaveRoom(uuid, user.uuid);
    this.chatGateway.updateUserFocusRoomUuid(user.uuid, null);
    const message = `${user.nickname} 님이 방에서 나갔습니다.`;
    const chat = await this.chatService.create({
      roomUuid: uuid,
      message: message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(uuid, chat);
    return room;
  }

  @Put('kick/:uuid')
  @ApiOperation({
    summary:
      '사용자를 추방합니다. 방장 및 관리자만 가능하며, 사용자의 상태를 KICKED로 변경합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        kickedUserUuid: {
          type: 'string',
          description: '강퇴할 사용자의 UUID',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        reason: {
          type: 'string',
          description: '강퇴 사유',
          example: '아무 말이 없어서 강퇴합니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      '강퇴된 사용자와 방 정보를 반환, 방에 강퇴 메세지를 전송합니다.',
    type: RoomWithUsersDto,
  })
  @ApiResponse({
    status: 400,
    description: '방에 가입되어 있지 않은 경우, 자기 자신을 강퇴하는 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우, 방장이나 관리자가 아닌 경우',
  })
  async kickUserFromRoom(
    @User() user: JwtPayload,
    @Param('uuid') uuid: string,
    @Body() dto: { kickedUserUuid: string; reason: string },
  ) {
    const room = await this.roomService.kickUserFromRoom(
      uuid,
      user.uuid,
      dto.kickedUserUuid,
      dto.reason,
      user.userType,
    );

    const kickedUserNickname = await this.userService.getNickname(
      dto.kickedUserUuid,
    );

    const kickerNickname = await this.userService.getNickname(user.uuid);
    const kicker = user.uuid == room.ownerUuid ? '방장' : '관리자';
    const message = `${kicker}에 의해 ${kickedUserNickname?.nickname} 님이 방에서 강제퇴장 되었습니다.`;
    const chat = await this.chatService.create({
      roomUuid: uuid,
      message: message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(uuid, chat);

    // WebSocket 이벤트 전송
    this.chatGateway.sendUserKicked(
      uuid,
      dto.kickedUserUuid,
      kickedUserNickname?.nickname || '알 수 없는 사용자',
      kickerNickname?.nickname || kicker,
      dto.reason,
    );

    return room;
  }

  @Delete('kick/:uuid')
  @ApiOperation({
    summary:
      '사용자의 강퇴를 취소합니다. 방장 및 관리자만 가능하며, KICKED 상태인 RoomUser 데이터를 삭제합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        kickedUserUuid: {
          type: 'string',
          description: '강퇴 취소할 사용자의 UUID',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      '강퇴가 취소된 방 정보를 반환, 방에 강퇴 취소 메세지를 전송합니다.',
    type: RoomWithUsersDto,
  })
  @ApiResponse({
    status: 400,
    description: '강퇴된 사용자가 존재하지 않는 경우',
  })
  @ApiResponse({
    status: 403,
    description: '방장이나 관리자가 아닌 경우',
  })
  @ApiResponse({
    status: 404,
    description: '강퇴된 사용자를 찾을 수 없는 경우',
  })
  async cancelKickUserFromRoom(
    @User() user: JwtPayload,
    @Param('uuid') uuid: string,
    @Body() dto: { kickedUserUuid: string },
  ) {
    const room = await this.roomService.cancelKickUserFromRoom(
      uuid,
      user.uuid,
      dto.kickedUserUuid,
      user.userType,
    );

    const kickedUserNickname = await this.userService.getNickname(
      dto.kickedUserUuid,
    );

    const canceler = user.uuid == room.ownerUuid ? '방장' : '관리자';
    const message = `${canceler}에 의해 ${kickedUserNickname?.nickname} 님의 강퇴가 취소되었습니다.`;
    const chat = await this.chatService.create({
      roomUuid: uuid,
      message: message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(uuid, chat);

    return room;
  }

  @Post('delegate/:uuid')
  @ApiOperation({
    summary: '방장 권한을 위임합니다.',
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userUuid: {
          type: 'string',
          description: '방장을 위임할 사용자의 UUID',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  async delegateRoom(
    @User() user: JwtPayload,
    @Param('uuid') uuid: string,
    @Body() dto: { userUuid: string },
  ) {
    const room = await this.roomService.delegateRoom(
      uuid,
      user.uuid,
      dto.userUuid,
    );
    const newOwnerNickname = await this.userService.getNickname(dto.userUuid);
    const message = `${user.nickname} 님이 ${newOwnerNickname?.nickname} 님에게 방장을 위임했습니다.`;
    const chat = await this.chatService.create({
      roomUuid: uuid,
      message: message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(uuid, chat);
    return room;
  }

  @Post(':uuid/settlement')
  @ApiOperation({
    summary: '카풀 방의 정산 정보를 등록합니다.',
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
    @User() user: JwtPayload,
    @Body() dto: CreateSettlementDto,
  ) {
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

  @Put(':uuid/settlement')
  @ApiOperation({
    summary: '카풀 방의 정산 정보(정산 금액, 정산 계좌)를 수정합니다.',
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
    @User() user: JwtPayload,
    @Body() dto: UpdateSettlementDto,
  ) {
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

  @Delete(':uuid/settlement')
  @ApiOperation({
    summary: '카풀 방의 정산 요청을 취소합니다.',
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
  async cancelSettlement(
    @Param('uuid') uuid: string,
    @User() user: JwtPayload,
  ) {
    const room = await this.roomService.cancelSettlement(uuid, user.uuid);

    const message = `결제자 ${user.nickname} 님이 정산 요청을 취소했습니다. 다시 정산을 진행해 주세요.`;
    const chat = await this.chatService.create({
      roomUuid: uuid,
      message: message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(uuid, chat);
    this.chatGateway.sendDeletedSettlement(uuid);

    return room;
  }

  @Get(':uuid/pay/:userUuid')
  @ApiOperation({
    summary: '[관리자 전용] 카풀 방에 대한 유저의 정산 여부를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '정산 여부를 조회합니다.',
    type: Boolean,
  })
  @ApiResponse({
    status: 403,
    description: '관리자 권한이 없는 경우',
  })
  @ApiResponse({
    status: 404,
    description: '유저가 존재하지 않는 경우, 방이 존재하지 않는 경우',
  })
  @UseGuards(RolesGuard)
  @Roles(UserType.admin)
  async getUserPayStatus(
    @Param('uuid') uuid: string,
    @Param('userUuid') userUuid: string,
  ) {
    return { isPaid: await this.roomService.getUserPayStatus(uuid, userUuid) };
  }

  @Patch(':uuid/pay')
  @ApiOperation({
    summary: '카풀 방에 대한 유저의 정산 여부를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '수정된 정산 정보를 반환합니다.',
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
    @User() user: JwtPayload,
    @Body() body: { isPaid: boolean },
  ) {
    const { payerUuid, roomUser } = await this.roomService.updateRoomUserIsPaid(
      uuid,
      user.uuid,
      body.isPaid,
    );
    if (body.isPaid) {
      const roomTitle = await this.roomService.getRoomTitle(uuid);
      const message = `${user.nickname} 님이 정산을 완료했다고 알립니다. 확인해 보세요!`;
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
    this.chatGateway.sendUpdateIsPaid(
      uuid,
      body.isPaid,
      user.uuid,
      user.nickname,
    );
    return roomUser;
  }

  @Patch(':uuid/complete')
  @ApiOperation({
    summary:
      '모든 정산이 끝난 후 방을 완료 상태로 바꿉니다. 방장이 아닌 정산 신청자, 관리자만 가능합니다.',
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
  async completeRoom(@Param('uuid') uuid: string, @User() user: JwtPayload) {
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
  async unfocus(@User() user: JwtPayload) {
    const uuid = this.chatGateway.getUserFocusRoomUuid(user.uuid);
    if (!uuid || typeof uuid !== 'string') throw new NoContentException();

    this.chatGateway.updateUserFocusRoomUuid(user.uuid, null);
    return await this.roomService.saveLastReadChat(uuid, user.uuid);
  }

  @Patch(':uuid/mute')
  @ApiOperation({
    summary: '특정 채팅방의 채팅 알림 음소거 상태를 변경합니다.',
  })
  @ApiBody({
    description: '음소거 여부를 전달합니다.',
    schema: {
      type: 'object',
      properties: {
        isMuted: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '음소거 상태가 변경된 RoomUser 정보를 반환',
    type: RoomUser,
  })
  async updateMuteStatus(
    @Param('uuid') uuid: string,
    @User() user: JwtPayload,
    @Body() body: { isMuted: boolean },
  ) {
    return await this.roomService.updateMuteStatus(
      uuid,
      user.uuid,
      body.isMuted,
    );
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
