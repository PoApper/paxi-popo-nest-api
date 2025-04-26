import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { OnboardingStatusResponse } from './dto/OnboardingStatusResponse.dto';
import { UserService } from './user.service';

@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('onboarding-status')
  @ApiOperation({
    summary: '유저의 온보딩 상태를 반환합니다.',
    description:
      'Paxi에 처음 방문하는 유저들을 온보딩 페이지로 리다이렉트 시키기 위한 엔드포인트입니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '유저와 대응되는 닉네임이 있다면 true와 해당 닉네임을 반환하고, 없다면 false와 랜덤 닉네임을 반환합니다.',
    type: OnboardingStatusResponse,
  })
  @ApiResponse({
    status: 401,
    description: '유저가 로그인하지 않은 경우',
  })
  @ApiResponse({
    status: 409,
    description:
      '낮은 확률이지만, 제한 횟수 초과로 랜덤 닉네임을 생성하는 데 실패한 경우',
  })
  async getOnboardingStatus(@Req() req) {
    const user = req.user as JwtPayload;
    const nickname = await this.userService.getNickname(user.uuid);
    if (nickname) {
      return {
        onboardingStatus: true,
        nickname: nickname.nickname,
      };
    }

    const randomNickname = await this.userService.generateRandomNickname();
    return {
      onboardingStatus: false,
      nickname: randomNickname,
    };
  }
}
