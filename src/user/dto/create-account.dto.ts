import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '1234-5678-9012-3456',
  })
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '포닉스',
  })
  accountHolderName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '국민은행',
  })
  bankName: string;
}
