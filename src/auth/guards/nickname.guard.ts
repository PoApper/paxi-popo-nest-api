import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';

import { GuardName } from 'src/common/guard-name';
import { PUBLIC_GUARDS_KEY } from 'src/common/public-guard.decorator';
import { UserService } from 'src/user/user.service';

import { AuthService } from '../auth.service';
import { JwtPayload } from '../strategies/jwt.payload';

@Injectable()
export class NicknameExistsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const publicGuardNames = this.reflector.getAllAndOverride<GuardName[]>(
      PUBLIC_GUARDS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (publicGuardNames?.includes(GuardName.NicknameGuard)) {
      return true;
    }

    // 닉네임이 토큰에 포함되어 있는지 확인
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();
    const user = request.user;
    const nickname = user.nickname;

    if (!nickname) {
      const userNickname = await this.userService.getNickname(
        user.uuid as string,
      );
      if (userNickname) {
        // 닉네임을 포함한 새로운 토큰 생성 및 쿠키 재발급
        const updatedPayload = {
          ...user,
          nickname: userNickname.nickname,
        } as JwtPayload;
        const tokens = await this.authService.generateTokens(updatedPayload);

        // 쿠키 재설정
        this.authService.setCookies(
          response,
          tokens.accessToken,
          tokens.refreshToken,
        );

        // request.user도 업데이트
        request.user.nickname = userNickname.nickname;
      } else {
        throw new UnauthorizedException(
          '닉네임이 존재하지 않습니다. 닉네임을 먼저 생성해주세요.',
        );
      }
    }

    return true;
  }
}
