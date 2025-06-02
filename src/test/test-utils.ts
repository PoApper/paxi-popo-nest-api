import { UserService } from 'src/user/user.service';
import { UserType } from 'src/user/user.meta';
import { User } from 'src/user/entities/user.entity';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';

export class TestUtils {
  private testUser: User;
  private testAdmin: User;
  private testUserJwtToken: JwtPayload;
  private testAdminJwtToken: JwtPayload;

  async initializeTestUsers(userService: UserService) {
    // 테스트 유저
    this.testUser = await userService.save({
      email: 'test@test.com',
      password: 'test',
      name: 'test',
      userType: UserType.student,
    });

    // 테스트 어드민
    this.testAdmin = await userService.save({
      email: 'admin@test.com',
      password: 'test',
      name: 'admin',
      userType: UserType.admin,
    });

    // 테스트 유저들의 JWT 토큰(컨트롤러 요청 시 사용)
    this.testUserJwtToken = {
      uuid: this.testUser.uuid,
      name: this.testUser.name,
      nickname: '',
      userType: this.testUser.userType,
      email: this.testUser.email,
    };

    this.testAdminJwtToken = {
      uuid: this.testAdmin.uuid,
      name: this.testAdmin.name,
      nickname: '',
      userType: this.testAdmin.userType,
      email: this.testAdmin.email,
    };
  }

  getTestUser(): User {
    return this.testUser;
  }

  getTestAdmin(): User {
    return this.testAdmin;
  }

  getTestUserJwtToken(): JwtPayload {
    return this.testUserJwtToken;
  }

  getTestAdminJwtToken(): JwtPayload {
    return this.testAdminJwtToken;
  }
}
