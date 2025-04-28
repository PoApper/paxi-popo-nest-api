import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiHideProperty } from '@nestjs/swagger';

import { ChatMessageType } from 'src/chat/entities/chat.meta';
import { Room } from 'src/room/entities/room.entity';
import { User } from 'src/user/entities/user.entity';
import { Base } from 'src/common/base.entity';
@Entity()
export class Chat extends Base {
  @PrimaryGeneratedColumn('increment')
  @ApiHideProperty()
  @Exclude()
  id: number;

  @Column({ type: 'uuid', unique: true })
  uuid: string;

  @Column({ nullable: false })
  roomUuid: string;

  // 시스템 메시지인 경우 null(ex. 출발 시간 안내, 입퇴장 안내 메세지 등)
  @Column({ nullable: true })
  senderUuid: string;

  @Column({ nullable: false, type: 'text' })
  message: string;

  // TODO: varchar를 사용하면 성능 문제가 발생할 수 있음
  @Column({
    // NOTE: 테스트 시 사용되는 SQLite에서 enum 지원을 안 하기 때문에 테스트 환경에서는 varchar type으로 설정
    type: process.env.NODE_ENV === 'test' ? 'varchar' : 'enum',
    enum: process.env.NODE_ENV === 'test' ? undefined : ChatMessageType,
    nullable: true,
    default: ChatMessageType.TEXT,
  })
  messageType: ChatMessageType;

  /**
   * Database Relation
   */

  @ManyToOne(() => Room, (room) => room.chats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roomUuid' })
  @ApiHideProperty()
  room: Room;

  @ManyToOne(() => User, (user) => user.chats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'senderUuid' })
  @ApiHideProperty()
  sender: User;
}
