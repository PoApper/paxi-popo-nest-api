import { ApiProperty, OmitType } from '@nestjs/swagger';

import { Room } from '../entities/room.entity';

export class ResponseRoomDto extends OmitType(Room, [
  'payerEncryptedAccountNumber',
]) {
  @ApiProperty({ required: false })
  payerAccountNumber?: string; // 복호화된 계좌번호
}
