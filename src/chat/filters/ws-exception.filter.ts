import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException)
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

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
    // 서버 콘솔에 로그 남기기
    this.logger.error(exception);
  }
}
