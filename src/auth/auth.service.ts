import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

import { JwtPayload } from './strategies/jwt.payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn:
        this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME') ||
        '1d',
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn:
        this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME') ||
        '7d',
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
    });
  }

  generateTokens(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return { accessToken, refreshToken };
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
