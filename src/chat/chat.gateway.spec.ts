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

  const makeClient = (token?: string) => {
    const join = jest.fn().mockResolvedValue(undefined);
    const emit = jest.fn();
    const disconnect = jest.fn();
    const client = {
      handshake: { query: { Authentication: token } },
      data: {},
      join,
      emit,
      disconnect,
    } as never as import('socket.io').Socket;
    return { client, join, emit, disconnect };
  };

  it('인증 성공 시 connected 이벤트를 emit하고 연결을 끊지 않는다', async () => {
    const gateway = makeGateway(() => ({ uuid: 'user-1' }));
    const { client, join, emit, disconnect } = makeClient('valid-token');

    await gateway.handleConnection(client);

    expect(join).toHaveBeenCalledWith('user-user-1');
    expect(emit).toHaveBeenCalledWith(ChatEvent.CONNECTED);
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('토큰 만료 시 accessTokenExpired를 emit하고 connected는 보내지 않는다', async () => {
    const gateway = makeGateway(() => {
      throw new TokenExpiredError('jwt expired', new Date());
    });
    const { client, emit, disconnect } = makeClient('expired-token');

    await gateway.handleConnection(client);

    expect(emit).toHaveBeenCalledWith(
      ChatEvent.ACCESS_TOKEN_EXPIRED,
      expect.objectContaining({ error: 'AccessTokenExpired' }),
    );
    expect(emit).not.toHaveBeenCalledWith(ChatEvent.CONNECTED);
    expect(disconnect).toHaveBeenCalled();
  });

  it('토큰이 없으면 WsExceptionFilter와 동일한 envelope로 error를 emit한다', async () => {
    const gateway = makeGateway(() => ({ uuid: 'user-1' }));
    const { client, emit, disconnect } = makeClient(undefined);

    await gateway.handleConnection(client);

    expect(emit).toHaveBeenCalledWith(
      ChatEvent.ERROR,
      expect.objectContaining({
        status: 'error',
        error: 'ConnectionError',
        message: '인증 토큰이 없습니다.',
        timestamp: expect.any(String),
      }),
    );
    expect(emit).not.toHaveBeenCalledWith(ChatEvent.CONNECTED);
    expect(disconnect).toHaveBeenCalled();
  });
});
