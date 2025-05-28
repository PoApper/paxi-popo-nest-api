import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { NotFoundException } from '@nestjs/common';

import { Room } from 'src/room/entities/room.entity';

export class ResponseSettlementDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  roomUuid: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  payerUuid: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '분석적인_철_9002',
  })
  payerNickname: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '3333-3333-3333-3333',
  })
  payerAccountNumber: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '포닉스',
  })
  payerAccountHolderName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '국민은행',
  })
  payerBankName: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 10000,
  })
  payAmount: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 3,
  })
  currentParticipant: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 3334,
  })
  payAmountPerPerson: number;

  constructor(
    room: Room,
    payerNickname: string,
    account: {
      accountNumber: string | null;
      accountHolderName: string;
      bankName: string;
    },
    payAmountPerPerson: number,
  ) {
    if (!room.payAmount || !room.payerUuid) {
      throw new NotFoundException('정산 내역이 없습니다.');
    }
    if (
      !account ||
      !account.accountNumber ||
      !account.accountHolderName ||
      !account.bankName
    ) {
      throw new NotFoundException('정산자의 계좌 정보가 없습니다.');
    }
    this.roomUuid = room.uuid;
    this.payerUuid = room.payerUuid;
    this.payerNickname = payerNickname;
    this.payerAccountNumber = account.accountNumber;
    this.payerAccountHolderName = account.accountHolderName;
    this.payerBankName = account.bankName;
    this.payAmount = room.payAmount;
    this.currentParticipant = room.currentParticipant;
    this.payAmountPerPerson = payAmountPerPerson;
  }
}
