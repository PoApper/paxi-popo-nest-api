import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

import { Base } from 'src/common/base.entity';

import { User } from './user.entity';
@Entity()
export class Account extends Base {
  @PrimaryGeneratedColumn()
  @ApiHideProperty()
  @Exclude()
  id: number;

  @Column({ type: 'uuid', nullable: false, unique: true })
  userUuid: string;

  @Column({ type: 'varchar', nullable: false })
  encryptedAccountNumber: string;

  @Column({ type: 'uuid', nullable: false })
  userUuid: string;

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
  @ApiHideProperty()
  user: User;
}
