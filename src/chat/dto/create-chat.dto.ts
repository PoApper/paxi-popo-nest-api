import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ChatMessageType } from '../entities/chat.meta';

export class CreateChatDto {
  @IsString()
  @IsNotEmpty()
  groupUuid: string;

  @IsString()
  @IsOptional() // 시스템 유저의 UUID는 비워두고, 사용자의 UUID는 필수로 입력
  senderUuid?: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(ChatMessageType)
  @IsOptional()
  messageType?: ChatMessageType;
}
