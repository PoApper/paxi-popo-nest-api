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

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserModule } from './user.module';
import { UserType } from './user.meta';
import { Nickname } from './entities/nickname.entity';

describe('UserModule - Integration Test', () => {
  let app: INestApplication;

  let userController: UserController;
  let userService: UserService;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configurations],
          isGlobal: true,
          envFilePath: ['.env'],
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
      const user = await userService.save({
        email: 'test@test.com',
        password: 'test',
        name: 'test',
        userType: UserType.student,
      });
      const req = {
        user: {
          uuid: user.uuid,
        },
      };
      const nickname: Nickname = await userController.createNickname(req, {
        nickname: 'test',
      });

      expect(nickname.nickname).toBe('test');
      expect(nickname.userUuid).toBe(user.uuid);
      expect(nickname.createdAt).toBeDefined();
      expect(nickname.updatedAt).toBeDefined();
      expect(nickname.id).toBeDefined();
    });

    it('should not create a duplicated nickname', async () => {
      const sameNickname = 'test';
      const user1 = await userService.save({
        email: 'test@test.com',
        password: 'test',
        name: 'test',
        userType: UserType.student,
      });
      const req = {
        user: {
          uuid: user1.uuid,
        },
      };
      const user1Nickname: Nickname = await userController.createNickname(req, {
        nickname: sameNickname,
      });

      expect(user1Nickname.nickname).toBe(sameNickname);
      expect(user1Nickname.userUuid).toBe(user1.uuid);
      expect(user1Nickname.createdAt).toBeDefined();
      expect(user1Nickname.updatedAt).toBeDefined();
      expect(user1Nickname.id).toBeDefined();

      const user2 = await userService.save({
        email: 'test2@test.com',
        password: 'test',
        name: 'test2',
        userType: UserType.student,
      });
      const user2Req = {
        user: {
          uuid: user2.uuid,
        },
      };
      await expect(
        userController.createNickname(user2Req, {
          nickname: sameNickname,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should not create a nickname if the user already has a nickname', async () => {
      const user = await userService.save({
        email: 'test@test.com',
        password: 'test',
        name: 'test',
        userType: UserType.student,
      });
      const req = {
        user: {
          uuid: user.uuid,
        },
      };
      await userController.createNickname(req, {
        nickname: 'test',
      });

      await expect(
        userController.createNickname(req, {
          nickname: 'test',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateNickname', () => {
    it('should update a nickname', async () => {
      const user = await userService.save({
        email: 'test@test.com',
        password: 'test',
        name: 'test',
        userType: UserType.student,
      });
      const req = {
        user: {
          uuid: user.uuid,
        },
      };
      await userController.createNickname(req, {
        nickname: 'test',
      });

      const updatedNickname = await userController.updateNickname(
        req,
        user.uuid,
        {
          nickname: 'test2',
        },
      );

      expect(updatedNickname).toBe('test2');
    });

    it('should not update a nickname if another user already has the nickname', async () => {
      const user1 = await userService.save({
        email: 'test@test.com',
        password: 'test',
        name: 'test',
        userType: UserType.student,
      });
      const req = {
        user: {
          uuid: user1.uuid,
        },
      };
      await userController.createNickname(req, {
        nickname: 'test',
      });

      const user2 = await userService.save({
        email: 'test2@test.com',
        password: 'test',
        name: 'test2',
        userType: UserType.student,
      });
      const user2Req = {
        user: {
          uuid: user2.uuid,
        },
      };
      await userController.createNickname(user2Req, {
        nickname: 'test2',
      });

      const admin = await userService.save({
        email: 'admin@test.com',
        password: 'test',
        name: 'admin',
        userType: UserType.admin,
      });
      const adminReq = {
        user: {
          uuid: admin.uuid,
        },
      };
      await expect(
        userController.updateNickname(adminReq, user2.uuid, {
          nickname: 'test',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should not update a nickname if the user does not have a nickname', async () => {
      const admin = await userService.save({
        email: 'test@test.com',
        password: 'test',
        name: 'test',
        userType: UserType.admin,
      });
      const req = {
        user: {
          uuid: admin.uuid,
        },
      };
      const nonExistedUserUuid = 'non-existed-user-uuid';
      await expect(
        userController.updateNickname(req, nonExistedUserUuid, {
          nickname: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
