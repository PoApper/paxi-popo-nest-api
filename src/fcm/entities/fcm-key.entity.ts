import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

import { User } from 'src/user/entities/user.entity';
import { Base } from 'src/common/base.entity';
@Entity()
@Unique(['userUuid', 'pushKey'])
export class FcmKey extends Base {
  @PrimaryGeneratedColumn()
  @ApiHideProperty()
  @Exclude()
  id: number;

  @Column({ name: 'user_uuid', nullable: false })
  userUuid: string;

  @Column({ name: 'push_key', nullable: false }) // TODO: , unique: true. 개발 환경에서 여러 계정으로 테스트 할 때 에러 발생시키지 않기 위해 한시적으로 unique 조건은 뺌
  pushKey: string;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.pushKeys, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'uuid' })
  @ApiHideProperty()
  user: User;
}
