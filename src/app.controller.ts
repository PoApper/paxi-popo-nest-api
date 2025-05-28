import { Controller, Get } from '@nestjs/common';

import { GuardName } from 'src/common/guard-name';

import { AppService } from './app.service';
import { PublicGuard } from './common/public-guard.decorator';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @PublicGuard(GuardName.JwtGuard)
  getHello(): string {
    return this.appService.getHello();
  }
}
