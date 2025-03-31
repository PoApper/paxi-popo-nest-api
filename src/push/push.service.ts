import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { PushKey } from 'src/push/entities/push.key.entity';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';

@Injectable()
export class PushService {
  constructor(
    @InjectRepository(PushKey)
    private readonly pushKeyRepository: Repository<PushKey>,
  ) {}
  async createPushKey(key: string, user: JwtPayload) {
    const pushKey = new PushKey();
    pushKey.pushKey = key;
    pushKey.userUuid = user.uuid;

    try {
      await this.pushKeyRepository.save(pushKey);
      return pushKey;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        throw new BadRequestException('Push key already exists');
      throw new Error('Failed to create push key');
    }
  }

  async deletePushKey(key: string, user: JwtPayload) {
    const result = await this.pushKeyRepository.delete({
      pushKey: key,
      userUuid: user.uuid,
    });
    if (result.affected === 0) {
      throw new BadRequestException('Push key not found');
    }
  }

  findByUserUuid(userUuid: string) {
    return this.pushKeyRepository.find({
      where: { userUuid },
    });
  }

  findByPushKey(pushKey: string) {
    return this.pushKeyRepository.findOne({
      where: { pushKey },
    });
  }

  findOne(userUuid: string, pushKey: string) {
    return this.pushKeyRepository.findOne({
      where: { userUuid, pushKey },
    });
  }
}
