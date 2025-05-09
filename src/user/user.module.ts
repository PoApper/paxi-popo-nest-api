import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { Account } from './entities/account.entity';
import { Nickname } from './entities/nickname.entity';
import { UserController } from './user.controller';
@Module({
  imports: [TypeOrmModule.forFeature([User, Account, Nickname])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
