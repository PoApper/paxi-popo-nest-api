import {
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PushService } from 'src/push/push.service';

@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('key/:key')
  @ApiOperation({
    summary: '푸시 키를 등록합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '등록된 푸시 키 정보를 반환합니다.',
    type: String,
  })
  @ApiResponse({
    status: 400,
    description: '푸시 키 등록 실패',
  })
  async registerPushKey(@Req() req, @Param('key') key: string) {
    const user = req.user as JwtPayload;
    return await this.pushService.createPushKey(key, user);
  }

  @Delete('key/:key')
  @ApiOperation({
    summary: '푸시 키를 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '푸시 키 삭제 성공',
  })
  @ApiResponse({
    status: 400,
    description: '푸시 키 또는 유저가 존재하지 않는 경우 삭제 실패',
  })
  async deletePushKey(@Req() req, @Param('key') key: string) {
    const user = req.user as JwtPayload;
    return await this.pushService.deletePushKey(key, user);
  }
}
