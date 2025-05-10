import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt.payload';
import { FcmService } from './fcm.service';

@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('push')
export class FcmController {
  constructor(private readonly pushService: FcmService) {}

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

  @Post('send')
  @ApiOperation({
    summary: '[테스트]푸시 알림을 여러 사용자에게 전송합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userUuids: {
          type: 'array',
          items: {
            type: 'string',
            example: '45281c1e-61e5-4628-8821-6e0cb0940fd3',
          },
        },
        title: {
          type: 'string',
          example: 'Test push notification',
        },
        body: {
          type: 'string',
          example: 'This is a test push notification.',
        },
        data: {
          type: 'object',
          properties: {
            roomUuid: {
              type: 'string',
              example: '45281c1e-61e5-4628-8821-6e0cb0940fd3',
            },
          },
        },
      },
    },
  })
  async sendPushNotificationToMultipleUsers(
    @Req() req,
    @Body()
    body: {
      userUuids: string[];
      title: string;
      body: string;
      data?: any;
    },
  ) {
    return await this.pushService.sendPushNotificationByUserUuid(
      body.userUuids,
      body.title,
      body.body,
      body.data,
    );
  }
}
