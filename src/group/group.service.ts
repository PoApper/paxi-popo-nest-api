import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Group } from 'src/group/entities/group.entity';
import { GroupUser } from 'src/group/entities/group.user.entity';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { UserType } from 'src/user/user.meta';

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

    // TODO: 트랜잭션 처리하기

    const group = await this.groupRepo.save({
      ...dto,
      ownerUuid: user.uuid,
      group_users: [{ userUuid: user.uuid }],
    });

    await this.groupUserRepo.save({
      groupUuid: group.uuid,
      userUuid: user.uuid,
    });

    return await this.groupRepo.findOne({
      where: { uuid: group.uuid },
      relations: ['group_users'],
    });
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
    // TODO: kick 상태일때 조인 못하도록
    // TODO: 이미 가입되어 있을 때 조인 못하도록
    return this.groupUserRepo.save({
      groupUuid: uuid,
      userUuid: userUuid,
    });
  }

  async leaveGroup(uuid: string, userUuid: string) {
    const groupUser = await this.groupUserRepo.findOneBy({
      groupUuid: uuid,
      userUuid: userUuid,
    });

    if (!groupUser) {
      throw new BadRequestException('그룹에 가입되어 있지 않습니다.');
    }

    // TODO: 방장이 나가면 방장이 넘겨주기(?) - 방장이 나가면 자동으로 넘어가는 방식

    return this.groupUserRepo.delete({ id: groupUser.id });
  }
}
