import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Chat } from './entities/chat.entity';
import { CreateChatDto } from './dto/create-chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ) {}

  create(createChatDto: CreateChatDto) {
    return this.chatRepository.save(createChatDto);
  }

  findByGroupUuid(groupUuid: string) {
    return this.chatRepository.find({
      where: { groupUuid },
    });
  }

  async getAllMessages(groupUuid: string, take: number, skip: number) {
    return await this.chatRepository.find({
      where: { groupUuid },
      take: take,
      skip: skip,
    });
  }

  async updateMessage(messageUuid: string, body: { message: string }) {
    await this.chatRepository.update(messageUuid, body);
    return await this.chatRepository.findOne({
      where: { uuid: messageUuid },
    });
  }

  async deleteMessage(messageUuid: string) {
    await this.chatRepository.delete(messageUuid);
    return messageUuid;
  }
}
