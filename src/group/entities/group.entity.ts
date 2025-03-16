import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { GroupStatus } from 'src/group/entities/group.meta';
import { GroupUser } from 'src/group/entities/group.user.entity';

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false, collation: 'utf8mb4_general_ci' })
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

  @Column({ nullable: false, default: GroupStatus.ACTIVATED })
  status: GroupStatus;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, collation: 'utf8mb4_general_ci' })
  payerUuid: string;

  @Column({ nullable: true })
  payAmount: number;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.own_groups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerUuid' })
  owner: User;

  @ManyToOne(() => User, (user) => user.pay_groups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payerUuid' })
  payer: User;

  @OneToMany(() => GroupUser, (groupUser) => groupUser.group)
  group_users: GroupUser[];
}
