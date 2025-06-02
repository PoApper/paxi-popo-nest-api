import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

import { GuardName } from 'src/common/guard-name';
import { PUBLIC_GUARDS_KEY } from 'src/common/public-guard.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 현재 실행되는 핸들러와 클래스에 적용된 메타데이터를 가져옴
    const publicGuardNames = this.reflector.getAllAndOverride<GuardName[]>(
      PUBLIC_GUARDS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Public이면 인증 없이 통과
    if (publicGuardNames?.includes(GuardName.JwtGuard)) {
      return true;
    }

    return super.canActivate(context);
  }
}
