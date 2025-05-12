import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Room } from 'src/room/entities/room.entity';
import { RoomUser } from 'src/room/entities/room.user.entity';
import { UserModule } from 'src/user/user.module';
import { ChatModule } from 'src/chat/chat.module';

import { RoomService } from './room.service';
import { RoomController } from './room.controller';
@Module({
  imports: [
    TypeOrmModule.forFeature([Room, RoomUser]),
    UserModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
