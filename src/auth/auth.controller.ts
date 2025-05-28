import {
  Controller,
  Get,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiCookieAuth } from '@nestjs/swagger';

import { UserType } from 'src/user/user.meta';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './strategies/jwt.payload';

const requiredRoles = [UserType.admin, UserType.association, UserType.staff];

@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
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
    // this.userService.updateLogin(user.uuid);
    return user;
  }
}
