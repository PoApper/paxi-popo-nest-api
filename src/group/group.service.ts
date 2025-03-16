import {
  BadRequestException,
  Injectable, InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Group } from 'src/group/entities/group.entity';
import { GroupUser } from 'src/group/entities/group.user.entity';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { UserType } from 'src/user/user.meta';
import { GroupUserStatus } from 'src/group/entities/group.user.meta';

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

    return this.groupRepo.update({ uuid: uuid }, { ...updateGroupDto });
  }

  remove(uuid: string) {
    return this.groupRepo.delete({ uuid: uuid });
  }

  async joinGroup(uuid: string, userUuid: string) {
    const group = await this.findOne(uuid);
    if (!group) {
      throw new BadRequestException('그룹이 존재하지 않습니다.');
    }

    const groupUser = await this.groupUserRepo.findOneBy({
      groupUuid: uuid,
      userUuid: userUuid,
    });
    if (groupUser) {
      if (groupUser.status == GroupUserStatus.KICKED) {
        throw new BadRequestException('강퇴된 사용자입니다.');
      } else throw new BadRequestException('이미 가입되어 있습니다.');
    }

    return this.groupUserRepo.save({
      groupUuid: uuid,
      userUuid: userUuid,
    });
  }

  async leaveGroup(uuid: string, userUuid: string) {
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
          userUuid: Not(userUuid),
        });

        if (!newOwnerGroupUser) {
          throw new BadRequestException('방장이 없어 방을 나갈 수 없습니다.');
        }

        await queryRunner.manager.update(
          Group,
          { uuid: uuid },
          { ownerUuid: newOwnerGroupUser.userUuid },
        );
      }
      const result = await this.groupUserRepo.delete({ id: groupUser.id });
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
