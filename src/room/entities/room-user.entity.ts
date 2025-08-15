import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

import { RoomUserStatus } from 'src/room/entities/room-user.meta';
import { Room } from 'src/room/entities/room.entity';
import { User } from 'src/user/entities/user.entity';
import { Base } from 'src/common/base.entity';
@Entity()
export class RoomUser extends Base {
  @PrimaryGeneratedColumn()
  @ApiHideProperty()
  @Exclude()
  id: number;

  @Column({ name: 'user_uuid', nullable: false })
  userUuid: string;

  @Column({ name: 'room_uuid', nullable: false })
  roomUuid: string;

  @Column({ nullable: false, default: RoomUserStatus.JOINED })
  @ApiProperty({ example: RoomUserStatus.JOINED })
  status: RoomUserStatus;

  @Column({ name: 'is_paid', nullable: false, default: false })
  @ApiProperty({ example: false })
  isPaid: boolean;

  @Column({ name: 'kicked_reason', nullable: true })
  kickedReason: string;

  @Column({ name: 'last_read_chat_uuid', nullable: true })
  @ApiProperty({ example: '25c930d5-f38e-4f28-813b-82eb49acd606' })
  lastReadChatUuid: string;

  @Column({ name: 'is_muted', nullable: false, default: false })
  @ApiProperty({ example: false })
  isMuted: boolean;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.room_users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'uuid' })
  @ApiHideProperty()
  user: User;

  @ManyToOne(() => Room, (room) => room.room_users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'room_uuid', referencedColumnName: 'uuid' })
  @ApiHideProperty()
  room: Room;
}
