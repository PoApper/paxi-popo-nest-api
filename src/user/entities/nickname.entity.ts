import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

import { Base } from 'src/common/base.entity';

import { User } from './user.entity';
@Entity()
export class Nickname extends Base {
  @PrimaryGeneratedColumn()
  @ApiHideProperty()
  @Exclude()
  id: number;

  @Column({ name: 'user_uuid', type: 'uuid', nullable: false, unique: true })
  userUuid: string;

  @Column({ name: 'nickname', type: 'varchar', length: 20, nullable: false })
  nickname: string;

  @OneToOne(() => User, (user) => user.nickname, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_uuid' })
  @ApiHideProperty()
  user: User;
}
