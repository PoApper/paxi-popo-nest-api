import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from 'src/user/entities/user.entity';

@Entity()
export class PushKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  userUuid: string;

  @Column({ nullable: false })
  pushKey: string;

  /**
   * Database Relation
   */

  @ManyToOne(() => User, (user) => user.push_keys, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userUuid', referencedColumnName: 'uuid' })
  user: User;
}
