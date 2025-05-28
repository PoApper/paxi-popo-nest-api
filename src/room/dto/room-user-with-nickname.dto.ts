// dto/room-user-with-nickname.dto.ts
import { ApiProperty, PickType } from '@nestjs/swagger';

import { RoomUser } from 'src/room/entities/room-user.entity';

import { Room } from '../entities/room.entity';

// TODO: Swagger 문서화 간편하게 하는 개선방안 필요
export class RoomUserWithNicknameDto extends PickType(RoomUser, [
  'userUuid',
  'roomUuid',
  'status',
  'isPaid',
]) {
  @ApiProperty({ nullable: false })
  nickname: string;
}

export class RoomWithUsersDto extends PickType(Room, [
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
  @ApiProperty({
    type: [RoomUserWithNicknameDto],
  })
  room_users: RoomUserWithNicknameDto[];
}
