import { ApiProperty } from '@nestjs/swagger';

import { RoomUserStatus } from 'src/room/entities/room-user.meta';
import { RoomUser } from 'src/room/entities/room-user.entity';

export class MyRoomUserDto {
  @ApiProperty({ example: RoomUserStatus.JOINED })
  status: RoomUserStatus;

  @ApiProperty({ example: false })
  isPaid: boolean;

  @ApiProperty({ example: false })
  isMuted: boolean;

  @ApiProperty({ example: '25c930d5-f38e-4f28-813b-82eb49acd606' })
  lastReadChatUuid: string;

  @ApiProperty({ example: '추방당했습니다.', nullable: true })
  kickedReason: string;

  @ApiProperty({ example: true })
  hasNewMessage: boolean;

  constructor(roomUser: RoomUser, hasNewMessage: boolean) {
    this.status = roomUser.status;
    this.isPaid = roomUser.isPaid;
    this.isMuted = roomUser.isMuted;
    this.lastReadChatUuid = roomUser.lastReadChatUuid;
    this.kickedReason = roomUser.kickedReason;
    this.hasNewMessage = hasNewMessage;
  }
}
