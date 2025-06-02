import { SetMetadata } from '@nestjs/common';

import { GuardName } from './guard-name';

export const PUBLIC_GUARDS_KEY = 'publicGuards';
// NestJS 메타데이터 시스템에 PUBLIC_GUARDS_KEY: guardName을 저장
// 가드에서 PUBLIC_GUARDS_KEY로 저장된 메타데이터를 읽어서 처리
export const PublicGuard = (guardNames: GuardName[]) =>
  SetMetadata(PUBLIC_GUARDS_KEY, guardNames);
