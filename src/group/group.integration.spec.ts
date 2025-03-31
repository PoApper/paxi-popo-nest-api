import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import configurations from 'src/config/configurations';
import { AppModule } from 'src/app.module';
import { UserService } from 'src/user/user.service';
import { UserType } from 'src/user/user.meta';
import { UserModule } from 'src/user/user.module';

import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupModule } from './group.module';
import { CreateGroupDto } from './dto/create-group.dto';
import { Group } from './entities/group.entity';
import { GroupStatus } from './entities/group.meta';

describe('GroupModule - Integration Test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    // 각 테스트async  끝날 때마다 테스트 DB 초기화
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
  });

  let groupController: GroupController;
  let groupService: GroupService;
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
        GroupModule,
        UserModule,
      ],
    }).compile();

    groupController = moduleFixture.get<GroupController>(GroupController);
    groupService = moduleFixture.get<GroupService>(GroupService);
    userService = moduleFixture.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(groupController).toBeDefined();
    expect(groupService).toBeDefined();
  });

  describe('create', () => {
    it('should create a group', async () => {
      const user = await userService.save({
        email: 'test@test.com',
        password: 'test',
        name: 'test',
        userType: UserType.student,
      });

      const dto: CreateGroupDto = {
        description: '캐리어 두 개 있습니다',
        title: '지곡회관 포항역 카풀해요~ 😎',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '지곡회관',
        destinationLocation: '포항역',
        maxParticipant: 4,
      };
      const req = {
        user: {
          uuid: user.uuid,
        },
      };
      const result = await groupController.create(req, dto);
      expect(result).not.toBeNull();
      if (!result) {
        throw new Error('Group creation failed');
      }
      expect(result instanceof Group).toBe(true);
      expect(result.title).toBe(dto.title);
      expect(result.departureTime).toEqual(dto.departureTime);
      expect(result.departureLocation).toBe(dto.departureLocation);
      expect(result.destinationLocation).toBe(dto.destinationLocation);
      expect(result.maxParticipant).toBe(dto.maxParticipant);
      expect(result.currentParticipant).toBe(1);
      expect(result.status).toBe(GroupStatus.ACTIVATED);
      expect(result.description).toBe(dto.description);
    });
  });
});
