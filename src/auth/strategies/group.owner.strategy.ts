import { UserType } from 'src/user/user.meta';

export class JwtPayload {
  uuid: string;
  name: string;
  userType: UserType;
  email: string;
}
