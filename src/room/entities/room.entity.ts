import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';

import { User } from 'src/user/entities/user.entity';
import { RoomStatus } from 'src/room/entities/room.meta';
import { RoomUser } from 'src/room/entities/room-user.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { Report } from 'src/report/entities/report.entity';
import { Base } from 'src/common/base.entity';

@Entity()
export class Room extends Base {
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

  // 정산관련
  // NOTE: null 값을 넣기 위해서는 type을 명시해줘야 함
  @Column({ type: 'uuid', nullable: true })
  payerUuid: string | null;

  // NOTE: 정산 요청 총 금액은 정수형으로 저장
  @Column({ type: 'int', nullable: true })
  payAmount: number | null;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.own_rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerUuid' })
  @ApiHideProperty()
  owner: User;

  @ManyToOne(() => User, (user) => user.pay_rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payerUuid' })
  @ApiHideProperty()
  payer: User;

  @OneToMany(() => RoomUser, (room_user) => room_user.room)
  @ApiHideProperty()
  room_users: RoomUser[];

  @OneToMany(() => Chat, (chat) => chat.room)
  @ApiHideProperty()
  chats: Chat[];

  @OneToMany(() => Report, (report) => report.targetRoom)
  @ApiHideProperty()
  reported: Report[];
}
