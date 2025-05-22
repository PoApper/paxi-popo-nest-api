import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LessThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';

import { RoomService } from 'src/room/room.service';
import { UserService } from 'src/user/user.service';

import { Chat } from './entities/chat.entity';
import { CreateChatDto } from './dto/create-chat.dto';
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    @Inject(forwardRef(() => RoomService)) // 순환 참조 해결
    private readonly roomService: RoomService,
    private readonly userService: UserService,
  ) {}

  async create(createChatDto: CreateChatDto, senderNickname?: string) {
    const chat = this.chatRepo.create({
      ...createChatDto,
      uuid: uuidv4(),
      senderNickname: senderNickname ?? undefined,
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

  findByRoomUuid(roomUuid: string) {
    return this.chatRepo.find({
      where: { roomUuid },
    });
  }

  async getAllMessages(roomUuid: string, take: number, skip: number) {
    return await this.chatRepo.find({
      where: { roomUuid },
      take: take,
      skip: skip,
    });
  }

  async getMessagesByCursor(
    roomUuid: string,
    before: string | null,
    take: number,
  ) {
    if (!(await this.roomService.findOne(roomUuid))) {
      throw new NotFoundException('방을 찾을 수 없습니다.');
    }

    const queryBuilder = this.chatRepo
      .createQueryBuilder('chat')
      .select(['chat.id'])
      .orderBy('chat.id', 'DESC')
      .limit(1);

    if (before) {
      queryBuilder.where('chat.uuid = :before', { before });
    } else {
      queryBuilder.where('chat.roomUuid = :roomUuid', { roomUuid });
    }

    const baseMessage = await queryBuilder.getOne();

    if (!baseMessage) {
      return [];
    }

    const cursorId = baseMessage.id;
    const where = before
      ? [{ roomUuid: roomUuid, id: LessThan(cursorId) }]
      : { roomUuid: roomUuid };

    return await this.chatRepo.find({
      where,
      take,
      order: { id: 'DESC' },
    });
  }

  async updateMessage(messageUuid: string, body: { message: string }) {
    const chat = await this.chatRepo.findOne({
      where: { uuid: messageUuid },
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

  async deleteMessage(messageUuid: string) {
    const chat = await this.chatRepo.findOne({
      where: { uuid: messageUuid },
    });
    if (!chat) {
      throw new NotFoundException('메세지를 찾을 수 없습니다.');
    }
    await this.chatRepo.delete(chat.id);
    return { roomUuid: chat.roomUuid, deletedChatUuid: chat.uuid };
  }

  async getLastMessageOfRoom(roomUuid: string) {
    const lastMessage = await this.chatRepo.findOne({
      where: { roomUuid },
      order: { id: 'DESC' },
    });
    if (!lastMessage) return null;
    return lastMessage;
  }
}
