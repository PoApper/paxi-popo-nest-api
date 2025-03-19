import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Group } from 'src/group/entities/group.entity';
import { GroupUser } from 'src/group/entities/group.user.entity';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { UserType } from 'src/user/user.meta';
import { GroupUserStatus } from 'src/group/entities/group.user.meta';
import { GroupStatus } from 'src/group/entities/group.meta';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(GroupUser)
    private readonly groupUserRepo: Repository<GroupUser>,
  ) {}

  async create(user: JwtPayload, dto: CreateGroupDto) {
    // 출발 시간 현재보다 이전인지 확인
    if (new Date(dto.departureTime) < new Date()) {
      throw new BadRequestException(
        '출발 시간은 현재 시간보다 이전일 수 없습니다.',
      );
    }

    const queryRunner = this.groupRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const group = await queryRunner.manager.save(Group, {
        ...dto,
        ownerUuid: user.uuid,
        group_users: [{ userUuid: user.uuid }],
      });

      await queryRunner.manager.save(GroupUser, {
        groupUuid: group.uuid,
        userUuid: user.uuid,
      });

      await queryRunner.commitTransaction();

      return await this.groupRepo.findOne({
        where: { uuid: group.uuid },
        relations: ['group_users'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return this.groupRepo.find();
  }

  findOne(uuid: string) {
    return this.groupRepo.findOneBy({ uuid: uuid });
  }

  findUsersByGroupUuid(uuid: string) {
    return this.groupUserRepo.findBy({ groupUuid: uuid });
  }

  async update(uuid: string, updateGroupDto: UpdateGroupDto, user: JwtPayload) {
    const group = await this.findOne(uuid);
    if (!group) {
      throw new BadRequestException('그룹이 존재하지 않습니다.');
    }
    if (
      group.status == GroupStatus.COMPLETED ||
      group.status == GroupStatus.DELETED
    ) {
      throw new BadRequestException('이미 종료된 그룹입니다.');
    }

    if (user.userType == UserType.admin || group?.ownerUuid == user.uuid) {
      // 출발 시간이 있다면 현재보다 이전인지 확인
      const departureTime = updateGroupDto.departureTime;
      if (departureTime && new Date(departureTime) < new Date()) {
        throw new BadRequestException(
          '출발 시간은 현재 시간보다 이전일 수 없습니다.',
        );
      }
    } else {
      throw new UnauthorizedException('방장 또는 관리자가 아닙니다.');
    }

    // TODO: update 시 리턴 값 findOne으로 변경
    return this.groupRepo.update({ uuid: uuid }, { ...updateGroupDto });
  }

  async remove(uuid: string, userUuid: string) {
    // TODO: delete 시 리턴 값 지워진 그룹의 id를 리턴하도록 변경
    const group = await this.findOne(uuid);
    if (!group) {
      throw new BadRequestException('그룹이 존재하지 않습니다.');
    }
    if (group.status == GroupStatus.DELETED) {
      throw new BadRequestException('이미 삭제된 그룹입니다.');
    }
    if (group.ownerUuid != userUuid) {
      throw new UnauthorizedException('방장이 아닙니다.');
    }
    await this.groupRepo.update(
      { uuid: uuid },
      { status: GroupStatus.DELETED },
    );
    return uuid;
  }

  async joinGroup(uuid: string, userUuid: string) {
    const group = await this.findOne(uuid);
    if (!group) {
      throw new BadRequestException('그룹이 존재하지 않습니다.');
    }
    if (group.status != GroupStatus.ACTIVATED) {
      throw new BadRequestException('현재 그룹은 가입할 수 없습니다.');
    }

    const queryRunner = this.groupRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    const groupUser = await this.groupUserRepo.findOne({
      where: { groupUuid: uuid, userUuid: userUuid },
    });

    try {
      if (groupUser) {
        if (groupUser.status == GroupUserStatus.JOINED) {
          throw new BadRequestException('이미 가입된 그룹입니다.');
        } else if (groupUser.status == GroupUserStatus.LEFT) {
          // 가입 상태로 변경
          await queryRunner.manager.update(
            GroupUser,
            { groupUuid: uuid, userUuid: userUuid },
            { status: GroupUserStatus.JOINED },
          );
        } else if (groupUser.status == GroupUserStatus.KICKED) {
          throw new BadRequestException('강퇴된 그룹입니다.');
        }
      } else {
        // 참여 인원 증가
        const participantsNumber = await this.getParticipantsNumber(uuid);
        if (participantsNumber != group.currentParticipant) {
          // TODO: 로그로 변경
          console.log(
            'JOINED 상태인 그룹 유저 수와 참여 인원 수가 일치하지 않음!!',
          );
        }
        await queryRunner.manager.update(
          Group,
          { uuid: uuid },
          { currentParticipant: participantsNumber + 1 },
        );

        await queryRunner.manager.save(GroupUser, {
          groupUuid: uuid,
          userUuid: userUuid,
        });
      }

      await queryRunner.commitTransaction();

      return await this.groupUserRepo.findOne({
        where: { groupUuid: uuid, userUuid: userUuid },
        relations: ['group'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // const groupUser = await this.groupUserRepo.findOneBy({
    //   groupUuid: uuid,
    //   userUuid: userUuid,
    // });
    // if (groupUser) {
    //   if (groupUser.status == GroupUserStatus.JOINED) {
    //     throw new BadRequestException('이미 가입된 그룹입니다.');
    //   } else if (groupUser.status == GroupUserStatus.LEFT) {
    //     // 가입 상태로 변경
    //     return this.groupUserRepo.update(
    //       { groupUuid: uuid, userUuid: userUuid },
    //       { status: GroupUserStatus.JOINED },
    //     );
    //   } else if (groupUser.status == GroupUserStatus.KICKED) {
    //     throw new BadRequestException('강퇴된 그룹입니다.');
    //   }
    // }

    // // 참여 인원 증가
    // await this.groupRepo.update(
    //   { uuid: uuid },
    //   { currentParticipant: group.currentParticipant + 1 },
    // );

    // return this.groupUserRepo.save({
    //   groupUuid: uuid,
    //   userUuid: userUuid,
    // });
  }

  async leaveGroup(uuid: string, userUuid: string) {
    const group = await this.findOne(uuid);
    if (!group) {
      throw new BadRequestException('그룹이 존재하지 않습니다.');
    }

    const groupUser = await this.groupUserRepo.findOne({
      where: { groupUuid: uuid, userUuid: userUuid },
      relations: ['group'],
    });

    if (!groupUser) {
      throw new BadRequestException('그룹에 가입되어 있지 않습니다.');
    }

    const queryRunner =
      this.groupUserRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      if (groupUser.group.ownerUuid == userUuid) {
        const newOwnerGroupUser = await this.groupUserRepo.findOneBy({
          groupUuid: uuid,
          // TODO: 방장이 특정 유저를 새로운 방장으로 지정할 수 있도록 변경
          userUuid: Not(userUuid),
          status: GroupUserStatus.JOINED,
        });

        if (!newOwnerGroupUser) {
          throw new BadRequestException(
            '위임된 방장이 없어 방을 나갈 수 없습니다.',
          );
        }

        await queryRunner.manager.update(
          Group,
          { uuid: uuid },
          { ownerUuid: newOwnerGroupUser.userUuid },
        );
      }
      // 참여 인원 감소
      const participantsNumber = await this.getParticipantsNumber(uuid);
      if (participantsNumber != group.currentParticipant) {
        // TODO: 로그로 변경
        console.log(
          'JOINED 상태인 그룹 유저 수와 참여 인원 수가 일치하지 않음!!',
        );
      }
      await this.groupRepo.update(
        { uuid: uuid },
        { currentParticipant: participantsNumber - 1 },
      );
      // GroupUser 상태 변경
      await this.groupUserRepo.update(
        { groupUuid: uuid, userUuid: userUuid },
        { status: GroupUserStatus.LEFT },
      );

      await queryRunner.commitTransaction();
      // 탑승 인원을 감소시킨 그룹 정보를 반환할수도?
      return await this.groupUserRepo.findOne({
        where: { groupUuid: uuid, userUuid: userUuid },
        relations: ['group'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async kickGroup(uuid: string, ownerUuid: string, userUuid: string) {
    const group = await this.findOne(uuid);
    if (!group) {
      throw new BadRequestException('그룹이 존재하지 않습니다.');
    }

    const groupUser = await this.groupUserRepo.findOne({
      where: { groupUuid: uuid, userUuid: userUuid },
      relations: ['group'],
    });

    if (!groupUser) {
      throw new BadRequestException(
        '강퇴하려는 사용자가 그룹에 가입되어 있지 않습니다.',
      );
    }

    if (group.ownerUuid != ownerUuid) {
      throw new UnauthorizedException('방장이 아닙니다.');
    }

    const queryRunner =
      this.groupUserRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // 참여 인원 감소
      const participantsNumber = await this.getParticipantsNumber(uuid);
      if (participantsNumber != group.currentParticipant) {
        // TODO: 로그로 변경
        console.log(
          'JOINED 상태인 그룹 유저 수와 참여 인원 수가 일치하지 않음!!',
        );
      }
      await this.groupRepo.update(
        { uuid: uuid },
        { currentParticipant: participantsNumber - 1 },
      );
      // GroupUser 상태 변경
      await this.groupUserRepo.update(
        { groupUuid: uuid, userUuid: userUuid },
        { status: GroupUserStatus.KICKED },
      );

      await queryRunner.commitTransaction();

      return await this.groupUserRepo.findOne({
        where: { groupUuid: uuid, userUuid: userUuid },
        relations: ['group'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async completeGroup(uuid: string, userUuid: string) {
    const group = await this.findOne(uuid);
    if (!group) {
      throw new BadRequestException('그룹이 존재하지 않습니다.');
    }

    if (group.ownerUuid != userUuid) {
      throw new UnauthorizedException('방장이 아닙니다.');
    }

    if (group.status == GroupStatus.COMPLETED) {
      throw new BadRequestException('이미 종료된 그룹입니다.');
    }

    return this.groupRepo.update(
      { uuid: uuid },
      { status: GroupStatus.COMPLETED },
    );
  }

  async getParticipantsNumber(uuid: string) {
    // STATUS가 JOINED인 GROUP_USER의 개수를 반환
    return this.groupUserRepo.count({
      where: { groupUuid: uuid, status: GroupUserStatus.JOINED },
    });
  }
}
