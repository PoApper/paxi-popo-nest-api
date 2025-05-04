import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoomModule } from 'src/room/room.module';
import { FcmModule } from 'src/fcm/fcm.module';

import { ChatGateway } from './chat.gateway';
import { Chat } from './entities/chat.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
@Module({
  imports: [JwtModule, TypeOrmModule.forFeature([Chat]), RoomModule, FcmModule],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
