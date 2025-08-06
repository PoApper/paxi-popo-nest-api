import {
  ConflictException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryRunner } from 'typeorm/query-runner/QueryRunner';
import * as crypto from 'crypto';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserStatus } from './user.meta';
import { Account } from './entities/account.entity';
import { adjectives, nouns } from './nickname.meta';
import { Nickname } from './entities/nickname.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
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
    @InjectRepository(Nickname)
    private readonly nicknameRepo: Repository<Nickname>,
  ) {}

  // NOTE: 실제 환경에선 호출 X 테스트 환경에서 유저 생성 시 사용
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

  getUserName(uuid: string) {
    return this.userRepo
      .findOne({
        where: { uuid },
        select: ['name'],
      })
      .then((user) => {
        return user?.name;
      });
  }

  // password encrypt util
  private encryptPassword(password: string, cryptoSalt: string) {
    return crypto
      .pbkdf2Sync(password, cryptoSalt, 10000, 64, 'sha512')
      .toString('base64');
  }

  async createOrUpdateAccount(
    userUuid: string,
    accountNumber?: string,
    accountHolderName?: string,
    bankName?: string,
    // NOTE: 트랜잭션 처리를 위해 옵션으로 전달
    queryRunner?: QueryRunner,
  ) {
    const manager = queryRunner
      ? queryRunner.manager.getRepository(Account)
      : this.accountRepo;

    const account = await manager.findOne({
      where: { userUuid: userUuid },
    });

    const encryptedAccountNumber = accountNumber
      ? this.encryptAccountNumber(accountNumber)
      : undefined;

    if (account) {
      await manager.update(
        { userUuid },
        {
          encryptedAccountNumber,
          accountHolderName,
          bankName,
        },
      );
    } else {
      await manager.save({
        userUuid,
        encryptedAccountNumber,
        accountHolderName,
        bankName,
      });
    }
    return manager.findOne({
      where: { userUuid: userUuid },
    });
  }

  async getAccount(userUuid: string) {
    const account = await this.accountRepo.findOne({
      where: { userUuid },
    });
    if (!account) {
      return null;
    }
    const decryptedAccountNumber = account.encryptedAccountNumber
      ? this.decryptAccountNumber(account.encryptedAccountNumber)
      : null;

    return {
      accountNumber: decryptedAccountNumber,
      accountHolderName: account.accountHolderName,
      bankName: account.bankName,
    };
  }

  async createAccount(userUuid: string, dto: CreateAccountDto) {
    const encryptedAccountNumber = this.encryptAccountNumber(dto.accountNumber);
    try {
      await this.accountRepo.save({
        userUuid,
        encryptedAccountNumber,
        accountHolderName: dto.accountHolderName,
        bankName: dto.bankName,
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        throw new BadRequestException('계좌번호가 이미 존재합니다.');
    }
    return this.getAccount(userUuid);
  }

  async updateAccount(userUuid: string, dto: UpdateAccountDto) {
    const encryptedAccountNumber = dto.accountNumber
      ? this.encryptAccountNumber(dto.accountNumber)
      : undefined;
    await this.accountRepo.update(
      { userUuid },
      {
        encryptedAccountNumber,
        accountHolderName: dto.accountHolderName,
        bankName: dto.bankName,
      },
    );
    return this.getAccount(userUuid);
  }
  encryptAccountNumber(accountNumber: string) {
    const key = Buffer.from(process.env.ACCOUNT_ENCRYPTION_KEY!, 'base64');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(accountNumber, 'utf8'),
      cipher.final(),
    ]);
    return `${iv.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decryptAccountNumber(encryptedAccountNumber: string) {
    const key = Buffer.from(process.env.ACCOUNT_ENCRYPTION_KEY!, 'base64');
    const parts = encryptedAccountNumber.split(':');
    if (parts.length !== 2) {
      throw new BadRequestException('Invalid encrypted account number format.');
    }
    const [ivBase64, encryptedBase64] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  async generateRandomNickname() {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      const adjective =
        adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const randomNumber = Math.floor(Math.random() * 10000);
      const randomNickname = `${adjective}_${noun}_${randomNumber}`;
      const hasTaken = await this.nicknameRepo.findOne({
        where: { nickname: randomNickname },
      });
      if (!hasTaken) {
        return randomNickname;
      }
    }
    throw new ConflictException(
      '랜덤 닉네임을 생성하는 데 실패했습니다. 다시 시도해 주세요.',
    );
  }

  async createNickname(userUuid: string, nickname: string) {
    const existingNickname = await this.nicknameRepo.findOne({
      where: { userUuid },
    });
    if (existingNickname) {
      throw new BadRequestException('이미 닉네임을 갖고 있습니다.');
    }
    const hasTaken = await this.nicknameRepo.findOne({
      where: { nickname },
    });
    if (hasTaken) {
      throw new ConflictException('이미 존재하는 닉네임입니다.');
    }
    return this.nicknameRepo.save({
      userUuid,
      nickname,
    });
  }

  async getNickname(userUuid: string) {
    return this.nicknameRepo.findOne({
      where: { userUuid },
    });
  }

  async updateNickname(userUuid: string, nickname: string) {
    const existingNickname = await this.nicknameRepo.findOne({
      where: { userUuid },
    });
    if (!existingNickname) {
      throw new NotFoundException('유저의 닉네임이 존재하지 않습니다.');
    }
    const hasTaken = await this.nicknameRepo.findOne({
      where: { nickname },
    });
    if (hasTaken) {
      throw new ConflictException('이미 존재하는 닉네임입니다.');
    }

    await this.nicknameRepo.update({ userUuid }, { nickname });
    return nickname;
  }

  async getUserInfo(userUuid: string) {
    const account = await this.getAccount(userUuid);
    const nickname = await this.getNickname(userUuid);

    return {
      uuid: userUuid,
      nickname: nickname?.nickname,
      accountNumber: account?.accountNumber,
      accountHolderName: account?.accountHolderName,
      bankName: account?.bankName,
    };
  }

  async deleteAllNickname(userUuid?: string) {
    if (userUuid) {
      if (!(await this.findOne(userUuid))) {
        throw new NotFoundException('유저를 찾을 수 없습니다.');
      }
      await this.nicknameRepo.delete({ userUuid: userUuid });
    } else {
      await this.nicknameRepo.delete({});
    }
  }

  async deleteAllAccount(userUuid?: string) {
    if (userUuid) {
      if (!(await this.findOne(userUuid))) {
        throw new NotFoundException('유저를 찾을 수 없습니다.');
      }
      await this.accountRepo.delete({ userUuid: userUuid });
    } else {
      await this.accountRepo.delete({});
    }
  }
}
