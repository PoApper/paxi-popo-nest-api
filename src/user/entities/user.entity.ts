import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiHideProperty } from '@nestjs/swagger';

import { FcmKey } from 'src/fcm/entities/fcm-key.entity';
import { Room } from 'src/room/entities/room.entity';
import { RoomUser } from 'src/room/entities/room-user.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { Report } from 'src/report/entities/report.entity';

import { UserStatus, UserType } from '../user.meta';
import { Account } from './account.entity';
import { Nickname } from './nickname.entity';
@Entity()
@Unique(['email'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, default: UserType.student })
  userType: UserType;

  @Column({ nullable: false, default: UserStatus.deactivated })
  userStatus: UserStatus;

  // 아래 변수들은 DATABASE_SYNC=true일 때 개발 DB에 있는 값들을 삭제시키지 않고 유지시키기 위해 살려둔 것들임
  // TODO: popo-nest-api에서만 변경할 수 있게 해야함
  // 여기서는 변경될 수 없음
  @Column({ nullable: false })
  @Exclude()
  @ApiHideProperty()
  password: string;

  // 여기서는 변경될 수 없음
  @Column({ nullable: false })
  @Exclude()
  @ApiHideProperty()
  cryptoSalt: string;

  @Column({ nullable: true })
  hashedRefreshToken: string;

  @Column({ nullable: true })
  refreshTokenExpiresAt: Date;

  // 여기서는 변경될 수 없음
  @CreateDateColumn()
  @Exclude()
  @ApiHideProperty()
  createdAt: Date;

  // 여기서는 변경될 수 없음
  @Column()
  @Exclude()
  @ApiHideProperty()
  lastLoginAt: Date;

  /**
   * Database Relation
   */

  @OneToMany(() => Room, (room) => room.owner)
  @ApiHideProperty()
  own_rooms: Room[];

  @OneToMany(() => Room, (room) => room.payer)
  @ApiHideProperty()
  pay_rooms: Room[];

  @OneToMany(() => RoomUser, (room_user) => room_user.user)
  @ApiHideProperty()
  room_users: RoomUser[];

  @OneToMany(() => FcmKey, (fcm_key) => fcm_key.user)
  @ApiHideProperty()
  push_keys: FcmKey[];

  @OneToMany(() => Chat, (chat) => chat.sender)
  @ApiHideProperty()
  chats: Chat[];

  @OneToOne(() => Account, (account) => account.user)
  @ApiHideProperty()
  account: Account;

  @OneToMany(() => Report, (report) => report.reporter)
  @ApiHideProperty()
  reports: Report[];

  @OneToMany(() => Report, (report) => report.targetUser)
  @ApiHideProperty()
  reported: Report[];

  @OneToOne(() => Nickname, (nickname) => nickname.user)
  @ApiHideProperty()
  nickname: Nickname;
}
