import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { TokenExpiredError } from '@nestjs/jwt';

import { GuardName } from 'src/common/guard-name';
import { PUBLIC_GUARDS_KEY } from 'src/common/public-guard.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  constructor(private reflector: Reflector) {
    super();
  }

  handleRequest(err: any, user: any, info: any) {
    if (info instanceof TokenExpiredError) {
      this.logger.debug('TokenExpiredError details:', {
        name: info.name,
        message: info.message,
        expiredAt: info.expiredAt,
        currentTime: new Date(),
      });
      throw new UnauthorizedException({
        error: 'AccessTokenExpired',
        message: 'Access token has expired. Please use refresh token.',
      });
    }

    if (err || !user) {
      this.logger.debug('JWT Auth Error:', { err, user, info });
      throw new UnauthorizedException({
        error: 'Unauthorized',
        message: 'Invalid or missing access token.',
      });
    }

    // TODO: Public 데코레이터 적용
    return user;
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
