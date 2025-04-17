import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { RoomStatus } from 'src/room/entities/room.meta';
import { RoomUser } from 'src/room/entities/room.user.entity';
import { Chat } from 'src/chat/entities/chat.entity';
@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  ownerUuid: string;

  @Column({ nullable: false })
  departureLocation: string;

  @Column({ nullable: false })
  destinationLocation: string;

  @Column({ nullable: false, default: 4 })
  maxParticipant: number;

  @Column({ nullable: false, default: 1 })
  currentParticipant: number;

  @Column({ nullable: false })
  departureTime: Date;

  @Column({ nullable: false, default: RoomStatus.ACTIVATED })
  status: RoomStatus;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true }) // , collation: 'utf8mb4_general_ci'
  payerUuid: string;

  @Column({ nullable: true })
  payAmount: number;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.own_rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerUuid' })
  owner: User;

  @ManyToOne(() => User, (user) => user.pay_rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payerUuid' })
  payer: User;

  @OneToMany(() => RoomUser, (room_user) => room_user.room)
  room_users: RoomUser[];

  @OneToMany(() => Chat, (chat) => chat.room)
  chats: Chat[];
}
