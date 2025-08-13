// dto/room-user-with-nickname.dto.ts
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { instanceToPlain } from 'class-transformer';

import { RoomUser } from 'src/room/entities/room-user.entity';

import { Room } from '../entities/room.entity';
import { ResponseRoomDto } from './response-room.dto';

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

export class RoomWithUsersDto extends OmitType(ResponseRoomDto, [
  // 닉네임을 넣은 room_users를 만들기 위해 기존 room_users는 제외
  'room_users',
  'departureAlertSent',
]) {
  @ApiProperty({
    type: [RoomUserWithNicknameDto],
  })
  room_users: RoomUserWithNicknameDto[];

  constructor(room: Room, payerAccountNumber?: string) {
    super();
    const plain = instanceToPlain(room) as Record<string, unknown>;
    const rest: Record<string, unknown> = { ...plain };
    delete rest['room_users'];
    delete rest['departureAlertSent'];
    delete rest['payerEncryptedAccountNumber'];
    Object.assign(this, rest);

    this.payerAccountNumber = payerAccountNumber;

    this.room_users =
      room.room_users?.map((ru) => new RoomUserWithNicknameDto(ru)) ?? [];
  }
}
