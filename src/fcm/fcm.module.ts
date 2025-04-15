import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';



import { FcmKey } from 'src/fcm/entities/fcm.key.entity';

import { FcmService } from './fcm.service';
import { FcmController } from './fcm.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FcmKey])],
  providers: [FcmService],
  controllers: [FcmController],
})
export class FcmModule {}
