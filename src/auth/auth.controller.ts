import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ApiCookieAuth } from '@nestjs/swagger';

import { UserType } from 'src/user/user.meta';
import { GuardName } from 'src/common/guard-name';
import { PublicGuard } from 'src/common/public-guard.decorator';

import { AuthService } from './auth.service';
import { JwtPayload } from './strategies/jwt.payload';

const requiredRoles = [UserType.admin, UserType.association, UserType.staff];

@ApiCookieAuth()
@PublicGuard([GuardName.NicknameGuard])
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
