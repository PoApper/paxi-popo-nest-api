import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
export class CreateAccountDto {
  @ApiProperty({
    example: '1234-5678-9012-3456',
  })
  @Exclude()
  accountNumber: string;

  @ApiProperty({
    example: '포닉스',
  })
  accountHolderName: string;

  @ApiProperty({
    example: '국민은행',
  })
  bankName: string;
}
