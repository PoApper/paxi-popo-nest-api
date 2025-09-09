import {
  Column,
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
import { Base } from 'src/common/base.entity';

import { UserStatus, UserType } from '../user.meta';
import { Account } from './account.entity';
import { Nickname } from './nickname.entity';

@Entity()
@Unique(['email'])
export class User extends Base {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  name: string;

  @Column({ name: 'user_type', nullable: false, default: UserType.student })
  userType: UserType;

  @Column({
    name: 'user_status',
    nullable: false,
    default: UserStatus.deactivated,
  })
  userStatus: UserStatus;

  // 아래 변수들은 DATABASE_SYNC=true일 때 개발 DB에 있는 값들을 삭제시키지 않고 유지시키기 위해 살려둔 것들임
  // TODO: popo-nest-api에서만 변경할 수 있게 해야함
  // 여기서는 변경될 수 없음
  @Column({ nullable: false })
  @Exclude()
  @ApiHideProperty()
  password: string;

  // 여기서는 변경될 수 없음
  @Column({ name: 'crypto_salt', nullable: false })
  @Exclude()
  @ApiHideProperty()
  cryptoSalt: string;

  @Column({ name: 'hashed_refresh_token', nullable: true })
  hashedRefreshToken: string;

  @Column({ name: 'refresh_token_expires_at', nullable: true })
  refreshTokenExpiresAt: Date;

  // 여기서는 변경될 수 없음
  @Column({ name: 'last_login_at', nullable: true })
  @Exclude()
  @ApiHideProperty()
  lastLoginAt: Date;

  /**
   * Database Relation
   */

  @OneToMany(() => Room, (room) => room.owner)
  @ApiHideProperty()
  ownRooms: Room[];

  @OneToMany(() => Room, (room) => room.payer)
  @ApiHideProperty()
  payRooms: Room[];

  @OneToMany(() => RoomUser, (roomUser) => roomUser.user)
  @ApiHideProperty()
  roomUsers: RoomUser[];

  @OneToMany(() => FcmKey, (fcmKey) => fcmKey.user)
  @ApiHideProperty()
  pushKeys: FcmKey[];

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
