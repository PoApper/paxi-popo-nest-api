import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';
// Swagger 문서에 두 개 이상의 반환 타입을 담기 위해 DTO 사용
export class OnboardingStatusResponse {
  @ApiProperty({
    description: '유저가 온보딩을 한 경우 true, 아니면 false',
    example: true,
  })
  @IsBoolean()
  onboardingStatus: boolean;

  @ApiProperty({
    description: '유저가 온보딩을 한 경우 유저의 닉네임, 아니면 랜덤 닉네임',
    example: '행복한_포닉스_1234',
  })
  @IsString()
  nickname: string;
}
