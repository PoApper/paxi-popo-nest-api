import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Room } from 'src/room/entities/room.entity';
import { RoomUser } from 'src/room/entities/room.user.entity';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { UserType } from 'src/user/user.meta';
import { RoomUserStatus } from 'src/room/entities/room.user.meta';
import { RoomStatus } from 'src/room/entities/room.meta';

import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(RoomUser)
    private readonly roomUserRepo: Repository<RoomUser>,
  ) {}

  async create(user: JwtPayload, dto: CreateRoomDto) {
    // 출발 시간 현재보다 이전인지 확인
    if (new Date(dto.departureTime) < new Date()) {
      throw new BadRequestException(
        '출발 시간은 현재 시간보다 이전일 수 없습니다.',
      );
    }

    const queryRunner = this.roomRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.save(Room, {
        ...dto,
        ownerUuid: user.uuid,
        room_users: [{ userUuid: user.uuid }],
      });

      await queryRunner.manager.save(RoomUser, {
        roomUuid: room.uuid,
        userUuid: user.uuid,
      });

      await queryRunner.commitTransaction();

      return await this.roomRepo.findOne({
        where: { uuid: room.uuid },
        relations: ['room_users'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return this.roomRepo.find();
  }

  findOne(uuid: string) {
    return this.roomRepo.findOneBy({ uuid: uuid });
  }

  findUsersByRoomUuid(uuid: string) {
    return this.roomUserRepo.findBy({ roomUuid: uuid });
  }

  async update(uuid: string, updateRoomDto: UpdateRoomDto, user: JwtPayload) {
    const room = await this.findOne(uuid);
    if (!room) {
      throw new BadRequestException('룸이 존재하지 않습니다.');
    }
    if (
      room.status == RoomStatus.COMPLETED ||
      room.status == RoomStatus.DELETED
    ) {
      throw new BadRequestException('이미 종료된 룸입니다.');
    }

    if (user.userType == UserType.admin || room?.ownerUuid == user.uuid) {
      // 출발 시간이 있다면 현재보다 이전인지 확인
      const departureTime = updateRoomDto.departureTime;
      if (departureTime && new Date(departureTime) < new Date()) {
        throw new BadRequestException(
          '출발 시간은 현재 시간보다 이전일 수 없습니다.',
        );
      }
    } else {
      throw new UnauthorizedException('방장 또는 관리자가 아닙니다.');
    }

    // TODO: update 시 리턴 값 findOne으로 변경
    return this.roomRepo.update({ uuid: uuid }, { ...updateRoomDto });
  }

  async remove(uuid: string, userUuid: string) {
    // TODO: delete 시 리턴 값 지워진 룸의 id를 리턴하도록 변경
    const room = await this.findOne(uuid);
    if (!room) {
      throw new BadRequestException('룸이 존재하지 않습니다.');
    }
    if (room.status == RoomStatus.DELETED) {
      throw new BadRequestException('이미 삭제된 룸입니다.');
    }
    if (room.ownerUuid != userUuid) {
      throw new UnauthorizedException('방장이 아닙니다.');
    }
    await this.roomRepo.update({ uuid: uuid }, { status: RoomStatus.DELETED });
    return uuid;
  }

  async joinRoom(uuid: string, userUuid: string) {
    const room = await this.findOne(uuid);
    if (!room) {
      throw new BadRequestException('룸이 존재하지 않습니다.');
    }
    if (room.status != RoomStatus.ACTIVATED) {
      throw new BadRequestException('현재 룸은 가입할 수 없습니다.');
    }

    const queryRunner = this.roomRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    const roomUser = await this.roomUserRepo.findOne({
      where: { roomUuid: uuid, userUuid: userUuid },
    });

    try {
      if (roomUser) {
        if (roomUser.status == RoomUserStatus.JOINED) {
          throw new BadRequestException('이미 가입된 룸입니다.');
        } else if (roomUser.status == RoomUserStatus.LEFT) {
          // 가입 상태로 변경
          await queryRunner.manager.update(
            RoomUser,
            { roomUuid: uuid, userUuid: userUuid },
            { status: RoomUserStatus.JOINED },
          );
        } else if (roomUser.status == RoomUserStatus.KICKED) {
          throw new BadRequestException('강퇴된 룸입니다.');
        }
      } else {
        // 참여 인원 증가
        const participantsNumber = await this.getParticipantsNumber(uuid);
        if (participantsNumber != room.currentParticipant) {
          // TODO: 로그로 변경
          console.log(
            'JOINED 상태인 룸 유저 수와 참여 인원 수가 일치하지 않음!!',
          );
        }
        await queryRunner.manager.update(
          Room,
          { uuid: uuid },
          { currentParticipant: participantsNumber + 1 },
        );

        await queryRunner.manager.save(RoomUser, {
          roomUuid: uuid,
          userUuid: userUuid,
        });
      }

      await queryRunner.commitTransaction();

      return await this.roomUserRepo.findOne({
        where: { roomUuid: uuid, userUuid: userUuid },
        relations: ['room'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // const roomUser = await this.roomUserRepo.findOneBy({
    //   roomUuid: uuid,
    //   userUuid: userUuid,
    // });
    // if (roomUser) {
    //   if (roomUser.status == RoomUserStatus.JOINED) {
    //     throw new BadRequestException('이미 가입된 룸입니다.');
    //   } else if (roomUser.status == RoomUserStatus.LEFT) {
    //     // 가입 상태로 변경
    //     return this.roomUserRepo.update(
    //       { roomUuid: uuid, userUuid: userUuid },
    //       { status: RoomUserStatus.JOINED },
    //     );
    //   } else if (roomUser.status == RoomUserStatus.KICKED) {
    //     throw new BadRequestException('강퇴된 룸입니다.');
    //   }
    // }

    // // 참여 인원 증가
    // await this.roomRepo.update(
    //   { uuid: uuid },
    //   { currentParticipant: room.currentParticipant + 1 },
    // );

    // return this.roomUserRepo.save({
    //   roomUuid: uuid,
    //   userUuid: userUuid,
    // });
  }

  async leaveRoom(uuid: string, userUuid: string) {
    const room = await this.findOne(uuid);
    if (!room) {
      throw new BadRequestException('룸이 존재하지 않습니다.');
    }

    const roomUser = await this.roomUserRepo.findOne({
      where: { roomUuid: uuid, userUuid: userUuid },
      relations: ['room'],
    });

    if (!roomUser) {
      throw new BadRequestException('룸에 가입되어 있지 않습니다.');
    }

    const queryRunner =
      this.roomUserRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      if (roomUser.room.ownerUuid == userUuid) {
        const newOwnerRoomUser = await this.roomUserRepo.findOneBy({
          roomUuid: uuid,
          // TODO: 방장이 특정 유저를 새로운 방장으로 지정할 수 있도록 변경
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
      // 참여 인원 감소
      const participantsNumber = await this.getParticipantsNumber(uuid);
      if (participantsNumber != room.currentParticipant) {
        // TODO: 로그로 변경
        console.log(
          'JOINED 상태인 룸 유저 수와 참여 인원 수가 일치하지 않음!!',
        );
      }
      await this.roomRepo.update(
        { uuid: uuid },
        { currentParticipant: participantsNumber - 1 },
      );
      // RoomUser 상태 변경
      await this.roomUserRepo.update(
        { roomUuid: uuid, userUuid: userUuid },
        { status: RoomUserStatus.LEFT },
      );

      await queryRunner.commitTransaction();
      // 탑승 인원을 감소시킨 룸 정보를 반환할수도?
      return await this.roomUserRepo.findOne({
        where: { roomUuid: uuid, userUuid: userUuid },
        relations: ['room'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async kickRoom(uuid: string, ownerUuid: string, userUuid: string) {
    const room = await this.findOne(uuid);
    if (!room) {
      throw new BadRequestException('룸이 존재하지 않습니다.');
    }

    const roomUser = await this.roomUserRepo.findOne({
      where: { roomUuid: uuid, userUuid: userUuid },
      relations: ['room'],
    });

    if (!roomUser) {
      throw new BadRequestException(
        '강퇴하려는 사용자가 룸에 가입되어 있지 않습니다.',
      );
    }

    if (room.ownerUuid != ownerUuid) {
      throw new UnauthorizedException('방장이 아닙니다.');
    }

    const queryRunner =
      this.roomUserRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // 참여 인원 감소
      const participantsNumber = await this.getParticipantsNumber(uuid);
      if (participantsNumber != room.currentParticipant) {
        // TODO: 로그로 변경
        console.log(
          'JOINED 상태인 룸 유저 수와 참여 인원 수가 일치하지 않음!!',
        );
      }
      await this.roomRepo.update(
        { uuid: uuid },
        { currentParticipant: participantsNumber - 1 },
      );
      // RoomUser 상태 변경
      await this.roomUserRepo.update(
        { roomUuid: uuid, userUuid: userUuid },
        { status: RoomUserStatus.KICKED },
      );

      await queryRunner.commitTransaction();

      return await this.roomUserRepo.findOne({
        where: { roomUuid: uuid, userUuid: userUuid },
        relations: ['room'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async completeRoom(uuid: string, userUuid: string) {
    const room = await this.findOne(uuid);
    if (!room) {
      throw new BadRequestException('룸이 존재하지 않습니다.');
    }

    if (room.ownerUuid != userUuid) {
      throw new UnauthorizedException('방장이 아닙니다.');
    }

    if (room.status == RoomStatus.COMPLETED) {
      throw new BadRequestException('이미 종료된 룸입니다.');
    }

    return this.roomRepo.update(
      { uuid: uuid },
      { status: RoomStatus.COMPLETED },
    );
  }

  async getParticipantsNumber(uuid: string) {
    // STATUS가 JOINED인 ROOM_USER의 개수를 반환
    return this.roomUserRepo.count({
      where: { roomUuid: uuid, status: RoomUserStatus.JOINED },
    });
  }
}
