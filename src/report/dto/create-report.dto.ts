import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '12345678-9abc-def1-2345-6789abcef123',
  })
  targetRoomUuid: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '12345678-9abc-def1-2345-6789abcef123',
  })
  targetUserUuid: string;

  @IsString()
  @ApiProperty({
    example: '이유 없이 방에서 강퇴당했습니다.',
  })
  reason: string;
}
