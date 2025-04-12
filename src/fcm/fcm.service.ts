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

  findByUserUuid(userUuid: string) {
    return this.pushKeyRepository.find({
      where: { userUuid },
    });
  }

  findByMultipleUserUuid(userUuids: string[]) {
    return this.pushKeyRepository.find({
      where: { userUuid: In(userUuids) },
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

  async sendPushNotificationByUuid(userUuid: string, message: string) {
    await getMessaging()
      .send({
        data: {
          message: message,
        },
        token: await this.findByUserUuid(userUuid).then((tokens) => {
          if (tokens.length > 0) return tokens[0].pushKey;
          throw new BadRequestException('유저의 푸시 키가 존재하지 않습니다.');
        }),
      })
      .then((response) => {
        return response;
      });
  }

  async sendPushNotificationByToken(token: string, message: string) {
    await getMessaging()
      .send({
        data: {
          message: message,
        },
        token: token,
      })
      .then((response) => {
        return response;
      });
  }

  async sendMultiPushNotificationByUuids(userUuids: string[], message: string) {
    const tokens = await this.findByMultipleUserUuid(userUuids);
    if (tokens.length === 0) {
      throw new BadRequestException('No push keys found for users');
    }

    getMessaging()
      .sendEachForMulticast({
        data: {
          message: message,
        },
        tokens: await this.findByMultipleUserUuid(userUuids).then((tokens) => {
          return tokens.map((token) => token.pushKey);
        }),
      })
      .then((response) => {
        if (response.failureCount > 0) {
          throw new BadRequestException('유저의 푸시 키가 존재하지 않습니다.');
        }
      })
      .then((response) => {
        return response;
      });
  }

  async sendMultiPushNotificationByTokens(tokens: string[], message: string) {
    await getMessaging()
      .sendEachForMulticast({
        data: {
          message: message,
        },
        tokens: tokens,
      })
      .then((response) => {
        return response;
      });
  }
}
