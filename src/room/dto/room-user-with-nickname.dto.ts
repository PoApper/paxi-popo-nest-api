// dto/room-user-with-nickname.dto.ts
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { instanceToPlain } from 'class-transformer';

import { RoomUser } from 'src/room/entities/room-user.entity';

import { Room } from '../entities/room.entity';

// TODO: Swagger 문서화 간편하게 하는 개선방안 필요
export class RoomUserWithNicknameDto extends OmitType(RoomUser, [
  'kickedReason',
]) {
  @ApiProperty({ nullable: false })
  nickname: string;

  constructor(roomUser: RoomUser) {
    super();
    const plain = instanceToPlain(roomUser);
    /* eslint-disable-next-line */
    const { user, kickedReason, ...rest } = plain;
    Object.assign(this, rest);
    this.nickname = user.nickname.nickname;
  }
}

export class RoomWithUsersDto extends OmitType(Room, [
  // 닉네임을 넣은 room_users를 만들기 위해 기존 room_users는 제외
  'room_users',
  'departureAlertSent',
]) {
  @ApiProperty({
    type: [RoomUserWithNicknameDto],
  })
  room_users: RoomUserWithNicknameDto[];

  constructor(room: Room) {
    super();
    const plain = instanceToPlain(room);
    /* eslint-disable-next-line */
    const { room_users, departureAlertSent, ...rest } = plain;
    Object.assign(this, rest);
    this.room_users =
      room_users?.map((ru) => new RoomUserWithNicknameDto(ru)) ?? [];
  }
}
