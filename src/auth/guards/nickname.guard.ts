import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { GuardName } from 'src/common/guard-name';
import { PUBLIC_GUARDS_KEY } from 'src/common/public-guard.decorator';

@Injectable()
export class NicknameExistsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const publicGuardNames = this.reflector.getAllAndOverride<GuardName[]>(
      PUBLIC_GUARDS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (publicGuardNames?.includes(GuardName.NicknameGuard)) {
      return true;
    }

    // 닉네임이 토큰에 포함되어 있는지 확인
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const nickname = user.nickname;

    if (!nickname) {
      throw new UnauthorizedException(
        '닉네임이 존재하지 않습니다. 닉네임을 먼저 생성해주세요.',
      );
    }

    return true;
  }
}
