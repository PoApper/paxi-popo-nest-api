import { HttpException, HttpStatus } from '@nestjs/common';

// 204 No Content를 응답하도록 하는 Exception
export class NoContentException extends HttpException {
  constructor(response?: string) {
    super(response ? response : '', HttpStatus.NO_CONTENT);
  }
}
