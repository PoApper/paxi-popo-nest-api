import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Group } from 'src/group/entities/group.entity';

import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { GroupUser } from 'src/group/entities/group.user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupUser])],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
