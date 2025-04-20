import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { Account } from './entities/account.entity';
@Module({
  imports: [TypeOrmModule.forFeature([User, Account])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
