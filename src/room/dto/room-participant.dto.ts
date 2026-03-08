import { ApiProperty, PickType } from '@nestjs/swagger';

import { RoomUser } from 'src/room/entities/room-user.entity';

export class RoomParticipantDto extends PickType(RoomUser, [
  'userUuid',
  'roomUuid',
  'status',
  'isPaid',
  'lastReadChatUuid',
  'isMuted',
]) {
  @ApiProperty({ nullable: false })
  nickname: string;

  constructor(roomUser: RoomUser) {
    super();
    this.userUuid = roomUser.userUuid;
    this.roomUuid = roomUser.roomUuid;
    this.status = roomUser.status;
    this.isPaid = roomUser.isPaid;
    this.lastReadChatUuid = roomUser.lastReadChatUuid;
    this.isMuted = roomUser.isMuted;
    this.nickname = roomUser.user?.nickname?.nickname ?? '';
  }
}
