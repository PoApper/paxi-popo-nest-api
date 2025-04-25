import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity()
export class Account extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', nullable: false, unique: true })
  userUuid: string;

  @Column({ type: 'varchar', nullable: false })
  encryptedAccountNumber: string;

  @Column({ type: 'varchar', nullable: false })
  accountHolderName: string;

  @Column({ type: 'varchar', nullable: false })
  bankName: string;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.account, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userUuid' })
  user: User;
}
