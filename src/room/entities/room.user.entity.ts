import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

import { RoomUserStatus } from 'src/room/entities/room.user.meta';
import { Room } from 'src/room/entities/room.entity';
import { User } from 'src/user/entities/user.entity';
import { Base } from 'src/common/base.entity';
@Entity()
export class RoomUser extends Base {
  @PrimaryGeneratedColumn()
  @ApiHideProperty()
  @Exclude()
  id: number;

  @Column({ nullable: false })
  userUuid: string;

  @Column({ nullable: false })
  roomUuid: string;

  @Column({ nullable: false, default: RoomUserStatus.JOINED })
  status: RoomUserStatus;

  @Column({ nullable: false, default: false })
  @ApiProperty({ example: false })
  isPaid: boolean;

  @Column({ nullable: true })
  kickedReason: string;

  // TODO: 유저 별 정산 금액 추가

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.room_users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userUuid', referencedColumnName: 'uuid' })
  @ApiHideProperty()
  user: User;

  @ManyToOne(() => Room, (room) => room.room_users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roomUuid', referencedColumnName: 'uuid' })
  @ApiHideProperty()
  room: Room;
}
