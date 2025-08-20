import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { UserType } from 'src/user/user.meta';
import { GuardName } from 'src/common/guard-name';
import { PublicGuard } from 'src/common/public-guard.decorator';

import { JwtPayload } from './strategies/jwt.payload';
import { AuthService } from './auth.service';

const requiredRoles = [UserType.admin, UserType.association, UserType.staff];

@ApiCookieAuth()
@PublicGuard([GuardName.NicknameGuard])
@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  @Get(['verifyToken', 'verifyToken/admin'])
  verifyToken(@Req() req: Request) {
    const path = req.path;
    const user = req.user as JwtPayload;
    if (path.includes('admin')) {
      if (!requiredRoles.some((role) => user.userType?.includes(role))) {
        throw new UnauthorizedException();
      }
    }
    return user;
  }

  private parseTimeToMs(timeStr: string): number {
    // Simple parser for common time formats like '7d', '1h', '30m', '60s'
    const match = timeStr.match(/^(\d+)([dhms])$/);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000; // days to ms
      case 'h':
        return value * 60 * 60 * 1000; // hours to ms
      case 'm':
        return value * 60 * 1000; // minutes to ms
      case 's':
        return value * 1000; // seconds to ms
      default:
        return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    }
  }

  @Post('refresh')
  @PublicGuard([GuardName.JwtGuard, GuardName.NicknameGuard])
  @ApiOperation({
    summary: '리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '새로운 토큰이 쿠키에 설정됩니다.',
  })
  @ApiResponse({
    status: 401,
    description: '리프레시 토큰이 유효하지 않습니다.',
  })
  // eslint-disable-next-line @typescript-eslint/require-await
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.Refresh as string;

    if (!refreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 없습니다.');
    }

    try {
      const payload = this.authService.verifyRefreshToken(refreshToken);
      const tokens = this.authService.generateTokens(payload);

      this.setCookies(res, tokens.accessToken, tokens.refreshToken);

      return res.json({ message: '토큰이 갱신되었습니다.' });
    } catch {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }
  }

  setCookies(res: Response, accessToken: string, refreshToken: string): void {
    const domain =
      process.env.NODE_ENV === 'prod'
        ? 'popo.poapper.club'
        : process.env.NODE_ENV === 'dev'
          ? 'popo-dev.poapper.club'
          : 'localhost';

    const refreshTokenExpirationTime =
      this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME') ||
      '7d';

    const maxAgeMs = this.parseTimeToMs(refreshTokenExpirationTime);

    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/',
      domain: domain,
      sameSite: 'lax',
      maxAge: maxAgeMs,
    });

    res.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/auth/refresh',
      domain: domain,
      sameSite: 'lax',
      maxAge: maxAgeMs,
    });
  }
}
