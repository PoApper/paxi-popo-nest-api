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

@Entity()
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  reporterUuid: string;

  @Column({ nullable: true })
  targetUserUuid: string;

  @Column({ nullable: true })
  targetRoomUuid: string;

  @Column({ nullable: true, type: 'text' })
  reason: string;

  @Column({ nullable: false, default: ReportStatus.PENDING })
  status: ReportStatus;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.reports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reporterUuid', referencedColumnName: 'uuid' })
  reporter: User;

  @ManyToOne(() => User, (user) => user.reported, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'targetUserUuid', referencedColumnName: 'uuid' })
  targetUser: User;

  @ManyToOne(() => User, (user) => user.reported, {
    onDelete: 'CASCADE',
  })
  targetRoom: Room;
}
