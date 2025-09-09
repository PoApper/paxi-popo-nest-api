import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ReportStatus } from 'src/report/entities/report.meta';
import { User } from 'src/user/entities/user.entity';
import { Room } from 'src/room/entities/room.entity';
import { Base } from 'src/common/base.entity';

@Entity()
export class Report extends Base {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'reporter_uuid', nullable: false })
  reporterUuid: string;

  @Column({ name: 'target_user_uuid', nullable: true })
  targetUserUuid: string;

  @Column({ name: 'target_room_uuid', nullable: true })
  targetRoomUuid: string;

  @Column({ nullable: true, type: 'text' })
  reason: string;

  // 관리자 처리 결과 메시지
  @Column({ name: 'resolution_message', nullable: true, type: 'text' })
  resolutionMessage: string;

  // 처리한 관리자 UUID
  @Column({ name: 'resolver_uuid', nullable: true })
  resolverUuid: string;

  // 처리한 관리자 이름
  @Column({ name: 'resolver_name', nullable: true })
  resolverName: string;

  // 처리 날짜
  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @Column({ nullable: false, default: ReportStatus.PENDING })
  status: ReportStatus;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.reports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reporter_uuid', referencedColumnName: 'uuid' })
  reporter: User;

  @ManyToOne(() => User, (user) => user.reported, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'target_user_uuid', referencedColumnName: 'uuid' })
  targetUser: User;

  @ManyToOne(() => Room, (room) => room.reported, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'target_room_uuid', referencedColumnName: 'uuid' })
  targetRoom: Room;
}
