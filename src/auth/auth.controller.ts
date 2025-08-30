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

  @Post('refresh')
  @PublicGuard([GuardName.JwtGuard])
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
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.Refresh as string;

    if (!refreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 없습니다.');
    }

    try {
      const payload = this.authService.verifyRefreshToken(refreshToken);

      // DB에서 리프레시 토큰 검증
      const isValidRefreshToken = await this.authService.validateRefreshToken(
        payload.uuid,
        refreshToken,
      );

      if (!isValidRefreshToken) {
        throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
      }

      const tokens = await this.authService.generateTokens(payload);

      this.authService.setCookies(res, tokens.accessToken, tokens.refreshToken);

      return res.json({ message: '토큰이 갱신되었습니다.' });
    } catch {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }
  }
}
