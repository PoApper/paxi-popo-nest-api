import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LessThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';

import { RoomService } from 'src/room/room.service';
import { UserType } from 'src/user/user.meta';
import { RoomUser } from 'src/room/entities/room-user.entity';

import { Chat } from './entities/chat.entity';
import { CreateChatDto } from './dto/create-chat.dto';
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    @Inject(forwardRef(() => RoomService)) // 순환 참조 해결
    private readonly roomService: RoomService,
    @InjectRepository(RoomUser)
    private readonly roomUserRepo: Repository<RoomUser>,
  ) {}

  async create(createChatDto: CreateChatDto, senderNickname?: string) {
    const chat = this.chatRepo.create({
      ...createChatDto,
      uuid: uuidv4(),
      senderNickname: senderNickname ?? undefined, // 시스템 메시지인 경우에만 undefined(=null)로 저장
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
    userType: UserType,
    userUuid: string,
  ) {
    const room = await this.roomService.findOne(roomUuid);
    if (!room) {
      throw new NotFoundException('방이 존재하지 않습니다.');
    }

    if (
      userType !== UserType.admin &&
      !(await this.roomUserRepo.findOne({
        where: { roomUuid, userUuid: userUuid },
      }))
    ) {
      throw new UnauthorizedException(
        '채팅을 볼 권한이 없습니다. 관리자 혹은 방에 속한 유저만 가능합니다.',
      );
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
    await this.chatRepo.update(chat.id, {
      message: body.message,
      isEdited: true,
    });
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

  async deleteAll(chatUuid?: string) {
    const query = this.chatRepo.createQueryBuilder('chat');
    if (chatUuid) {
      await this.findOne(chatUuid);
      query.where('chat.uuid = :chatUuid', { chatUuid });
    }
    await query.delete().execute();
  }
}
