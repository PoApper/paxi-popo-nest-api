import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ChatMessageType } from 'src/chat/entities/chat.meta';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  groupUuid: string;

  // 시스템 메시지인 경우 null(ex. 출발 시간 안내, 입퇴장 안내 메세지 등)
  @Column({ nullable: true, collation: 'utf8mb4_general_ci' })
  senderUuid: string | null;

  @Column({ nullable: false, type: 'text' })
  message: string;

  @Column({ nullable: false })
  messageType: ChatMessageType;

  @CreateDateColumn()
  createdAt: Date;
}
