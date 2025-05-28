// dto/room-user-with-nickname.dto.ts
import { ApiProperty, PickType } from '@nestjs/swagger';
import { instanceToPlain } from 'class-transformer';

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

  constructor(roomUser: RoomUser) {
    super();
    const plain = instanceToPlain(roomUser);
    /* eslint-disable-next-line */
    const { user, kickedReason, ...rest } = plain;
    Object.assign(this, rest);
    this.nickname = roomUser.user.nickname.nickname;
  }
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

  constructor(room: Room) {
    super();
    const plain = instanceToPlain(room);
    Object.assign(this, plain);
    this.room_users =
      room.room_users?.map((ru) => new RoomUserWithNicknameDto(ru)) ?? [];
  }
}
