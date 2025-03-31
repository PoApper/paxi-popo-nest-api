import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PushKey } from 'src/push/entities/push.key.entity';

import { PushService } from './push.service';
import { PushController } from './push.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PushKey])],
  providers: [PushService],
  controllers: [PushController],
})
export class PushModule {}
