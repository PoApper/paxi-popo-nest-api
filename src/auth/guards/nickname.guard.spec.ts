import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Reflector } from '@nestjs/core';

import configurations from 'src/config/configurations';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';
import { TestUtils } from 'src/test/test-utils';
import { GuardName } from 'src/common/guard-name';

import { NicknameExistsGuard } from './nickname.guard';
import { User } from 'src/user/entities/user.entity';
import { Room } from 'src/room/entities/room.entity';
import { Nickname } from 'src/user/entities/nickname.entity';
import { Account } from 'src/user/entities/account.entity';
import { RoomUser } from 'src/room/entities/room-user.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { FcmKey } from 'src/fcm/entities/fcm-key.entity';
import { Report } from 'src/report/entities/report.entity';
import { AuthModule } from '../auth.module';

describe('NicknameExistsGuard', () => {
  let app: INestApplication;
  let guard: NicknameExistsGuard;
  let userService: UserService;
  let reflector: Reflector;
  let testUtils: TestUtils;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configurations],
          isGlobal: true,
          envFilePath: ['.env.test'],
        }),
        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: ':memory:',
            entities: [User, Account, Nickname, Room, RoomUser, Chat, FcmKey, Report],
            synchronize: true,
            dropSchema: true,
          }),
        UserModule,
        AuthModule,
      ],
      providers: [NicknameExistsGuard],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    guard = moduleFixture.get<NicknameExistsGuard>(NicknameExistsGuard);
    userService = moduleFixture.get<UserService>(UserService);
    reflector = moduleFixture.get<Reflector>(Reflector);
  });

  beforeEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
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
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when user has nickname in token', async () => {
      // 닉네임이 있는 유저 생성
      await userService.createNickname(
        testUtils.getTestUser().uuid,
        '테스트_닉네임_1234',
      );

      const mockRequest = {
        user: {
          uuid: testUtils.getTestUser().uuid,
          nickname: '테스트_닉네임_1234',
        },
      };

      const mockResponse = {
        cookie: jest.fn(),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      // reflector 모킹 - public guard가 아닌 경우
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = await guard.canActivate(mockContext as any);

      expect(result).toBe(true);
      expect(mockRequest.user.nickname).toBe('테스트_닉네임_1234');
    });

    it('should set nickname from database when token has no nickname', async () => {
      // 닉네임을 데이터베이스에만 저장하고 토큰에는 없는 경우
      // TODO: 이런 상황에서 닉네임을 담은 토큰을 새로 발급해 주는 쪽으로 변경함
      // 관련 PR: https://github.com/PoApper/paxi-popo-nest-api/pull/122
      await userService.createNickname(
        testUtils.getTestUser().uuid,
        '데이터베이스_닉네임_5678',
      );

      const mockRequest = {
        user: {
          uuid: testUtils.getTestUser().uuid,
          nickname: null, // 토큰에 닉네임이 없는 경우
        },
      };

      const mockResponse = {
        cookie: jest.fn(),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      // reflector 모킹 - public guard가 아닌 경우
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = await guard.canActivate(mockContext as any);

      expect(result).toBe(true);
      expect(mockRequest.user.nickname).toBe('데이터베이스_닉네임_5678');
    });

    it('should throw UnauthorizedException when user has no nickname', async () => {
      const mockRequest = {
        user: {
          uuid: testUtils.getTestUser().uuid,
          nickname: null,
        },
      };

      const mockResponse = {
        cookie: jest.fn(),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      // reflector 모킹 - public guard가 아닌 경우
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      await expect(guard.canActivate(mockContext as any)).rejects.toThrow(
        '닉네임이 존재하지 않습니다. 닉네임을 먼저 생성해주세요.',
      );
    });

    it('should return true when guard is marked as public', async () => {
      const mockRequest = {
        user: {
          uuid: testUtils.getTestUser().uuid,
          nickname: null, // 닉네임이 없어도 public guard이므로 통과
        },
      };

      const mockResponse = {
        cookie: jest.fn(),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      // reflector 모킹 - public guard인 경우
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([GuardName.NicknameGuard]);

      const result = await guard.canActivate(mockContext as any);

      expect(result).toBe(true);
      // 닉네임이 설정되지 않아야 함 (public guard이므로)
      expect(mockRequest.user.nickname).toBeNull();
    });

    it('should return true when public guards array is empty', async () => {
      const mockRequest = {
        user: {
          uuid: testUtils.getTestUser().uuid,
          nickname: null,
        },
      };

      const mockResponse = {
        cookie: jest.fn(),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      // reflector 모킹 - 빈 배열인 경우
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      // 닉네임이 없으므로 예외 발생
      await expect(guard.canActivate(mockContext as any)).rejects.toThrow(
        '닉네임이 존재하지 않습니다. 닉네임을 먼저 생성해주세요.',
      );
    });

    it('should return true when public guards array contains other guards', async () => {
      const mockRequest = {
        user: {
          uuid: testUtils.getTestUser().uuid,
          nickname: null,
        },
      };

      const mockResponse = {
        cookie: jest.fn(),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      // reflector 모킹 - 다른 guard만 있는 경우
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['OtherGuard' as GuardName]);

      // 닉네임이 없으므로 예외 발생
      await expect(guard.canActivate(mockContext as any)).rejects.toThrow(
        '닉네임이 존재하지 않습니다. 닉네임을 먼저 생성해주세요.',
      );
    });

    it('should handle user with empty string nickname', async () => {
      const mockRequest = {
        user: {
          uuid: testUtils.getTestUser().uuid,
          nickname: '', // 빈 문자열
        },
      };

      const mockResponse = {
        cookie: jest.fn(),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      // reflector 모킹 - public guard가 아닌 경우
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      // 빈 문자열은 falsy이므로 데이터베이스에서 닉네임을 찾으려고 시도
      // 닉네임이 없으므로 예외 발생
      await expect(guard.canActivate(mockContext as any)).rejects.toThrow(
        '닉네임이 존재하지 않습니다. 닉네임을 먼저 생성해주세요.',
      );
    });

    it('should handle user with undefined nickname', async () => {
      const mockRequest = {
        user: {
          uuid: testUtils.getTestUser().uuid,
          nickname: undefined,
        },
      };

      const mockResponse = {
        cookie: jest.fn(),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      // reflector 모킹 - public guard가 아닌 경우
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      // undefined는 falsy이므로 데이터베이스에서 닉네임을 찾으려고 시도
      // 닉네임이 없으므로 예외 발생
      await expect(guard.canActivate(mockContext as any)).rejects.toThrow(
        '닉네임이 존재하지 않습니다. 닉네임을 먼저 생성해주세요.',
      );
    });
  });
});
