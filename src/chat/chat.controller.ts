import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { Chat } from './entities/chat.entity';

@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@ApiResponse({
  status: 401,
  description: '로그인이 되어 있지 않은 경우',
})
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({
    summary: '채팅방 메세지를 불러옵니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'skip부터 take개의 메세지를 불러옵니다.',
    type: [Chat],
  })
  @ApiResponse({
    status: 400,
    description: '채팅방 메세지를 불러오지 못했습니다.',
  })
  @ApiQuery({
    name: 'groupUuid',
    description: '채팅방 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'take',
    description: '한번에 불러올 메세지 수',
    required: false,
    example: 30,
  })
  @ApiQuery({
    name: 'skip',
    description: '불러올 메세지 시작 위치',
    required: false,
    example: 0,
  })
  async getMessages(
    @Query('groupUuid') groupUuid: string,
    @Query('limit', new DefaultValuePipe(30)) take: number,
    @Query('offset', new DefaultValuePipe(0)) skip: number,
  ) {
    return this.chatService.getAllMessages(groupUuid, take, skip);
  }

  @Put(':messageUuid')
  @ApiOperation({
    summary: '채팅 메세지를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '수정된 메세지를 반환합니다.',
  })
  async updateMessage(
    @Param('messageUuid') messageUuid: string,
    @Body() body: { message: string },
  ) {
    return this.chatService.updateMessage(messageUuid, body);
  }

  @Delete(':messageUuid')
  @ApiOperation({
    summary: '채팅 메세지를 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '삭제된 메세지의 UUID를 반환합니다.',
  })
  async deleteMessage(@Param('messageUuid') messageUuid: string) {
    return this.chatService.deleteMessage(messageUuid);
  }
}
