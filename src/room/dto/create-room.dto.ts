import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateRoomDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '캐리어 두 개 있습니다',
  })
  @Expose()
  readonly description?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '포항역 가는 택시 같이 타요 🚕',
  })
  @Expose()
  readonly title: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  @ApiProperty({
    example: '2026-01-01 12:00:00',
  })
  @Expose()
  readonly departureTime: Date;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '지곡회관',
  })
  @Expose()
  readonly departureLocation: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '포항역',
  })
  @Expose()
  readonly destinationLocation: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 4,
  })
  @Expose()
  readonly maxParticipant: number;
}
