import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException)
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const error = exception.getError();

    // 에러 응답 형식 정의
    const errorResponse = {
      status: 'error',
      message: typeof error === 'string' ? error : (error as Error).message,
      timestamp: new Date().toISOString(),
    };

    // 클라이언트에게 에러 이벤트 전송
    client.emit('error', errorResponse);
  }
}
