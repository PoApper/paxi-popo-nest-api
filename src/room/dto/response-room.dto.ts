import { ApiProperty, OmitType } from '@nestjs/swagger';

import { Room } from '../entities/room.entity';
import { MyRoomUserDto } from './my-room-user.dto';
import { RoomParticipantDto } from './room-participant.dto';

export class ResponseRoomDto extends OmitType(Room, [
  'payerEncryptedAccountNumber',
  'departureAlertSent',
  'roomUsers',
]) {
  @ApiProperty({ required: false })
  payerAccountNumber?: string; // 복호화된 계좌번호

  @ApiProperty({ type: MyRoomUserDto, required: false })
  myRoomUser?: MyRoomUserDto;

  @ApiProperty({ type: [RoomParticipantDto], required: false })
  roomUsers?: RoomParticipantDto[];

  constructor(
    room: Room,
    options?: {
      payerAccountNumber?: string;
      myRoomUser?: MyRoomUserDto;
      includeRoomUsers?: boolean;
    },
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
    this.payerAccountHolderName = room.payerAccountHolderName;
    this.payerBankName = room.payerBankName;
    this.createdAt = room.createdAt;
    this.updatedAt = room.updatedAt;

    this.payerAccountNumber = options?.payerAccountNumber;

    this.myRoomUser = options?.myRoomUser;

    if (options?.includeRoomUsers && room.roomUsers) {
      this.roomUsers = room.roomUsers.map((ru) => new RoomParticipantDto(ru));
    }
  }
}
