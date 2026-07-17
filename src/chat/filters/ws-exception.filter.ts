import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { buildWsErrorResponse } from './ws-error-response';

@Catch(WsException)
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const error = exception.getError();
    const message =
      typeof error === 'string' ? error : (error as Error).message;

    // 클라이언트에게 에러 이벤트 전송
    client.emit('error', buildWsErrorResponse(message));
    // 서버 콘솔에 로그 남기기
    this.logger.error(exception);
  }
}
