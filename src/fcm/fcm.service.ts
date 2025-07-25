import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { getMessaging } from 'firebase-admin/messaging';

import { FcmKey } from 'src/fcm/entities/fcm-key.entity';
import { NoContentException } from 'src/common/exception';

@Injectable()
export class FcmService {
  constructor(
    @InjectRepository(FcmKey)
    private readonly pushKeyRepository: Repository<FcmKey>,
  ) {}
  async createPushKey(key: string, userUuid: string) {
    const pushKey = new FcmKey();
    pushKey.pushKey = key;
    pushKey.userUuid = userUuid;

    try {
      await this.pushKeyRepository.save(pushKey);
      return pushKey;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        throw new NoContentException('Push key already exists'); // 204
      throw new InternalServerErrorException('Failed to create push key');
    }
  }

  async deletePushKey(key: string, userUuid: string) {
    const result = await this.pushKeyRepository.delete({
      pushKey: key,
      userUuid: userUuid,
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
    title: string,
    body: string,
    data?: any,
  ) {
    const tokens = await this.findByUserUuids(userUuids);
    return await this.sendPushNotificationByToken(
      tokens.map((token) => token.pushKey),
      title,
      body,
      data,
    );
  }

  async sendPushNotificationByToken(
    tokens: string | string[],
    title: string,
    body: string,
    data?: any,
  ) {
    return getMessaging()
      .sendEachForMulticast({
        tokens: Array.isArray(tokens) ? tokens : [tokens],
        notification: {
          title: title,
          body: body,
        },
        data: data,
        // iOS
        apns: {
          payload: {
            aps: {
              // 프론트 포그라운드 처리를 위한 설정
              alert: {
                title: title,
                body: body,
              },
              sound: 'default',
              contentAvailable: true, // 백그라운드 푸시 알림을 위한 설정
            },
          },
        },
      })
      .then((response) => {
        return response;
      });
  }
}
