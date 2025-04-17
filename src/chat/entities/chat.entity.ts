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
import { Room } from 'src/room/entities/room.entity';
import { User } from 'src/user/entities/user.entity';
// 커서 기반 채팅 데이터 조회를 위한 복합 인덱스 생성
@Index(['roomUuid', 'createdAt', 'id'])
@Entity()
export class Chat {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'uuid', unique: true /*, length: 36*/ })
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
    // type: 'enum', // NOTE: enum을 사용할 경우, 아래 문제는 해결되지만 sqlite에서 지원 안함
    nullable: true,
    default: ChatMessageType.TEXT,
    // enum: ChatMessageType, //NOTE: enum을 사용할 경우, SQL syntax error 발생.
  })
  messageType: ChatMessageType;

  @CreateDateColumn()
  createdAt: Date;

  /**
   * Database Relation
   */

  @ManyToOne(() => Room, (room) => room.chats, {
    onDelete: 'CASCADE',
  })
  // TODO: room uuid 크기 255바이트인데 36바이트로 제한해야 함
  @JoinColumn({ name: 'roomUuid' })
  room: Room;

  @ManyToOne(() => User, (user) => user.chats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'senderUuid' })
  sender: User;
}
