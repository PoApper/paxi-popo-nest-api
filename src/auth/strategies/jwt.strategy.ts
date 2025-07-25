import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

import { JwtPayload } from './jwt.payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          this.logger.debug(request.cookies);
          return request?.cookies?.Authentication;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_ACCESS_TOKEN_SECRET',
      ) as string,
    });
  }

  validate(payload: any): JwtPayload {
    return {
      uuid: payload.uuid,
      name: payload.name,
      nickname: payload.nickname,
      userType: payload.userType,
      email: payload.email,
    };
  }
}
