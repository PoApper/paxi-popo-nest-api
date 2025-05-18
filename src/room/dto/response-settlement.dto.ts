import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

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
}
