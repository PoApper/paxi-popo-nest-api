import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ChatMessageType } from 'src/chat/entities/chat.meta';
import { Group } from 'src/group/entities/group.entity';
import { User } from 'src/user/entities/user.entity';
// 커서 기반 채팅 데이터 조회를 위한 복합 인덱스 생성
@Index(['groupUuid', 'createdAt', 'id'])
@Entity()
export class Chat {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'uuid', unique: true, length: 36 })
  uuid: string;

  @Column({ nullable: false })
  groupUuid: string;

  // 시스템 메시지인 경우 null(ex. 출발 시간 안내, 입퇴장 안내 메세지 등)
  @Column({ nullable: true })
  senderUuid: string;

  @Column({ nullable: false, type: 'text' })
  message: string;

  @Column({
    nullable: true,
    default: ChatMessageType.TEXT,
    type: 'enum',
    enum: ChatMessageType,
  })
  messageType: ChatMessageType;

  @CreateDateColumn()
  createdAt: Date;

  /**
   * Database Relation
   */

  @ManyToOne(() => Group, (group) => group.chats, {
    onDelete: 'CASCADE',
  })
  // TODO: group uuid 크기 255바이트인데 36바이트로 제한해야 함
  @JoinColumn({ name: 'groupUuid' })
  group: Group;

  @ManyToOne(() => User, (user) => user.chats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'senderUuid' })
  sender: User;
}
