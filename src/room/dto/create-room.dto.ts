import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '캐리어 두 개 있습니다',
  })
  readonly description?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '포항역 가는 택시 같이 타요 🚕',
  })
  readonly title: string;

  @IsDate()
  @IsNotEmpty()
  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
  })
  readonly departureTime: Date;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '지곡회관',
  })
  readonly departureLocation: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '포항역',
  })
  readonly destinationLocation: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 4,
  })
  readonly maxParticipant: number;
}
