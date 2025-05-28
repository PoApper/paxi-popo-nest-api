import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    // 모든 Role에서 접근 가능
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // {"name": ..., "userType": ...}

    const hasRole = requiredRoles.some((role) => user.userType?.includes(role));
    if (!hasRole) {
      throw new ForbiddenException(
        `${requiredRoles.join(', ')}의 권한이 없습니다.`,
      );
    }
    return hasRole;
  }
}
