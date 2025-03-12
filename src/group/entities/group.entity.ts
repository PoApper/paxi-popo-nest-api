import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { GroupStatus } from 'src/group/entities/group.meta';

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  @OneToOne(() => User, (user) => user.uuid)
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

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  @OneToOne(() => User, (user) => user.uuid)
  payerUuid: string;

  @Column({ nullable: true })
  payAmount: number;
}
