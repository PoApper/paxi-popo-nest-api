import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FcmService } from './fcm.service';
import { FcmController } from './fcm.controller';
import { FcmKey } from './entities/fcm.key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FcmKey])],
  providers: [FcmService],
  controllers: [FcmController],
})
export class FcmModule {}
