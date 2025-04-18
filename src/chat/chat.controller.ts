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
import { ChatSenderGuard } from './guards/chat-sender.guard';
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@ApiResponse({
  status: 401,
  description: '로그인이 되어 있지 않은 경우',
})
@ApiResponse({
  status: 404,
  description: '존재하지 않는 메세지입니다.',
})
@Controller('chat')
// TODO: 덕지덕지 데코레이터 정리하기
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':roomUuid/messages')
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
    name: 'roomUuid',
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
    @Param('roomUuid') roomUuid: string,
    @Query('before', new DefaultValuePipe(null)) before: string | null,
    @Query('take', new DefaultValuePipe(30), ParseIntPipe) take: number,
  ) {
    return this.chatService.getMessagesByCursor(roomUuid, before, take);
  }

  @Put(':roomUuid/messages/:messageUuid')
  @ApiOperation({
    summary: '채팅 메세지를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '수정된 메세지를 반환합니다.',
  })
  @ApiResponse({
    status: 403,
    description: '메세지 전송자가 아닙니다.',
  })
  @ApiParam({
    name: 'messageUuid',
    description: '수정할 메세지 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'roomUuid',
    description: '룸 UUID',
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
  @UseGuards(ChatSenderGuard)
  async updateMessage(
    @Param('roomUuid') roomUuid: string,
    @Param('messageUuid') messageUuid: string,
    @Body() body: { message: string },
  ) {
    return this.chatService.updateMessage(roomUuid, messageUuid, body);
  }

  @Delete(':roomUuid/messages/:messageUuid')
  @ApiOperation({
    summary: '채팅 메세지를 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '삭제된 메세지의 UUID를 반환합니다.',
  })
  @ApiResponse({
    status: 403,
    description: '메세지 전송자가 아닙니다.',
  })
  @ApiParam({
    name: 'roomUuid',
    description: '룸 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'messageUuid',
    description: '삭제할 메세지 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @UseGuards(ChatSenderGuard)
  async deleteMessage(
    @Param('roomUuid') roomUuid: string,
    @Param('messageUuid') messageUuid: string,
  ) {
    return this.chatService.deleteMessage(roomUuid, messageUuid);
  }
}
