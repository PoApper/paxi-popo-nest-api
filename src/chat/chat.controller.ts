import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
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

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { UserService } from 'src/user/user.service';
import { User } from 'src/common/decorators/user.decorator';

import { ChatService } from './chat.service';
import { Chat } from './entities/chat.entity';
import { ChatSenderGuard } from './guards/chat-sender.guard';
import { ChatGateway } from './chat.gateway';
import { ChatMessageType } from './entities/chat.meta';
@ApiCookieAuth()
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
// TODO: POPO에서 nickname 토큰에 다는 작업 끝나면 nickname guard 추가해서 전체에 적용
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly userService: UserService,
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

  @Put(':chatUuid')
  @ApiOperation({
    summary: '[웹소켓 통합 버전-개발 중] 채팅 메세지를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '수정된 메세지를 반환합니다. 웹소켓의 `updatedMessage` 이벤트를 통해 수정된 메세지 정보를 전파합니다.',
    type: Chat,
  })
  @ApiResponse({
    status: 403,
    description: '메세지 전송자가 아닙니다.',
  })
  @ApiParam({
    name: 'chatUuid',
    description: '수정할 메세지의 UUID',
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
    @Param('chatUuid') chatUuid: string,
    @Body() body: { message: string },
  ) {
    const updatedChat = await this.chatService.updateMessage(chatUuid, body);
    if (!updatedChat) {
      throw new NotFoundException('메세지를 찾을 수 없습니다.');
    }
    this.chatGateway.sendUpdatedMessage(updatedChat);
    return updatedChat;
  }

  @Delete(':chatUuid')
  @ApiOperation({
    summary: '[웹소켓 통합 버전-개발 중] 채팅 메세지를 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '삭제된 메세지의 UUID를 반환합니다. 웹소켓의 `deletedMessage` 이벤트를 통해 삭제된 메세지의 UUID를 전파합니다.',
    example: { uuid: '123e4567-e89b-12d3-a456-426614174000' },
  })
  @ApiResponse({
    status: 403,
    description: '메세지 전송자가 아닙니다.',
  })
  @ApiParam({
    name: 'chatUuid',
    description: '삭제할 메세지의 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @UseGuards(ChatSenderGuard)
  async deleteMessage(@Param('chatUuid') chatUuid: string) {
    const { roomUuid, deletedChatUuid } =
      await this.chatService.deleteMessage(chatUuid);
    this.chatGateway.sendDeletedMessage(roomUuid, deletedChatUuid);
    return deletedChatUuid;
  }

  @Post(':roomUuid')
  @ApiOperation({
    summary: '[웹소켓 통합 버전-개발 중] 방에 채팅을 전송합니다.',
  })
  @ApiResponse({
    status: 201,
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
    @User() user: JwtPayload,
  ) {
    const chat = await this.chatService.create(
      {
        roomUuid: roomUuid,
        senderUuid: user.uuid,
        message: body.message,
        messageType: ChatMessageType.TEXT,
      },
      user.nickname,
    );
    this.chatGateway.sendMessage(roomUuid, chat);
    return chat;
  }
}
