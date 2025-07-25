import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MoreThan, Not, Repository, DataSource, Between } from 'typeorm';
import { QueryRunner } from 'typeorm/query-runner/QueryRunner';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { instanceToPlain } from 'class-transformer';

import { Room } from 'src/room/entities/room.entity';
import { RoomUser } from 'src/room/entities/room-user.entity';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { UserType } from 'src/user/user.meta';
import { RoomUserStatus } from 'src/room/entities/room-user.meta';
import { RoomStatus } from 'src/room/entities/room.meta';
import { UserService } from 'src/user/user.service';
import { ChatService } from 'src/chat/chat.service';
import { ResponseMyRoomDto } from 'src/room/dto/response-myroom.dto';
import { FcmService } from 'src/fcm/fcm.service';

import { RoomWithUsersDto } from './dto/room-user-with-nickname.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UpdateSettlementDto } from './dto/update-settlement.dto';
import { ResponseSettlementDto } from './dto/response-settlement.dto';

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
        room_users: [{ userUuid: userUuid }],
      });

      await queryRunner.manager.save(RoomUser, {
        roomUuid: room.uuid,
        userUuid: userUuid,
      });

      await queryRunner.commitTransaction();

      return await this.findOneWithRoomUsers(room.uuid);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    // NOTE: 프론트에서 필터링을 하기 때문에 페이지네이션을 하지 않는다.
    return this.roomRepo.find({
      where: {
        status: RoomStatus.ACTIVATED,
        departureTime: MoreThan(new Date()),
      },
      order: { departureTime: 'ASC' },
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

  async findOneWithRoomUsers(uuid: string): Promise<RoomWithUsersDto> {
    const room = await this.roomRepo.findOne({
      where: { uuid: uuid },
      relations: ['room_users', 'room_users.user.nickname'],
    });

    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    return new RoomWithUsersDto(room);
  }

  async findMyRoomByUserUuid(userUuid: string) {
    // JOINED 및 KICKED 상태인 방 모두 조회
    const rooms: Room[] = await this.roomRepo.find({
      where: {
        room_users: { userUuid: userUuid },
        status: Not(RoomStatus.DELETED),
      },
      select: {
        room_users: {
          userUuid: false,
          status: true,
          kickedReason: true,
          lastReadChatUuid: true,
        },
      },
      relations: ['room_users'],
    });

    return await Promise.all(
      rooms.map(async (room) => {
        const lastChat = await this.chatService.getLastMessageOfRoom(room.uuid);
        const hasNewMessage =
          lastChat?.uuid != room.room_users[0].lastReadChatUuid;

        return new ResponseMyRoomDto(
          room,
          room.room_users[0].status,
          room.room_users[0].kickedReason,
          hasNewMessage,
        );
      }),
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
    const room = await this.findOne(uuid);

    if (
      room.status == RoomStatus.COMPLETED ||
      room.status == RoomStatus.DELETED
    ) {
      throw new BadRequestException('이미 종료된 방입니다.');
    }

    if (!(user.userType == UserType.admin || room?.ownerUuid == user.uuid)) {
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
    let departureAlertSent = room.departureAlertSent;
    if (updateRoomDto.departureTime) {
      departureAlertSent = false;
    }

    await this.roomRepo.update(
      { uuid: uuid },
      { ...updateRoomDto, departureAlertSent: departureAlertSent },
    );

    return await this.findOne(uuid);
  }

  async remove(uuid: string, userUuid: string) {
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
    if (room.ownerUuid != userUuid) {
      throw new UnauthorizedException('방장이 아닙니다.');
    }
    await this.roomRepo.update({ uuid: uuid }, { status: RoomStatus.DELETED });
    return uuid;
  }

  async joinRoom(
    uuid: string,
    userUuid: string,
  ): Promise<{ sendMessage: boolean; room: RoomWithUsersDto }> {
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
      room: await this.findOneWithRoomUsers(uuid),
    };
  }

  async leaveRoom(uuid: string, userUuid: string): Promise<RoomWithUsersDto> {
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (room.ownerUuid == userUuid) {
        const newOwnerRoomUser = await this.roomUserRepo.findOneBy({
          roomUuid: uuid,
          userUuid: Not(userUuid),
          status: RoomUserStatus.JOINED,
        });

        if (!newOwnerRoomUser) {
          throw new BadRequestException(
            '위임된 방장이 없어 방을 나갈 수 없습니다.',
          );
        }

        await queryRunner.manager.update(
          Room,
          { uuid: uuid },
          { ownerUuid: newOwnerRoomUser.userUuid },
        );
      }

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

    if (room.ownerUuid != ownerUuid) {
      throw new UnauthorizedException('방장이 아닙니다.');
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

    await this.roomRepo.update(
      { uuid: uuid },
      { ownerUuid: newOwnerUuid, status: RoomStatus.ACTIVATED },
    );

    return await this.roomRepo.findOne({
      where: { uuid: uuid },
    });
  }

  async requestSettlement(
    uuid: string,
    userUuid: string,
    dto: CreateSettlementDto,
  ) {
    const room = await this.findOne(uuid);
    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    if (room.status == RoomStatus.IN_SETTLEMENT) {
      throw new BadRequestException('이미 정산이 진행되고 있습니다.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.updateAccount) {
        await this.userService.createOrUpdateAccount(
          userUuid,
          dto.payerAccountNumber,
          dto.payerAccountHolderName,
          dto.payerBankName,
          queryRunner,
        );
      }

      await queryRunner.manager.update(
        Room,
        { uuid: uuid },
        {
          status: RoomStatus.IN_SETTLEMENT,
          payerUuid: userUuid,
          payAmount: dto.payAmount,
          payerEncryptedAccountNumber: this.userService.encryptAccountNumber(
            dto.payerAccountNumber,
          ),
          payerAccountHolderName: dto.payerAccountHolderName,
          payerBankName: dto.payerBankName,
        },
      );

      await queryRunner.manager.update(
        RoomUser,
        { roomUuid: uuid, userUuid: userUuid },
        { isPaid: true },
      );
      await queryRunner.commitTransaction();
      return await this.getSettlement(uuid);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateSettlement(
    uuid: string,
    userUuid: string,
    dto: UpdateSettlementDto,
  ) {
    const room = await this.findOne(uuid);
    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    if (room.payerUuid != userUuid) {
      throw new UnauthorizedException(
        '정산자가 아니므로 정산 정보를 수정할 수 없습니다.',
      );
    }

    if (room.status != RoomStatus.IN_SETTLEMENT) {
      throw new BadRequestException(
        '정산 정보를 수정할 수 있는 방 상태가 아닙니다.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.updateAccount) {
        await this.userService.createOrUpdateAccount(
          userUuid,
          dto.payerAccountNumber,
          dto.payerAccountHolderName,
          dto.payerBankName,
          queryRunner,
        );
      }

      await queryRunner.manager.update(
        Room,
        { uuid: uuid },
        {
          status: RoomStatus.IN_SETTLEMENT,
          payAmount: dto.payAmount,
          payerEncryptedAccountNumber: dto.payerAccountNumber
            ? this.userService.encryptAccountNumber(dto.payerAccountNumber)
            : room.payerEncryptedAccountNumber,
          payerAccountHolderName: dto.payerAccountHolderName,
          payerBankName: dto.payerBankName,
        },
      );

      await this.roomUserRepo.update(
        {
          roomUuid: uuid,
          status: RoomUserStatus.JOINED,
          userUuid: Not(userUuid),
        },
        { isPaid: false },
      );

      await queryRunner.commitTransaction();

      return await this.getSettlement(uuid);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelSettlement(uuid: string, userUuid: string) {
    const room = await this.findOne(uuid);
    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    if (room.status != RoomStatus.IN_SETTLEMENT) {
      throw new BadRequestException(
        '정산이 진행되고 있지 않으므로 정산 요청을 취소할 수 없습니다.',
      );
    }

    if (room.payerUuid != userUuid) {
      throw new UnauthorizedException(
        '정산자가 아니므로 정산 요청을 취소할 수 없습니다.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        RoomUser,
        { roomUuid: uuid, status: RoomUserStatus.JOINED },
        { isPaid: false },
      );
      await queryRunner.manager.update(
        Room,
        { uuid: uuid },
        {
          status: RoomStatus.ACTIVATED,
          // NOTE: update에 undefined를 넣으면 무시됨, 값을 초기화하고 싶으면 null을 넣어야 함
          payerUuid: null,
          payAmount: null,
          payerEncryptedAccountNumber: null,
          payerAccountHolderName: null,
          payerBankName: null,
        },
      );
      await queryRunner.commitTransaction();

      return await this.roomRepo.findOne({
        where: { uuid: uuid },
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getSettlement(roomUuid: string) {
    const room = await this.roomRepo.findOne({
      where: {
        uuid: roomUuid,
      },
    });

    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    if (room.status != RoomStatus.IN_SETTLEMENT) {
      throw new BadRequestException('정산이 진행되고 있지 않습니다.');
    }

    if (!room.payAmount || !room.payerUuid) {
      throw new NotFoundException('정산 내역이 없습니다.');
    }

    if (
      !room.payerEncryptedAccountNumber ||
      !room.payerAccountHolderName ||
      !room.payerBankName
    ) {
      throw new NotFoundException('정산자의 계좌 정보가 없습니다.');
    }

    const decryptedAccountNumber = this.userService.decryptAccountNumber(
      room.payerEncryptedAccountNumber,
    );

    const payAmountPerPerson = this.calculatePayAmountPerPerson(
      room.payAmount,
      room.currentParticipant,
    );

    const payerNickname = await this.userService.getNickname(room.payerUuid);
    if (!payerNickname) {
      throw new NotFoundException('정산자 닉네임을 찾을 수 없습니다.');
    }

    // Settlement DTO의 내용을 리턴함
    return new ResponseSettlementDto(
      room,
      payerNickname.nickname,
      decryptedAccountNumber,
      room.payerAccountHolderName,
      room.payerBankName,
      payAmountPerPerson,
    );
  }

  async updateRoomUserIsPaid(
    roomUuid: string,
    userUuid: string,
    isPaid: boolean,
  ) {
    const room = await this.findOne(roomUuid);
    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    if (room.status != RoomStatus.IN_SETTLEMENT || room.payerUuid == null) {
      throw new BadRequestException('정산이 진행되고 있지 않습니다.');
    }

    const roomUser = await this.roomUserRepo.findOne({
      where: { roomUuid, userUuid },
    });

    if (!roomUser || roomUser.status !== RoomUserStatus.JOINED) {
      throw new BadRequestException('방에 가입되어 있지 않습니다.');
    }

    await this.roomUserRepo.update({ roomUuid, userUuid }, { isPaid });

    const result = await this.roomUserRepo.findOne({
      where: { roomUuid, userUuid },
    });

    return { payerUuid: room.payerUuid, roomUser: result };
  }

  async completeRoom(uuid: string, userUuid: string, userType: UserType) {
    const room = await this.findOne(uuid);
    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    if (userUuid != room.payerUuid && userType != UserType.admin) {
      throw new UnauthorizedException('정산자 또는 관리자가 아닙니다.');
    }

    if (room.status == RoomStatus.COMPLETED) {
      throw new BadRequestException('이미 종료된 방입니다.');
    }

    await this.roomRepo.update(
      { uuid: uuid },
      { status: RoomStatus.COMPLETED },
    );

    return await this.roomRepo.findOne({
      where: { uuid: uuid },
    });
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
          room.room_users.map((ru) => ru.userUuid),
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

  private calculatePayAmountPerPerson(
    payAmount: number,
    currentParticipant: number,
  ) {
    // NOTE: 서비스 이용약관에 따라 소수점은 올려서 계산함
    // 정산자가 정산 금액보다 최대 (currentParticipant-1)원 더 받을 수 있음
    return Math.ceil(payAmount / currentParticipant);
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
        room_users: {
          status: RoomUserStatus.JOINED,
        },
      },
      relations: ['room_users'],
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
      const originalTime = originalRoom.departureTime.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const newTime = new Date(roomDiff.departureTime).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      changes.push(`출발 시간: ${originalTime} → ${newTime}`);
    }

    return `방 정보가 수정되었습니다.\n${changes.join('\n')}`;
  }
}
