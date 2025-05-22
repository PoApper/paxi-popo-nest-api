import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

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
}
