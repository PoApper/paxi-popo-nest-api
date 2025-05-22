import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

import { UserStatus } from 'src/user/user.meta';
import { RoomUserStatus } from 'src/room/entities/room.user.meta';

import { Room } from '../entities/room.entity';

export class ResponseMyRoomDto extends PickType(Room, [
  'uuid',
  'title',
  'ownerUuid',
  'departureLocation',
  'destinationLocation',
  'maxParticipant',
  'currentParticipant',
  'departureTime',
  'status',
  'description',
  'payerUuid',
  'payAmount',
]) {
  @IsBoolean()
  @ApiProperty({ example: true })
  hasNewMessage: boolean;

  @IsString()
  @ApiProperty({
    example: '추방당했습니다.',
  })
  kickedReason: string;

  @IsString()
  @ApiProperty({
    example: 'JOINED',
  })
  userStatus: string;

  constructor(
    room: Room,
    userStatus: RoomUserStatus,
    kickedReason: string,
    hasNewMessage: boolean,
  ) {
    super();
    this.uuid = room.uuid;
    this.title = room.title;
    this.ownerUuid = room.ownerUuid;
    this.departureLocation = room.departureLocation;
    this.destinationLocation = room.destinationLocation;
    this.maxParticipant = room.maxParticipant;
    this.currentParticipant = room.currentParticipant;
    this.departureTime = room.departureTime;
    this.status = room.status;
    this.description = room.description;
    this.payerUuid = room.payerUuid;
    this.payAmount = room.payAmount;
    this.kickedReason = kickedReason;
    this.userStatus = userStatus;
    this.hasNewMessage = hasNewMessage;
  }
}
