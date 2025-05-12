import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
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

import { JwtPayload } from 'src/auth/strategies/jwt.payload';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { Chat } from './entities/chat.entity';
import { ChatSenderGuard } from './guards/chat-sender.guard';
import { ChatGateway } from './chat.gateway';
import { ChatMessageType } from './entities/chat.meta';
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
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get(':roomUuid')
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
    description: '메세지를 불러오지 못했습니다.',
  })
  @ApiParam({
    name: 'roomUuid',
    description: '방 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'before',
    description:
      '해당 UUID의 메세지 이전부터 불러옵니다. 값이 없을 시 가장 최근 메세지부터 불러옵니다.',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'take',
    description: '불러올 메세지 개수, 기본값은 30',
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

  @Put(':roomUuid/:messageUuid')
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
    description: '수정할 메세지의 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'roomUuid',
    description: '수정할 메세지가 속한 방의 UUID',
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
    // TODO: 수정 후 emit
    return this.chatService.updateMessage(roomUuid, messageUuid, body);
  }

  @Delete(':roomUuid/:messageUuid')
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
    description: '삭제할 메세지가 속한 방의 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'messageUuid',
    description: '삭제할 메세지의 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @UseGuards(ChatSenderGuard)
  async deleteMessage(
    @Param('roomUuid') roomUuid: string,
    @Param('messageUuid') messageUuid: string,
  ) {
    // TODO: 삭제 후 emit
    return this.chatService.deleteMessage(roomUuid, messageUuid);
  }

  @Post(':roomUuid')
  @ApiOperation({
    summary: '[웹소켓 통합 버전-개발 중] 방에 채팅을 전송합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '생성된 메세지를 반환합니다. 채팅 메세지 생성 후 방 전체에 메시지와 푸시 알림을 전송합니다.',
    type: Chat,
  })
  @ApiParam({
    name: 'roomUuid',
    description: '생성할 메세지가 속한 방의 UUID',
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
  async create(
    @Param('roomUuid') roomUuid: string,
    @Body() body: { message: string },
    @Req() req,
  ) {
    const user = req.user as JwtPayload;
    const chat = await this.chatService.create({
      roomUuid: roomUuid,
      senderUuid: user.uuid,
      message: body.message,
      messageType: ChatMessageType.TEXT,
    });
    this.chatGateway.sendMessage(roomUuid, chat);
    return chat;
  }
}
