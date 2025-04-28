import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserStatus } from './user.meta';
import { Account } from './entities/account.entity';

// 해당 UserService는 테스트 환경에서 가짜 유저를 만들어내기 위해서만 사용되며, 실제 환경에서는 사용되지 않음
// 실제 환경에서 Paxi는 유저 정보를 읽기만 함
// 실제 환경에서 사용되지 않기 때문에 controller 또한 없음
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  async save(dto: CreateUserDto) {
    const cryptoSalt = crypto.randomBytes(64).toString('base64');
    const encryptedPassword = this.encryptPassword(dto.password, cryptoSalt);

    return this.userRepo.save({
      email: dto.email,
      password: encryptedPassword,
      cryptoSalt: cryptoSalt,
      name: dto.name,
      userType: dto.userType,
      // 테스트 환경에서 유저 상태 ACTIVATED로 설정
      userStatus: UserStatus.activated,
      lastLoginAt: new Date(),
    });
  }

  find(findOptions: object) {
    return this.userRepo.find(findOptions);
  }

  findOne(uuid: string) {
    return this.userRepo.findOneBy({ uuid });
  }

  // password encrypt util
  private encryptPassword(password: string, cryptoSalt: string) {
    return crypto
      .pbkdf2Sync(password, cryptoSalt, 10000, 64, 'sha512')
      .toString('base64');
  }

  async createOrUpdateAccount(userUuid: string, accountNumber: string) {
    const account = await this.accountRepo.findOne({
      where: { userUuid },
    });
    const encryptedAccountNumber = this.encryptAccountNumber(accountNumber);
    return account
      ? this.accountRepo.update({ userUuid }, { encryptedAccountNumber })
      : this.accountRepo.save({
          userUuid,
          encryptedAccountNumber,
        });
  }

  async getAccount(userUuid: string) {
    const account = await this.accountRepo.findOne({
      where: { userUuid },
    });
    console.log('account', account);
    if (!account) {
      return null;
    }
    return this.decryptAccountNumber(account.encryptedAccountNumber);
  }

  private encryptAccountNumber(accountNumber: string) {
    const key = Buffer.from(process.env.ACCOUNT_ENCRYPTION_KEY!, 'base64');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(accountNumber, 'utf8'),
      cipher.final(),
    ]);
    return `${iv.toString('base64')}:${encrypted.toString('base64')}`;
  }

  private decryptAccountNumber(encryptedAccountNumber: string) {
    const key = Buffer.from(process.env.ACCOUNT_ENCRYPTION_KEY!, 'base64');
    const [ivBase64, encryptedBase64] = encryptedAccountNumber.split(':');
    const iv = Buffer.from(ivBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}
