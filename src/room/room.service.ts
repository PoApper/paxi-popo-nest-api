import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Between, DataSource, MoreThan, Not, Repository } from 'typeorm';
import { QueryRunner } from 'typeorm/query-runner/QueryRunner';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { instanceToPlain } from 'class-transformer';
import * as moment from 'moment';

import { Room } from 'src/room/entities/room.entity';
import { RoomUser } from 'src/room/entities/room-user.entity';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { UserType } from 'src/user/user.meta';
import { RoomUserStatus } from 'src/room/entities/room-user.meta';
import { RoomStatus } from 'src/room/entities/room.meta';
import { UserService } from 'src/user/user.service';
import { ChatService } from 'src/chat/chat.service';
import { FcmService } from 'src/fcm/fcm.service';

import { ResponseRoomDto } from './dto/response-room.dto';
import { MyRoomUserDto } from './dto/my-room-user.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UpdateSettlementDto } from './dto/update-settlement.dto';
import { RoomStatisticsDto } from './dto/room-statistics.dto';
import { RoomSettlementService } from './services/room-settlement.service';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(RoomUser)
    private readonly roomUserRepo: Repository<RoomUser>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => ChatService)) // 순환 참조 해결
    private readonly chatService: ChatService,
    private readonly fcmService: FcmService,
    private readonly dataSource: DataSource,
    private readonly roomSettlementService: RoomSettlementService,
  ) {}
  private readonly logger = new Logger(RoomService.name);

  async create(userUuid: string, dto: CreateRoomDto) {
    // 출발 시간 현재보다 이전인지 확인
    if (new Date(dto.departureTime) < new Date()) {
      throw new BadRequestException(
        '출발 시간은 현재 시간보다 이전일 수 없습니다.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.save(Room, {
        ...dto,
        ownerUuid: userUuid,
        roomUsers: [{ userUuid: userUuid }],
      });

      await queryRunner.manager.save(RoomUser, {
        roomUuid: room.uuid,
        userUuid: userUuid,
      });

      await queryRunner.commitTransaction();

      return await this.findOneWithRoomUsers(room.uuid, userUuid);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(all: boolean, userUuid?: string): Promise<ResponseRoomDto[]> {
    // NOTE: 프론트에서 필터링을 하기 때문에 페이지네이션을 하지 않는다.
    const where = all
      ? {}
      : {
          status: RoomStatus.ACTIVATED,
          departureTime: MoreThan(new Date()),
        };
    const rooms = await this.roomRepo.find({
      where,
      order: { departureTime: 'ASC' },
      relations: ['roomUsers'],
    });
    return rooms.map((room) => {
      let myRoomUser: MyRoomUserDto | undefined = undefined;
      if (userUuid) {
        const roomUser = room.roomUsers?.find((ru) => ru.userUuid === userUuid);
        if (roomUser) {
          myRoomUser = new MyRoomUserDto(roomUser, false);
        }
      }
      return new ResponseRoomDto(room, { myRoomUser });
    });
  }

  async findOne(uuid: string) {
    const room = await this.roomRepo.findOne({
      where: { uuid: uuid },
    });

    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    return room;
  }

  async findOneWithRoomUsers(
    uuid: string,
    userUuid?: string,
  ): Promise<ResponseRoomDto> {
    const room = await this.roomRepo.findOne({
      where: { uuid: uuid },
      relations: ['roomUsers', 'roomUsers.user.nickname'],
    });

    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    let decryptedAccountNumber: string | undefined = undefined;
    if (room.payerEncryptedAccountNumber) {
      decryptedAccountNumber = this.userService.decryptAccountNumber(
        room.payerEncryptedAccountNumber,
      );
    }

    let myRoomUser: MyRoomUserDto | undefined = undefined;
    if (userUuid) {
      const roomUser = room.roomUsers?.find((ru) => ru.userUuid === userUuid);
      if (roomUser) {
        const lastChat = await this.chatService.getLastMessageOfRoom(uuid);
        const hasNewMessage =
          lastChat !== null && lastChat.uuid !== roomUser.lastReadChatUuid;
        myRoomUser = new MyRoomUserDto(roomUser, hasNewMessage);
      }
    }

    return new ResponseRoomDto(room, {
      payerAccountNumber: decryptedAccountNumber,
      myRoomUser,
      includeRoomUsers: true,
    });
  }

  async findMyRoomByUserUuid(userUuid: string): Promise<ResponseRoomDto[]> {
    // JOINED 및 KICKED 상태인 방 모두 조회
    const rooms: Room[] = await this.roomRepo.find({
      where: {
        roomUsers: { userUuid: userUuid },
        status: Not(RoomStatus.DELETED),
      },
      relations: ['roomUsers'],
    });

    return await Promise.all(
      rooms.map(async (room) => {
        const roomUser = room.roomUsers.find((ru) => ru.userUuid === userUuid);
        if (!roomUser) return null;

        const lastChat = await this.chatService.getLastMessageOfRoom(room.uuid);
        const hasNewMessage =
          lastChat !== null && lastChat.uuid !== roomUser.lastReadChatUuid;

        return new ResponseRoomDto(room, {
          myRoomUser: new MyRoomUserDto(roomUser, hasNewMessage),
        });
      }),
    ).then((results) =>
      results.filter((r): r is ResponseRoomDto => r !== null),
    );
  }

  getRoomTitle(uuid: string) {
    return this.roomRepo
      .findOne({
        where: { uuid: uuid },
        select: { title: true },
      })
      .then((room) => {
        return room?.title;
      });
  }

  findUsersByRoomUuid(uuid: string) {
    return this.roomUserRepo.findBy({ roomUuid: uuid });
  }

  findUsersByRoomUuidAndStatus(uuid: string, status: RoomUserStatus) {
    return this.roomUserRepo.findBy({ roomUuid: uuid, status: status });
  }

  async update(uuid: string, updateRoomDto: UpdateRoomDto, user: JwtPayload) {
    const originalRoom = await this.findOne(uuid);

    if (
      originalRoom.status == RoomStatus.COMPLETED ||
      originalRoom.status == RoomStatus.DELETED
    ) {
      throw new BadRequestException('이미 종료된 방입니다.');
    } else if (originalRoom.status == RoomStatus.IN_SETTLEMENT) {
      throw new BadRequestException('정산이 진행 중인 방입니다.');
    }
    if (
      !(user.userType == UserType.admin || originalRoom.ownerUuid == user.uuid)
    ) {
      throw new UnauthorizedException('방장 또는 관리자가 아닙니다.');
    }

    // 출발 시간이 있다면 현재보다 이전인지 확인
    const departureTime = updateRoomDto.departureTime;
    if (departureTime && new Date(departureTime) < new Date()) {
      throw new BadRequestException(
        '출발 시간은 현재 시간보다 이전일 수 없습니다.',
      );
    }

    // 출발 시간 변경 시 출발전 알림 여부 초기화
    let departureAlertSent = originalRoom.departureAlertSent;
    if (updateRoomDto.departureTime) {
      departureAlertSent = false;
    }

    await this.roomRepo.update(
      { uuid: uuid },
      { ...updateRoomDto, departureAlertSent: departureAlertSent },
    );

    const updatedRoom = await this.findOne(uuid);

    // 관리자가 수정하는 경우 변경사항을 포함한 로그 남기기
    if (user.userType == UserType.admin) {
      const roomDiff = this.getRoomDiff(originalRoom, updatedRoom);
      const changes = Object.keys(roomDiff)
        .map((key) => {
          const originalValue = originalRoom[key];
          const updatedValue = roomDiff[key];
          let originalStr = originalValue;
          let updatedStr = updatedValue;

          // Date 타입 포맷팅
          if (originalValue instanceof Date) {
            originalStr = this.formatKst(originalValue);
          }
          if (updatedValue instanceof Date) {
            updatedStr = this.formatKst(updatedValue);
          }

          // null/undefined 처리
          if (originalValue === null || originalValue === undefined) {
            originalStr = originalValue === null ? 'null' : 'undefined';
          }
          if (updatedValue === null || updatedValue === undefined) {
            updatedStr = updatedValue === null ? 'null' : 'undefined';
          }

          return `  - ${key}: "${originalStr}" → "${updatedStr}"`;
        })
        .join('\n');

      const logMessage = `[관리자 방 수정] 관리자 UUID: ${user.uuid}, 방 UUID: ${uuid}, 방 제목: ${originalRoom.title}\n변경사항:\n${changes || '  (변경사항 없음)'}`;
      this.logger.log(logMessage);
    }

    return updatedRoom;
  }

  async remove(uuid: string, userUuid: string, userType?: UserType) {
    const room = await this.findOne(uuid);
    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }
    if (room.status == RoomStatus.DELETED) {
      throw new BadRequestException('이미 삭제된 방입니다.');
    }
    if (room.status == RoomStatus.IN_SETTLEMENT) {
      throw new BadRequestException('이미 정산이 진행되고 있습니다.');
    }
    if (!(userType == UserType.admin || room.ownerUuid == userUuid)) {
      throw new UnauthorizedException('방장 또는 관리자가 아닙니다.');
    }

    // 관리자가 삭제하는 경우 상세 로그 남기기
    if (userType == UserType.admin) {
      const roomInfo = [
        `  - 방 제목: ${room.title}`,
        `  - 출발지: ${room.departureLocation || '(없음)'}`,
        `  - 도착지: ${room.destinationLocation || '(없음)'}`,
        `  - 출발 시간: ${this.formatKst(room.departureTime)}`,
        `  - 최대 인원: ${room.maxParticipant}명`,
        `  - 현재 인원: ${room.currentParticipant}명`,
        `  - 방장 UUID: ${room.ownerUuid}`,
        `  - 방 상태: ${room.status}`,
      ].join('\n');

      const logMessage = `[관리자 방 삭제] 관리자 UUID: ${userUuid}, 방 UUID: ${uuid}\n방 정보:\n${roomInfo}`;
      this.logger.log(logMessage);
    }

    await this.roomRepo.update({ uuid: uuid }, { status: RoomStatus.DELETED });
    return uuid;
  }

  async joinRoom(
    uuid: string,
    userUuid: string,
  ): Promise<{ sendMessage: boolean; room: ResponseRoomDto }> {
    const room = await this.findOne(uuid);

    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    if (
      room.status == RoomStatus.DELETED ||
      room.status == RoomStatus.DEACTIVATED
    ) {
      throw new BadRequestException('입장할 수 없는 상태의 방입니다.');
    }

    const roomUser = await this.roomUserRepo.findOne({
      where: { roomUuid: uuid, userUuid: userUuid },
    });

    if (roomUser && roomUser.status == RoomUserStatus.KICKED) {
      throw new BadRequestException('강퇴된 방입니다.');
    }

    if (!roomUser && room.currentParticipant == room.maxParticipant) {
      throw new BadRequestException('정원이 가득 찼습니다.');
    }

    if (
      !roomUser &&
      (room.status == RoomStatus.IN_SETTLEMENT ||
        room.status == RoomStatus.COMPLETED)
    ) {
      throw new BadRequestException('정산이 진행되고 있어 참여할 수 없습니다.');
    }

    // 첫 입장 시 메세지 전송 여부 확인
    const sendMessage =
      roomUser?.status == RoomUserStatus.JOINED ? false : true;

    if (!roomUser) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.manager.save(RoomUser, {
          roomUuid: uuid,
          userUuid: userUuid,
          status: RoomUserStatus.JOINED,
        });

        // 증가된 참여 인원 수 확인
        const participantsNumber = await this.getParticipantsNumber(
          uuid,
          queryRunner,
        );
        if (participantsNumber != room.currentParticipant + 1) {
          this.logger.warn(
            `JOINED 상태인 방 유저 수와 참여 인원 수가 일치하지 않음!! roomUuid: ${room.uuid},  ${room.currentParticipant} != ${participantsNumber}`,
          );
        }
        await queryRunner.manager.update(
          Room,
          { uuid: uuid },
          { currentParticipant: participantsNumber },
        );

        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }

    return {
      sendMessage,
      room: await this.findOneWithRoomUsers(uuid, userUuid),
    };
  }

  async leaveRoom(uuid: string, userUuid: string): Promise<ResponseRoomDto> {
    const room = await this.findOne(uuid);

    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    const roomUser = await this.roomUserRepo.findOne({
      where: { roomUuid: uuid, userUuid: userUuid },
    });

    if (!roomUser) {
      throw new BadRequestException('방에 가입되어 있지 않습니다.');
    }

    if (room.status == RoomStatus.IN_SETTLEMENT) {
      throw new BadRequestException('이미 정산이 진행되고 있습니다.');
    }

    if (room.ownerUuid == userUuid) {
      throw new BadRequestException(
        '방장은 방을 나갈 수 없습니다. 방장을 위임해 주세요.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // RoomUser 삭제
      await queryRunner.manager.delete(RoomUser, {
        roomUuid: uuid,
        userUuid: userUuid,
      });

      // 참여 인원 감소 확인
      const participantsNumber = await this.getParticipantsNumber(
        uuid,
        queryRunner,
      );
      if (participantsNumber != room.currentParticipant - 1) {
        this.logger.warn(
          `JOINED 상태인 방 유저 수와 참여 인원 수가 일치하지 않음!! roomUuid: ${room.uuid},  ${room.currentParticipant} != ${participantsNumber}`,
        );
      }

      await queryRunner.manager.update(
        Room,
        { uuid: uuid },
        { currentParticipant: participantsNumber },
      );

      await queryRunner.commitTransaction();

      return await this.findOneWithRoomUsers(uuid);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async kickUserFromRoom(
    uuid: string,
    ownerUuid: string,
    kickedUserUuid: string,
    reason: string,
    userType: UserType,
  ) {
    const room = await this.findOne(uuid);
    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    const roomUser = await this.roomUserRepo.findOne({
      where: { roomUuid: uuid, userUuid: kickedUserUuid },
      relations: ['room'],
    });

    if (!roomUser || roomUser.status !== RoomUserStatus.JOINED) {
      throw new BadRequestException(
        '강퇴하려는 사용자가 방에 가입되어 있지 않습니다.',
      );
    }

    if (room.ownerUuid != ownerUuid && userType != UserType.admin) {
      throw new UnauthorizedException('방장이나 관리자가 아닙니다.');
    }

    if (room.ownerUuid == kickedUserUuid) {
      throw new BadRequestException('방장은 강퇴할 수 없습니다.');
    }

    if (room.status == RoomStatus.IN_SETTLEMENT) {
      throw new BadRequestException(
        '정산이 진행되고 있어 사용자를 강퇴할 수 없습니다.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.debug(`Kicking user ${kickedUserUuid} from room ${uuid}`);

      // RoomUser 상태 변경
      const updateResult = await queryRunner.manager.update(
        RoomUser,
        { roomUuid: uuid, userUuid: kickedUserUuid },
        { status: RoomUserStatus.KICKED, kickedReason: reason },
      );

      if (updateResult.affected === 0) {
        throw new Error('RoomUser 상태 업데이트 실패');
      }

      // 참여 인원 감소 확인
      const participantsNumber = await this.getParticipantsNumber(
        uuid,
        queryRunner,
      );
      if (participantsNumber != room.currentParticipant - 1) {
        this.logger.warn(
          `JOINED 상태인 방 유저 수와 참여 인원 수가 일치하지 않음!! roomUuid: ${room.uuid}, participantsNumber: ${participantsNumber}, currentParticipant: ${room.currentParticipant - 1}`,
        );
      }

      await queryRunner.manager.update(
        Room,
        { uuid: uuid },
        { currentParticipant: participantsNumber },
      );

      await queryRunner.commitTransaction();

      return await this.findOneWithRoomUsers(uuid);
    } catch (err) {
      this.logger.error(`Error in kickUserFromRoom: ${err.message}`, err.stack);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getParticipantsNumber(uuid: string, queryRunner?: QueryRunner) {
    const manager = queryRunner
      ? queryRunner.manager.getRepository(RoomUser)
      : this.roomUserRepo;
    // STATUS가 JOINED인 ROOM_USER의 개수를 반환
    return manager.count({
      where: { roomUuid: uuid, status: RoomUserStatus.JOINED },
    });
  }

  async delegateRoom(uuid: string, ownerUuid: string, newOwnerUuid: string) {
    const room = await this.findOne(uuid);
    const roomUser = await this.roomUserRepo.findOne({
      where: {
        roomUuid: uuid,
        userUuid: newOwnerUuid,
        status: RoomUserStatus.JOINED,
      },
      relations: ['room'],
    });
    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    if (room.status !== RoomStatus.ACTIVATED) {
      throw new BadRequestException(
        '방장을 위임할 수 있는 방 상태가 아닙니다. 정산이 요청되기 전까지만 방장을 위임할 수 있습니다. 현재 방 상태: ' +
          room.status,
      );
    }

    if (room.ownerUuid != ownerUuid) {
      throw new UnauthorizedException('방장이 아닙니다.');
    }

    if (room.ownerUuid == newOwnerUuid) {
      throw new BadRequestException(
        '자기 자신에게 방장 권한을 위임할 수 없습니다.',
      );
    }

    if (!roomUser) {
      throw new BadRequestException('유저가 방에 가입되어 있지 않습니다.');
    }

    await this.roomRepo.update({ uuid: uuid }, { ownerUuid: newOwnerUuid });

    return await this.roomRepo.findOne({
      where: { uuid: uuid },
    });
  }

  async requestSettlement(
    uuid: string,
    userUuid: string,
    dto: CreateSettlementDto,
  ) {
    return this.roomSettlementService.requestSettlement(uuid, userUuid, dto);
  }

  async updateSettlement(
    uuid: string,
    userUuid: string,
    dto: UpdateSettlementDto,
  ) {
    return this.roomSettlementService.updateSettlement(uuid, userUuid, dto);
  }

  async cancelSettlement(uuid: string, userUuid: string) {
    return this.roomSettlementService.cancelSettlement(uuid, userUuid);
  }

  async getSettlement(roomUuid: string) {
    return this.roomSettlementService.getSettlement(roomUuid);
  }

  async getUserPayStatus(roomUuid: string, userUuid: string) {
    return this.roomSettlementService.getUserPayStatus(roomUuid, userUuid);
  }

  async updateRoomUserIsPaid(
    roomUuid: string,
    userUuid: string,
    isPaid: boolean,
  ) {
    return this.roomSettlementService.updateRoomUserIsPaid(
      roomUuid,
      userUuid,
      isPaid,
    );
  }

  async completeRoom(uuid: string, userUuid: string, userType: UserType) {
    return this.roomSettlementService.completeRoom(uuid, userUuid, userType);
  }

  async saveLastReadChat(roomUuid: string, userUuid: string) {
    const roomUser = await this.roomUserRepo.findOne({
      where: { roomUuid, userUuid },
    });
    if (!roomUser) {
      throw new BadRequestException('방에 가입되어 있지 않습니다.');
    }

    const lastReadMessageUuid = await this.chatService
      .getLastMessageOfRoom(roomUuid)
      .then((message) => message?.uuid);

    await this.roomUserRepo.update(
      { roomUuid, userUuid },
      { lastReadChatUuid: lastReadMessageUuid },
    );

    return await this.roomUserRepo.findOne({
      where: { roomUuid, userUuid },
    });
  }

  async updateMuteStatus(uuid: string, userUuid: string, isMuted: boolean) {
    const roomUser = await this.roomUserRepo.findOne({
      where: { roomUuid: uuid, userUuid },
    });

    if (!roomUser) {
      throw new BadRequestException('방에 가입되어 있지 않습니다.');
    }

    await this.roomUserRepo.update(
      { roomUuid: uuid, userUuid },
      { isMuted: isMuted },
    );

    return await this.roomUserRepo.findOne({
      where: { roomUuid: uuid, userUuid },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sendDepartureAlert() {
    const targetRooms = await this.getDepartureAlertTargetRooms();

    for (const room of targetRooms) {
      const leftMinutes = Math.ceil(
        (new Date(room.departureTime).getTime() - new Date().getTime()) /
          (1000 * 60),
      );
      this.fcmService
        .sendPushNotificationByUserUuid(
          room.roomUsers.map((ru) => ru.userUuid),
          '출발 알림',
          `방 "${room.title}"의 출발이 ${leftMinutes}분 남았습니다.`,
          {
            roomUuid: room.uuid,
          },
        )
        .then(
          () => {
            // 출발 알림 전송 여부 업데이트
            this.roomRepo.update(
              { uuid: room.uuid },
              { departureAlertSent: true },
            );
          },
          (error) => {
            this.logger.error(
              `출발 알림 전송에 실패했습니다. 방 UUID: ${room.uuid}\n${error.message}`,
            );
          },
        );
    }
  }

  private getDepartureAlertTargetRooms() {
    return this.roomRepo.find({
      where: {
        // 출발 30분보다 이전인 방들을 가져옴
        departureTime: Between(
          new Date(),
          new Date(Date.now() + 30 * 60 * 1000),
        ),
        departureAlertSent: false,
        status: RoomStatus.ACTIVATED,
        roomUsers: {
          status: RoomUserStatus.JOINED,
        },
      },
      relations: ['roomUsers'],
    });
  }

  getRoomDiff(originalRoom: Room, updatedRoom: Room): Record<string, any> {
    const diff = {};

    // CreateRoomDto 인스턴스를 생성하고 instanceToPlain으로 변환해 키 추출
    // Object.keys(new CreateRoomDto())는 런타임에 키 추출이 안될 수 있음
    const dtoInstance = new CreateRoomDto();
    const dtoPlain = instanceToPlain(dtoInstance);
    const dtoKeys = Object.keys(dtoPlain);

    for (const key of dtoKeys) {
      const originalValue = originalRoom[key];
      const updatedValue = updatedRoom[key];

      // Date 타입 비교
      if (originalValue instanceof Date && updatedValue instanceof Date) {
        if (originalValue.getTime() !== updatedValue.getTime()) {
          diff[key] = updatedValue;
        }
      } else if (originalValue !== updatedValue) {
        diff[key] = updatedValue;
      }
    }
    return diff;
  }

  private formatKst(date: Date | string): string {
    const target = typeof date === 'string' ? new Date(date) : date;
    return target.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  generateRoomUpdateMessage(
    originalRoom: Room,
    roomDiff: Record<string, any>,
  ): string {
    const changes: string[] = [];

    if (roomDiff.title) {
      changes.push(`제목: ${originalRoom.title} → ${roomDiff.title}`);
    }
    if (
      roomDiff.description !== undefined &&
      originalRoom.description !== roomDiff.description
    ) {
      const originalDesc = originalRoom.description || '(설명 없음)';
      const newDesc = roomDiff.description || '(설명 없음)';
      changes.push(`설명: ${originalDesc} → ${newDesc}`);
    }
    if (roomDiff.maxParticipant) {
      changes.push(
        `최대 인원: ${originalRoom.maxParticipant}명 → ${roomDiff.maxParticipant}명`,
      );
    }
    if (roomDiff.departureLocation) {
      changes.push(
        `출발지: ${originalRoom.departureLocation} → ${roomDiff.departureLocation}`,
      );
    }
    if (roomDiff.destinationLocation) {
      changes.push(
        `도착지: ${originalRoom.destinationLocation} → ${roomDiff.destinationLocation}`,
      );
    }
    if (roomDiff.departureTime) {
      const originalTime = this.formatKst(originalRoom.departureTime);
      const newTime = this.formatKst(roomDiff.departureTime);
      changes.push(`출발 시각: ${originalTime} → ${newTime}`);
    }

    return `방 정보가 수정되었습니다.\n${changes.join('\n')}`;
  }

  async deleteAll(roomUuid?: string) {
    if (roomUuid) {
      await this.findOne(roomUuid);
      await this.roomRepo.delete({ uuid: roomUuid });
    } else {
      await this.dataSource
        .createQueryBuilder()
        .delete()
        .from('room')
        .execute();
    }
  }

  async cancelKickUserFromRoom(
    roomUuid: string,
    ownerUuid: string,
    kickedUserUuid: string,
    userType: UserType,
  ) {
    // 방장 또는 관리자만 가능
    if (userType !== UserType.admin) {
      const room = await this.findOne(roomUuid);
      if (room.ownerUuid !== ownerUuid) {
        throw new UnauthorizedException(
          '방장 또는 관리자만 강퇴를 취소할 수 있습니다.',
        );
      }
    }

    this.logger.debug(
      `Canceling kick for user ${kickedUserUuid} from room ${roomUuid}`,
    );

    // KICKED 상태인 RoomUser 찾기
    const roomUser = await this.roomUserRepo.findOne({
      where: {
        roomUuid: roomUuid,
        userUuid: kickedUserUuid,
        status: RoomUserStatus.KICKED,
      },
    });

    if (!roomUser) {
      throw new NotFoundException('강퇴된 사용자를 찾을 수 없습니다.');
    }

    // RoomUser 데이터 삭제
    await this.roomUserRepo.delete({
      roomUuid: roomUuid,
      userUuid: kickedUserUuid,
    });

    return await this.findOneWithRoomUsers(roomUuid);
  }

  // 통계 데이터 로직
  async getRoomStatistics(
    startDate: string,
    endDate: string,
  ): Promise<{ [key: string]: RoomStatisticsDto }> {
    const data: { [key: string]: RoomStatisticsDto } = {};

    const query_start = moment(startDate);
    const query_end = moment(endDate);

    const query_idx = query_start.clone();

    while (query_idx.isBefore(query_end)) {
      const targetMonth = query_idx.format('YYYY-MM');
      const targetStartDate = query_idx.format('YYYY-MM-DD');
      // 1달 더하기
      query_idx.add(1, 'M');

      const targetEndDate = query_idx.format('YYYY-MM-DD');

      // 상태별 카운트 (DB GROUP BY)
      const statusRows = await this.roomRepo
        .createQueryBuilder('room')
        .select('room.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('room.createdAt BETWEEN :start AND :end', {
          start: targetStartDate,
          end: targetEndDate,
        })
        .groupBy('room.status')
        .getRawMany();

      const statusCounts: Record<string, number> = { total: 0 };

      for (const row of statusRows) {
        const key = row.status as string;
        const count = parseInt(row.count);
        if (key) {
          statusCounts[key] = count;
          statusCounts.total += count;
        }
      }

      // 출발지/도착지 GROUP BY (DB 레벨)
      const departureRows = await this.roomRepo
        .createQueryBuilder('room')
        .select('room.departureLocation', 'location')
        .addSelect('COUNT(*)', 'count')
        .where('room.createdAt BETWEEN :start AND :end', {
          start: targetStartDate,
          end: targetEndDate,
        })
        .groupBy('room.departureLocation')
        .getRawMany();

      const departureLocationCounts: Record<string, number> = { total: 0 };
      for (const row of departureRows) {
        if (row.location) {
          departureLocationCounts[row.location] = parseInt(row.count);
          departureLocationCounts.total += parseInt(row.count);
        }
      }

      const destinationRows = await this.roomRepo
        .createQueryBuilder('room')
        .select('room.destinationLocation', 'location')
        .addSelect('COUNT(*)', 'count')
        .where('room.createdAt BETWEEN :start AND :end', {
          start: targetStartDate,
          end: targetEndDate,
        })
        .groupBy('room.destinationLocation')
        .getRawMany();

      const destinationLocationCounts: Record<string, number> = { total: 0 };
      for (const row of destinationRows) {
        if (row.location) {
          destinationLocationCounts[row.location] = parseInt(row.count);
          destinationLocationCounts.total += parseInt(row.count);
        }
      }

      data[targetMonth] = {
        statusCounts,
        departureLocationCounts,
        destinationLocationCounts,
      } as RoomStatisticsDto;
    }

    return data;
  }
}
