import {
  BadRequestException,
  ConflictException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import configurations from 'src/config/configurations';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { TestUtils } from 'src/test/test-utils';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserModule } from './user.module';
import { UserType } from './user.meta';
import { Nickname } from './entities/nickname.entity';

describe('UserModule - Integration Test', () => {
  let app: INestApplication;

  let userController: UserController;
  let userService: UserService;
  let testUtils: TestUtils;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configurations],
          isGlobal: true,
          envFilePath: ['.env.test'],
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const dbConfig = configService.get('database');
            return dbConfig;
          },
        }),
        UserModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userController = app.get<UserController>(UserController);
    userService = app.get<UserService>(UserService);
  });

  beforeEach(async () => {
    testUtils = new TestUtils();
    await testUtils.initializeTestUsers(userService);
  });

  afterEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
    expect(userService).toBeDefined();
  });

  describe('createNickname', () => {
    it('should create a nickname', async () => {
      const userNickname = '포닉스';
      const nickname: Nickname = await userController.createNickname(
        testUtils.getTestUserJwtToken(),
        {
          nickname: userNickname,
        },
      );

      expect(nickname.nickname).toBe(userNickname);
      expect(nickname.userUuid).toBe(testUtils.getTestUser().uuid);
      expect(nickname.createdAt).toBeDefined();
      expect(nickname.updatedAt).toBeDefined();
      expect(nickname.id).toBeDefined();
    });

    it('should not create a duplicated nickname', async () => {
      const sameNickname = 'test';
      const user1Nickname: Nickname = await userController.createNickname(
        testUtils.getTestUserJwtToken(),
        {
          nickname: sameNickname,
        },
      );

      expect(user1Nickname.nickname).toBe(sameNickname);
      expect(user1Nickname.userUuid).toBe(testUtils.getTestUser().uuid);
      expect(user1Nickname.createdAt).toBeDefined();
      expect(user1Nickname.updatedAt).toBeDefined();
      expect(user1Nickname.id).toBeDefined();

      const user2 = await userService.save({
        email: 'test2@test.com',
        password: 'test',
        name: 'test2',
        userType: UserType.student,
      });
      const user2InToken: JwtPayload = {
        uuid: user2.uuid,
        name: user2.name,
        nickname: user2.nickname?.nickname || '',
        userType: user2.userType,
        email: user2.email,
      };
      await expect(
        userController.createNickname(user2InToken, {
          nickname: sameNickname,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should not create a nickname if the user already has a nickname', async () => {
      await userController.createNickname(testUtils.getTestUserJwtToken(), {
        nickname: 'test',
      });

      await expect(
        userController.createNickname(testUtils.getTestUserJwtToken(), {
          nickname: 'test',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateNickname', () => {
    it('should update a nickname', async () => {
      await userController.createNickname(testUtils.getTestUserJwtToken(), {
        nickname: 'test',
      });

      const updatedNickname = await userController.updateNickname(
        testUtils.getTestUserJwtToken(),
        testUtils.getTestUser().uuid,
        {
          nickname: 'test2',
        },
      );

      expect(updatedNickname).toBe('test2');
    });

    it('should not update a nickname if another user already has the nickname', async () => {
      await userController.createNickname(testUtils.getTestUserJwtToken(), {
        nickname: 'test',
      });

      const user2 = await userService.save({
        email: 'test2@test.com',
        password: 'test',
        name: 'test2',
        userType: UserType.student,
      });
      const user2InToken: JwtPayload = {
        uuid: user2.uuid,
        name: user2.name,
        nickname: user2.nickname?.nickname || '',
        userType: user2.userType,
        email: user2.email,
      };
      await userController.createNickname(user2InToken, {
        nickname: 'test2',
      });

      await expect(
        userController.updateNickname(
          testUtils.getTestAdminJwtToken(),
          user2.uuid,
          {
            nickname: 'test',
          },
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should not update a nickname if the user does not have a nickname', async () => {
      const nonExistedUserUuid = 'non-existed-user-uuid';
      await expect(
        userController.updateNickname(
          testUtils.getTestAdminJwtToken(),
          nonExistedUserUuid,
          {
            nickname: 'test',
          },
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOnboardingStatus', () => {
    it('should return onboarding status when nickname exists in JWT token', async () => {
      // JWT 토큰에 닉네임이 있는 경우
      const userWithNicknameInToken: JwtPayload = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '토큰에_있는_닉네임',
        userType: UserType.student,
      };

      const result = await userController.getOnboardingStatus(userWithNicknameInToken);

      expect(result).toEqual({
        onboardingStatus: true,
        nickname: '토큰에_있는_닉네임',
      });
    });

    it('should return onboarding status when nickname exists in DB but not in JWT token', async () => {
      // 먼저 DB에 닉네임 생성
      await userService.createNickname(testUtils.getTestUser().uuid, 'DB에_있는_닉네임');

      // JWT 토큰에는 닉네임이 없는 경우
      const userWithoutNicknameInToken: JwtPayload = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '', // 빈 문자열
        userType: UserType.student,
      };

      const result = await userController.getOnboardingStatus(userWithoutNicknameInToken);

      expect(result).toEqual({
        onboardingStatus: true,
        nickname: 'DB에_있는_닉네임',
      });
    });

    it('should return onboarding status when nickname exists in DB but JWT token nickname is null', async () => {
      // 먼저 DB에 닉네임 생성
      await userService.createNickname(testUtils.getTestUser().uuid, 'DB에_있는_닉네임');

      // JWT 토큰에는 닉네임이 null인 경우
      const userWithNullNicknameInToken: JwtPayload = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: null as any, // "nickname": null 과 같이 옴, 빈 문자열 x
        userType: UserType.student,
      };

      const result = await userController.getOnboardingStatus(userWithNullNicknameInToken);

      expect(result).toEqual({
        onboardingStatus: true,
        nickname: 'DB에_있는_닉네임',
      });
    });

    it('should return onboarding status false when nickname does not exist in both JWT token and DB', async () => {
      // JWT 토큰과 DB 모두에 닉네임이 없는 경우
      const userWithoutNickname: JwtPayload = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: null as any,
        userType: UserType.student,
      };

      const result = await userController.getOnboardingStatus(userWithoutNickname);

      expect(result).toEqual({
        onboardingStatus: false,
        nickname: expect.any(String), 
      });
      expect(result.nickname).toMatch(/^[가-힣]+_[가-힣]+_\d{4}$/); // 랜덤 닉네임 패턴 확인
    });

    it('should prioritize JWT token nickname over DB nickname', async () => {
      // 먼저 DB에 닉네임 생성
      await userService.createNickname(testUtils.getTestUser().uuid, 'DB에_있는_닉네임');

      // JWT 토큰에도 다른 닉네임이 있는 경우 (토큰이 우선)
      const userWithDifferentNicknameInToken: JwtPayload = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '토큰에_있는_닉네임',
        userType: UserType.student,
      };

      const result = await userController.getOnboardingStatus(userWithDifferentNicknameInToken);

      expect(result).toEqual({
        onboardingStatus: true,
        nickname: '토큰에_있는_닉네임', // 토큰의 닉네임이 우선
      });
    });
  });
});
