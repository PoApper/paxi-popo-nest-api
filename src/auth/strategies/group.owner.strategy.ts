// TODO: 그룹 소유자 확인 가드

import { UserType } from 'src/user/user.meta';

export class JwtPayload {
  uuid: string;
  name: string;
  userType: UserType;
  email: string;
}
