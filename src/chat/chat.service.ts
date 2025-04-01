import { Injectable, NotFoundException } from '@nestjs/common';
import { Equal, LessThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';

import { GroupService } from 'src/group/group.service';

import { Chat } from './entities/chat.entity';
import { CreateChatDto } from './dto/create-chat.dto';
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    private readonly groupService: GroupService,
  ) {}

  async create(createChatDto: CreateChatDto) {
    const chat = this.chatRepo.create({
      ...createChatDto,
      uuid: uuidv4(),
    });
    return this.chatRepo.save(chat);
  }

  async findOne(messageUuid: string) {
    const message = await this.chatRepo.findOne({
      where: { uuid: messageUuid },
    });
    if (!message) {
      throw new NotFoundException('존재하지 않는 메세지입니다.');
    }
    return message;
  }

  findByGroupUuid(groupUuid: string) {
    return this.chatRepo.find({
      where: { groupUuid },
    });
  }

  async getAllMessages(groupUuid: string, take: number, skip: number) {
    return await this.chatRepo.find({
      where: { groupUuid },
      take: take,
      skip: skip,
    });
  }

  async getMessagesByCursor(
    groupUuid: string,
    before: string | null,
    take: number,
  ) {
    console.log('groupUuid', groupUuid);
    if (!(await this.groupService.findOne(groupUuid))) {
      console.log('그룹을 찾을 수 없습니다.');
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }
    console.log(await this.groupService.findOne(groupUuid));

    let baseMessage: Chat | null = null;

    if (before) {
      baseMessage = await this.chatRepo.findOne({
        where: { uuid: before },
        select: ['createdAt', 'id'],
      });
    } else {
      baseMessage = await this.chatRepo.findOne({
        where: { groupUuid },
        order: { createdAt: 'DESC' },
        select: ['createdAt', 'id'],
      });
    }
    console.log('baseMessage', baseMessage);
    if (!baseMessage) {
      throw new NotFoundException('기준 메세지를 찾을 수 없습니다.');
    }

    const cursorTime = baseMessage.createdAt;
    const cursorId = baseMessage.id;
    const where = before
      ? [
          { groupUuid, createdAt: LessThan(cursorTime) },
          {
            groupUuid,
            createdAt: Equal(cursorTime),
            id: LessThan(cursorId),
          },
        ]
      : { groupUuid };

    return await this.chatRepo.find({
      where,
      take,
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  async updateMessage(
    groupUuid: string,
    messageUuid: string,
    body: { message: string },
  ) {
    const chat = await this.chatRepo.findOne({
      where: { uuid: messageUuid, groupUuid: groupUuid },
    });
    if (!chat) {
      throw new NotFoundException('메세지를 찾을 수 없습니다.');
    }
    // 수정은 PK로 해줘야 함
    await this.chatRepo.update(chat.id, { message: body.message });
    return await this.chatRepo.findOne({
      where: { uuid: messageUuid },
    });
  }

  async deleteMessage(groupUuid: string, messageUuid: string) {
    const message = await this.chatRepo.findOne({
      where: { uuid: messageUuid, groupUuid: groupUuid },
    });
    if (!message) {
      throw new NotFoundException('메세지를 찾을 수 없습니다.');
    }
    await this.chatRepo.delete(message.id);
    return messageUuid;
  }
}
