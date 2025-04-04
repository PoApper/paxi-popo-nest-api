import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { GroupUserStatus } from 'src/group/entities/group.user.meta';
import { Group } from 'src/group/entities/group.entity';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class GroupUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  userUuid: string;

  @Column({ nullable: false })
  groupUuid: string;

  @Column({ nullable: false, default: GroupUserStatus.JOINED })
  status: GroupUserStatus;

  @Column({ nullable: false, default: false })
  isPaid: boolean;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.group_users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userUuid', referencedColumnName: 'uuid' })
  user: User;

  @ManyToOne(() => Group, (group) => group.group_users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupUuid', referencedColumnName: 'uuid' })
  group: Group;
}
