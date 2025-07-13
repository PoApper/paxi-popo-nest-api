// dto/room-user-with-nickname.dto.ts
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { instanceToPlain } from 'class-transformer';

import { RoomUser } from 'src/room/entities/room-user.entity';

import { Room } from '../entities/room.entity';

// TODO: Swagger 문서화 간편하게 하는 개선방안 필요
export class RoomUserWithNicknameDto extends OmitType(RoomUser, [
  'user',
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
    this.nickname = roomUser.user.nickname.nickname;
  }
}

export class RoomWithUsersDto extends OmitType(Room, [
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
    // 위에서 OmitType으로 departureAlertSent를 컴파일 타임에 제외했어도 런타임에서도 제외해주기 위해 한 번 더 걸러 줌
    /* eslint-disable-next-line */
    const { room_users, departureAlertSent, ...rest } = plain;
    Object.assign(this, rest);
    this.room_users =
      room.room_users?.map((ru) => new RoomUserWithNicknameDto(ru)) ?? [];
  }
}
