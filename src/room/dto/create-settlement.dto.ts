import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSettlementDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 10000,
  })
  payAmount: number;

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
  @IsBoolean()
  @ApiProperty({
    description: '계좌 정보를 수정할 경우 true, 수정하지 않을 경우 false',
    example: true,
  })
  updateAccount: boolean;
}
