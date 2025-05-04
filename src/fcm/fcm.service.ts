import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { getMessaging } from 'firebase-admin/messaging';

import { FcmKey } from 'src/fcm/entities/fcm.key.entity';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';

@Injectable()
export class FcmService {
  constructor(
    @InjectRepository(FcmKey)
    private readonly pushKeyRepository: Repository<FcmKey>,
  ) {}
  async createPushKey(key: string, user: JwtPayload) {
    const pushKey = new FcmKey();
    pushKey.pushKey = key;
    pushKey.userUuid = user.uuid;

    try {
      await this.pushKeyRepository.save(pushKey);
      return pushKey;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        throw new BadRequestException('Push key already exists');
      throw new InternalServerErrorException('Failed to create push key');
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

  findByUserUuids(userUuids: string | string[]) {
    return this.pushKeyRepository.find({
      where: {
        userUuid: In(Array.isArray(userUuids) ? userUuids : [userUuids]),
      },
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

  async sendPushNotificationByUserUuid(
    userUuids: string | string[],
    message: string,
  ) {
    const tokens = await this.findByUserUuids(userUuids);
    if (tokens.length === 0) {
      throw new BadRequestException('No push keys found');
    }
    return getMessaging()
      .sendEachForMulticast({
        data: {
          message: message,
        },
        tokens: tokens.map((token) => token.pushKey),
      })
      .then((response) => {
        return response;
      });
  }

  async sendPushNotificationByToken(
    tokens: string | string[],
    message: string,
  ) {
    await getMessaging()
      .sendEachForMulticast({
        data: {
          message: message,
        },
        tokens: Array.isArray(tokens) ? tokens : [tokens],
      })
      .then((response) => {
        return response;
      });
  }

  // TODO: message 형식 정하기
}
