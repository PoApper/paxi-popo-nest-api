import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Group } from 'src/group/entities/group.entity';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
  ) {}

  create(user: JwtPayload, dto: CreateGroupDto) {
    return this.groupRepo.save({
      ...dto,
      ownerUuid: user.uuid,
    });
  }

  findAll() {
    return this.groupRepo.find();
  }

  findOne(uuid: string) {
    return this.groupRepo.findOneBy({ uuid: uuid });
  }

  update(uuid: string, updateGroupDto: UpdateGroupDto) {
    return this.groupRepo.update(
      { uuid: uuid },
      { ...updateGroupDto },
    );
  }

  remove(uuid: string) {
    return this.groupRepo.delete({ uuid: uuid });
  }
}
