import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateSettlementDto {
  @IsNotEmpty()
  @IsUUID()
  payerUuid: string;

  @IsNotEmpty()
  @IsNumber()
  payAmount: number;

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
  @IsBoolean()
  updateAccountNumber: boolean;
}
