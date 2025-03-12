import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsOptional()
  readonly description?: string;

  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsDate()
  @IsNotEmpty()
  readonly departureTime: Date;

  @IsString()
  @IsNotEmpty()
  readonly departureLocation: string;

  @IsString()
  @IsNotEmpty()
  readonly destinationLocation: string;

  @IsNumber()
  @IsNotEmpty()
  readonly maxParticipant: number;
}
