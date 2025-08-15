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

  @Column({ name: 'title', nullable: false })
  title: string;

  @Column({ name: 'owner_uuid', nullable: false })
  ownerUuid: string;

  @Column({ name: 'departure_location', nullable: false })
  departureLocation: string;

  @Column({ name: 'destination_location', nullable: false })
  destinationLocation: string;

  @Column({ name: 'max_participant', nullable: false, default: 4 })
  maxParticipant: number;

  @Column({ name: 'current_participant', nullable: false, default: 1 })
  currentParticipant: number;

  @Column({ name: 'departure_time', nullable: false })
  departureTime: Date;

  @Column({ name: 'status', nullable: false, default: RoomStatus.ACTIVATED })
  status: RoomStatus;

  @Column({ name: 'description', nullable: true, type: 'text' })
  description: string;

  // 정산관련
  // NOTE: null 값을 넣기 위해서는 type을 명시해줘야 함
  @Column({ name: 'payer_uuid', type: 'uuid', nullable: true })
  payerUuid: string | null;

  // NOTE: 정산 요청 총 금액은 정수형으로 저장
  @Column({ name: 'pay_amount', type: 'int', nullable: true })
  payAmount: number | null;

  @Column({
    name: 'payer_encrypted_account_number',
    type: 'varchar',
    nullable: true,
  })
  payerEncryptedAccountNumber: string | null;

  @Column({
    name: 'payer_account_holder_name',
    type: 'varchar',
    nullable: true,
  })
  payerAccountHolderName: string | null;

  @Column({ name: 'payer_bank_name', type: 'varchar', nullable: true })
  payerBankName: string | null;

  @Column({
    name: 'departure_alert_sent',
    type: 'boolean',
    default: false,
    nullable: true,
  })
  departureAlertSent: boolean;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.own_rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'owner_uuid' })
  @ApiHideProperty()
  owner: User;

  @ManyToOne(() => User, (user) => user.pay_rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payer_uuid' })
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
