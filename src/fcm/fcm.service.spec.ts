import { getMessaging } from 'firebase-admin/messaging';

import { FcmService } from './fcm.service';

jest.mock('firebase-admin/app', () => ({ getApps: () => [{}] }));
jest.mock('firebase-admin/messaging', () => ({ getMessaging: jest.fn() }));

describe('FcmService', () => {
  it('푸시 키가 없는 유저에게는 Firebase 호출 없이 빈 결과를 반환한다', async () => {
    const repo = { find: jest.fn().mockResolvedValue([]) };
    const service = new FcmService(repo as any);

    await expect(
      service.sendPushNotificationByUserUuid('user-uuid', 'title', 'body'),
    ).resolves.toEqual({ successCount: 0, failureCount: 0, responses: [] });
    expect(getMessaging).not.toHaveBeenCalled();
  });
});
