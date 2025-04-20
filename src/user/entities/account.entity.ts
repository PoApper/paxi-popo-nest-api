import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity()
export class Account extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  accountNumber: string;

  @Column({ type: 'uuid', nullable: false })
  userUuid: string;

  @OneToOne(() => User, (user) => user.account, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userUuid' })
  user: User;
}
