import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import ms from 'ms';
import * as bcrypt from 'bcrypt';

import { UserService } from 'src/user/user.service';

import { JwtPayload } from './strategies/jwt.payload';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: jwtConstants.accessTokenSecret,
      expiresIn: jwtConstants.accessTokenExpirationTime,
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: jwtConstants.refreshTokenSecret,
      expiresIn: jwtConstants.refreshTokenExpirationTime,
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: jwtConstants.refreshTokenSecret,
    });
  }

  async generateTokens(payload: JwtPayload): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // 리프레시 토큰을 DB에 저장
    await this.saveRefreshToken(payload.uuid, refreshToken);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(
    userUuid: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setTime(
      expiresAt.getTime() + ms(jwtConstants.refreshTokenExpirationTime),
    );

    await this.userService.updateRefreshToken(
      userUuid,
      hashedRefreshToken,
      expiresAt,
    );
  }

  async validateRefreshToken(
    userUuid: string,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.userService.findOne(userUuid);
    if (!user || !user.hashedRefreshToken || !user.refreshTokenExpiresAt) {
      return false;
    }

    // 토큰 만료 확인
    if (user.refreshTokenExpiresAt < new Date()) {
      return false;
    }

    // 토큰 검증
    return bcrypt.compare(refreshToken, user.hashedRefreshToken);
  }

  async removeRefreshToken(userUuid: string): Promise<void> {
    await this.userService.updateRefreshToken(userUuid, null, null);
  }

  setCookies(res: Response, accessToken: string, refreshToken: string): void {
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
}
