import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ResponseSettlementDto {
  @IsNotEmpty()
  @IsString()
  roomUuid: string;

  @IsNotEmpty()
  @IsString()
  payerUuid: string;

  @IsNotEmpty()
  @IsString()
  payerNickname: string;

  @IsNotEmpty()
  @IsString()
  payerAccountNumber: string;

  @IsNotEmpty()
  @IsString()
  payerAccountHolderName: string;

  @IsNotEmpty()
  @IsString()
  payerBankName: string;

  @IsNotEmpty()
  @IsNumber()
  payAmount: number;

  @IsNotEmpty()
  @IsNumber()
  currentParticipant: number;

  @IsNotEmpty()
  @IsNumber()
  payAmountPerPerson: number;
}
