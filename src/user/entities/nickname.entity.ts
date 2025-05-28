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
@Entity('nickname')
export class Nickname extends Base {
  @PrimaryGeneratedColumn()
  @ApiHideProperty()
  @Exclude()
  id: number;

  @Column({ type: 'uuid', nullable: false, unique: true })
  userUuid: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  nickname: string;

  @OneToOne(() => User, (user) => user.nickname, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userUuid' })
  @ApiHideProperty()
  user: User;
}
