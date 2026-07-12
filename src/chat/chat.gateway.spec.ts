import { TokenExpiredError } from '@nestjs/jwt';

import { ChatGateway } from './chat.gateway';
import { ChatEvent } from './chat.events';

describe('ChatGateway.handleConnection', () => {
  const makeGateway = (verifyImpl: () => unknown) => {
    const jwtService = { verify: jest.fn(verifyImpl) } as unknown as never;
    const roomService = {} as never;
    const fcmService = {} as never;
    return new ChatGateway(jwtService, roomService, fcmService);
  };

  const makeClient = (token?: string) =>
    ({
      handshake: { query: { Authentication: token } },
      data: {},
      join: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
      disconnect: jest.fn(),
    }) as never as import('socket.io').Socket;

  it('인증 성공 시 connected 이벤트를 emit하고 연결을 끊지 않는다', async () => {
    const gateway = makeGateway(() => ({ uuid: 'user-1' }));
    const client = makeClient('valid-token');

    await gateway.handleConnection(client);

    expect(client.join).toHaveBeenCalledWith('user-user-1');
    expect(client.emit).toHaveBeenCalledWith(ChatEvent.CONNECTED);
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('토큰 만료 시 accessTokenExpired를 emit하고 connected는 보내지 않는다', async () => {
    const gateway = makeGateway(() => {
      throw new TokenExpiredError('jwt expired', new Date());
    });
    const client = makeClient('expired-token');

    await gateway.handleConnection(client);

    expect(client.emit).toHaveBeenCalledWith(
      ChatEvent.ACCESS_TOKEN_EXPIRED,
      expect.objectContaining({ error: 'AccessTokenExpired' }),
    );
    expect(client.emit).not.toHaveBeenCalledWith(ChatEvent.CONNECTED);
    expect(client.disconnect).toHaveBeenCalled();
  });
});
