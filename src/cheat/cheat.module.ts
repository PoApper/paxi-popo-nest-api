import { Module } from '@nestjs/common';

import { RoomModule } from 'src/room/room.module';
import { ChatModule } from 'src/chat/chat.module';
import { UserModule } from 'src/user/user.module';

import { CheatController } from './cheat.controller';

@Module({
  imports: [RoomModule, ChatModule, UserModule],
  controllers: [CheatController],
})
export class CheatModule {}
