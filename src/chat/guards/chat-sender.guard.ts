import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { ChatService } from '../chat.service';

@Injectable()
export class ChatSenderGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userUuid = request.user.uuid;
    const chatUuid = request.params.chatUuid;

    const chat = await this.chatService.findOne(chatUuid);
    if (chat.senderUuid !== userUuid) {
      throw new ForbiddenException('메세지 전송자가 아닙니다.');
    }

    return true;
  }
}
