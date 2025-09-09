import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as ms from 'ms';
import * as crypto from 'crypto';

import { UserService } from 'src/user/user.service';

import { JwtPayload } from './strategies/jwt.payload';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}
  private readonly logger = new Logger(AuthService.name);

  generateAccessToken(user: JwtPayload) {
    const payload = {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      userType: user.userType,
    };
    return this.jwtService.sign(payload, {
      expiresIn: jwtConstants.accessTokenExpirationTime,
      secret: jwtConstants.accessTokenSecret,
    });
  }

  async generateRefreshToken(user: JwtPayload) {
    const payload = {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      userType: user.userType,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: jwtConstants.refreshTokenExpirationTime,
      secret: jwtConstants.refreshTokenSecret,
    });

    const hashedToken = this.hashToken(token);

    const expiresAt = new Date(
      Date.now() + ms(jwtConstants.refreshTokenExpirationTime),
    );

    await this.userService.updateRefreshToken(
      user.uuid,
      hashedToken,
      expiresAt,
    );

    return token;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // password encrypt util
  private encryptPassword(password: string, cryptoSalt: string) {
    return crypto
      .pbkdf2Sync(password, cryptoSalt, 10000, 64, 'sha512')
      .toString('base64');
  }

  async validateRefreshToken(
    userInAccessToken: JwtPayload,
    refreshToken: string,
  ): Promise<boolean> {
    try {
      // 1. 리프레시 토큰이 유효한지 검증하고 payload 추출
      const userInRefreshToken = await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret: jwtConstants.refreshTokenSecret,
        },
      );

      // 2. 리프레시 토큰의 payload가 액세스 토큰의 정보와 일치하는지 검증
      if (userInRefreshToken.uuid !== userInAccessToken.uuid) {
        return false;
      }

      // 3. DB에 저장된 해시된 리프레시 토큰과 일치하는지 검증
      const user = (await this.userService.findOne(userInAccessToken.uuid))!;
      const hashedToken = this.hashToken(refreshToken);

      if (!user.hashedRefreshToken || user.hashedRefreshToken !== hashedToken) {
        return false;
      }

      // 4. 토큰 만료 시간 검증
      if (
        !user.refreshTokenExpiresAt ||
        user.refreshTokenExpiresAt <= new Date()
      ) {
        return false;
      }

      return true;
    } catch (error) {
      // 토큰 검증 실패 (만료되었거나 서명이 잘못된 경우)
      this.logger.error('리프레시 토큰 검증 실패:', error);
      return false;
    }
  }

  // 만료된 access token을 디코딩하는 메서드 (refresh 엔드포인트용)
  decodeExpiredAccessToken(accessToken: string): JwtPayload | null {
    try {
      // ignoreExpiration: true로 설정하여 만료된 토큰도 디코딩
      const payload = this.jwtService.verify(accessToken, {
        secret: jwtConstants.accessTokenSecret,
        ignoreExpiration: true,
      });

      return {
        uuid: payload.uuid,
        email: payload.email,
        name: payload.name,
        nickname: payload.nickname,
        userType: payload.userType,
      };
    } catch (error) {
      this.logger.error('액세스 토큰 디코딩 실패:', error);
      return null;
    }
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
