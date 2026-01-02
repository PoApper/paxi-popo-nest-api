import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Room } from 'src/room/entities/room.entity';
import { RoomUser } from 'src/room/entities/room-user.entity';
import { UserType } from 'src/user/user.meta';
import { RoomUserStatus } from 'src/room/entities/room-user.meta';
import { RoomStatus } from 'src/room/entities/room.meta';
import { UserService } from 'src/user/user.service';
import { CreateSettlementDto } from 'src/room/dto/create-settlement.dto';
import { UpdateSettlementDto } from 'src/room/dto/update-settlement.dto';
import { ResponseSettlementDto } from 'src/room/dto/response-settlement.dto';

@Injectable()
export class RoomSettlementService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(RoomUser)
    private readonly roomUserRepo: Repository<RoomUser>,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {}

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

    if (room.status == RoomStatus.DELETED) {
      throw new BadRequestException('삭제된 방입니다.');
    }

    if (room.status == RoomStatus.COMPLETED) {
      throw new BadRequestException('정산이 종료된 방입니다.');
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

    if (room.status == RoomStatus.COMPLETED) {
      throw new BadRequestException('정산이 종료된 방입니다.');
    }

    if (room.status != RoomStatus.IN_SETTLEMENT) {
      throw new BadRequestException('정산이 진행되고 있지 않습니다.');
    }

    if (room.payerUuid != userUuid) {
      throw new UnauthorizedException(
        '정산자가 아니므로 정산 정보를 수정할 수 없습니다.',
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

      await queryRunner.manager.update(
        RoomUser,
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

    if (room.status == RoomStatus.COMPLETED) {
      throw new BadRequestException('정산이 종료된 방입니다.');
    }

    if (room.status != RoomStatus.IN_SETTLEMENT) {
      throw new BadRequestException('정산이 진행되고 있지 않습니다.');
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

    if (
      room.status != RoomStatus.IN_SETTLEMENT &&
      room.status != RoomStatus.COMPLETED
    ) {
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

  async getUserPayStatus(roomUuid: string, userUuid: string) {
    const room = await this.findOne(roomUuid);
    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    const roomUser = await this.roomUserRepo.findOne({
      where: { roomUuid, userUuid },
    });

    if (!roomUser) {
      throw new NotFoundException('유저가 방에 가입되어 있지 않습니다.');
    }

    return roomUser.isPaid;
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

    const result = await this.roomUserRepo.findOneOrFail({
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

  private calculatePayAmountPerPerson(
    payAmount: number,
    currentParticipant: number,
  ) {
    // NOTE: 서비스 이용약관에 따라 소수점은 올려서 계산함
    // 정산자가 정산 금액보다 최대 (currentParticipant-1)원 더 받을 수 있음
    return Math.ceil(payAmount / currentParticipant);
  }

  private async findOne(uuid: string) {
    const room = await this.roomRepo.findOne({
      where: { uuid: uuid },
    });

    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    return room;
  }
}
