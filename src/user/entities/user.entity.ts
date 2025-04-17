import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { FcmKey } from 'src/fcm/entities/fcm.key.entity';
import { Room } from 'src/room/entities/room.entity';
import { RoomUser } from 'src/room/entities/room.user.entity';
import { Chat } from 'src/chat/entities/chat.entity';

import { UserStatus, UserType } from '../user.meta';
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
  password: string;

  // 여기서는 변경될 수 없음
  @Column({ nullable: false })
  cryptoSalt: string;

  // 여기서는 변경될 수 없음
  @CreateDateColumn()
  createdAt: Date;

  // 여기서는 변경될 수 없음
  @Column()
  lastLoginAt: Date;

  /**
   * Database Relation
   */

  @OneToMany(() => Room, (room) => room.owner)
  own_rooms: Room[];

  @OneToMany(() => Room, (room) => room.payer)
  pay_rooms: Room[];

  @OneToMany(() => RoomUser, (room_user) => room_user.user)
  room_users: RoomUser[];

  @OneToMany(() => FcmKey, (fcm_key) => fcm_key.user)
  push_keys: FcmKey[];

  @OneToMany(() => Chat, (chat) => chat.sender)
  chats: Chat[];

  // TODO: 계좌번호 추가
}
