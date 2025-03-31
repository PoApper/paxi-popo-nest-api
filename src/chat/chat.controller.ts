import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
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

  @Get(':groupUuid/messages')
  @ApiOperation({
    summary: '채팅방 메세지를 불러옵니다.',
    description: 'before 이전 take개의 메세지를 불러옵니다.',
  })
  @ApiResponse({
    status: 200,
    description: '메세지들을 반환합니다.',
    type: [Chat],
  })
  @ApiResponse({
    status: 400,
    description: '채팅방 메세지를 불러오지 못했습니다.',
  })
  @ApiParam({
    name: 'groupUuid',
    description: '채팅방 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'before',
    description:
      '불러올 메세지 시작 위치, 없을 시 가장 최근 메세지부터 불러옵니다.',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'take',
    description: '불러올 메세지 개수',
    required: false,
    example: 30,
  })
  async getMessages(
    @Param('groupUuid') groupUuid: string,
    @Query('before', new DefaultValuePipe(null)) before: string | null,
    @Query('take', new DefaultValuePipe(30), ParseIntPipe) take: number,
  ) {
    return this.chatService.getMessagesByCursor(groupUuid, before, take);
  }

  @Put(':groupUuid/messages/:messageUuid')
  @ApiOperation({
    summary: '채팅 메세지를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '수정된 메세지를 반환합니다.',
  })
  @ApiParam({
    name: 'messageUuid',
    description: '수정할 메세지 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'groupUuid',
    description: '그룹 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  async updateMessage(
    @Param('groupUuid') groupUuid: string,
    @Param('messageUuid') messageUuid: string,
    @Body() body: { message: string },
  ) {
    return this.chatService.updateMessage(groupUuid, messageUuid, body);
  }

  @Delete(':groupUuid/messages/:messageUuid')
  @ApiOperation({
    summary: '채팅 메세지를 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '삭제된 메세지의 UUID를 반환합니다.',
  })
  @ApiParam({
    name: 'groupUuid',
    description: '그룹 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'messageUuid',
    description: '삭제할 메세지 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async deleteMessage(
    @Param('groupUuid') groupUuid: string,
    @Param('messageUuid') messageUuid: string,
  ) {
    return this.chatService.deleteMessage(groupUuid, messageUuid);
  }
}
