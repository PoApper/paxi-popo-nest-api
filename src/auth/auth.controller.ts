import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ApiCookieAuth } from '@nestjs/swagger';
import ms from 'ms';

import { UserType } from 'src/user/user.meta';
import { GuardName } from 'src/common/guard-name';
import { PublicGuard } from 'src/common/public-guard.decorator';

import { JwtPayload } from './strategies/jwt.payload';

const requiredRoles = [UserType.admin, UserType.association, UserType.staff];

@ApiCookieAuth()
@PublicGuard([GuardName.NicknameGuard])
@Controller('auth')
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

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

  private setCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const domain =
      process.env.NODE_ENV === 'prod'
        ? 'popo.poapper.club'
        : process.env.NODE_ENV === 'dev'
          ? 'popo-dev.poapper.club'
          : 'localhost';

    const refreshTokenExpirationTime = this.configService.get<string>(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    );

    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/',
      domain: domain,
      sameSite: 'lax',
      maxAge: ms(refreshTokenExpirationTime),
    });

    res.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/auth/refresh',
      domain: domain,
      sameSite: 'lax',
      maxAge: ms(refreshTokenExpirationTime),
    });
  }
}
