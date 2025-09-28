import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import * as ms from 'ms';

import { UserType } from 'src/user/user.meta';
import { GuardName } from 'src/common/guard-name';
import { PublicGuard } from 'src/common/public-guard.decorator';
import { UserService } from 'src/user/user.service';

import { JwtPayload } from './strategies/jwt.payload';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';

const requiredRoles = [UserType.admin, UserType.association, UserType.staff];

@ApiCookieAuth()
@PublicGuard([GuardName.NicknameGuard])
@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
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

  @ApiCookieAuth()
  @ApiOperation({
    summary:
      'Swagger에서 테스트 불가능: 리프레시 토큰을 사용해 엑세스 토큰 갱신',
    description:
      '해당 엔드포인트를 테스트하려면 Authentication, Refresh 두 가지 토큰이 필요한데, Swagger에서는 최대 하나의 토큰만 등록 가능합니다. 테스트하려면 Postman같은 툴을 사용하거나 개발자도구로 Refresh 쿠키를 직접 넣어야 합니다.',
  })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessTokenInCookie = req.cookies?.Authentication;
    const refreshTokenInCookie = req.cookies?.Refresh;

    if (!accessTokenInCookie || !refreshTokenInCookie) {
      this.clearCookies(res);
      throw new UnauthorizedException('Missing access token or refresh token');
    }

    // 만료된 access token을 디코딩 (JWT 가드 우회)
    const user = this.authService.decodeExpiredAccessToken(accessTokenInCookie);
    if (!user) {
      this.clearCookies(res);
      throw new UnauthorizedException('Invalid access token');
    }

    // refresh token 검증
    const isValid = await this.authService.validateRefreshToken(
      user,
      refreshTokenInCookie,
    );
    if (!isValid) {
      await this.userService.updateRefreshToken(user.uuid, null, null);
      this.clearCookies(res);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = await this.authService.generateRefreshToken(user);

    this.setCookies(res, accessToken, refreshToken);

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

    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/',
      domain: domain,
      sameSite: 'lax',
      maxAge: ms(jwtConstants.refreshTokenExpirationTime),
    });

    res.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/auth/refresh',
      domain: domain,
      sameSite: 'lax',
      maxAge: ms(jwtConstants.refreshTokenExpirationTime),
    });
  }

  private clearCookies(res: Response): void {
    const domain =
      process.env.NODE_ENV === 'prod'
        ? 'popo.poapper.club'
        : process.env.NODE_ENV === 'dev'
          ? 'popo-dev.poapper.club'
          : 'localhost';

    res.clearCookie('Authentication', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/',
      domain: domain,
      sameSite: 'lax',
    });

    res.clearCookie('Refresh', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/auth/refresh',
      domain: domain,
      sameSite: 'lax',
    });
  }
}
