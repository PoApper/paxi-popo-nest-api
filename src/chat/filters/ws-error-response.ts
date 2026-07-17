// 'error' 이벤트 표준 envelope. filter와 gateway가 공유한다.
export const buildWsErrorResponse = (message: string, error?: string) => ({
  status: 'error',
  message,
  timestamp: new Date().toISOString(),
  ...(error ? { error } : {}),
});
