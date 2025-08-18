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

  @Column({ name: 'user_uuid', type: 'uuid', nullable: false, unique: true })
  userUuid: string;

  @Column({
    name: 'encrypted_account_number',
    type: 'varchar',
    nullable: false,
  })
  @ApiHideProperty()
  @Exclude()
  encryptedAccountNumber: string;

  @Column({ name: 'account_holder_name', type: 'varchar', nullable: false })
  accountHolderName: string;

  @Column({ name: 'bank_name', type: 'varchar', nullable: false })
  bankName: string;

  @OneToOne(() => User, (user) => user.account, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_uuid' })
  @ApiHideProperty()
  user: User;
}
