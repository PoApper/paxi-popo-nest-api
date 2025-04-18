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

import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomModule } from './room.module';
import { CreateRoomDto } from './dto/create-room.dto';
import { Room } from './entities/room.entity';
import { RoomStatus } from './entities/room.meta';

describe('RoomModule - Integration Test', () => {
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

  let roomController: RoomController;
  let roomService: RoomService;
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
        RoomModule,
        UserModule,
      ],
    }).compile();

    roomController = moduleFixture.get<RoomController>(RoomController);
    roomService = moduleFixture.get<RoomService>(RoomService);
    userService = moduleFixture.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(roomController).toBeDefined();
    expect(roomService).toBeDefined();
  });

  describe('create', () => {
    it('should create a room', async () => {
      const user = await userService.save({
        email: 'test@test.com',
        password: 'test',
        name: 'test',
        userType: UserType.student,
      });

      const dto: CreateRoomDto = {
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
      const result = await roomController.create(req, dto);
      expect(result).not.toBeNull();
      if (!result) {
        throw new Error('Room creation failed');
      }
      expect(result instanceof Room).toBe(true);
      expect(result.title).toBe(dto.title);
      expect(result.departureTime).toEqual(dto.departureTime);
      expect(result.departureLocation).toBe(dto.departureLocation);
      expect(result.destinationLocation).toBe(dto.destinationLocation);
      expect(result.maxParticipant).toBe(dto.maxParticipant);
      expect(result.currentParticipant).toBe(1);
      expect(result.status).toBe(RoomStatus.ACTIVATED);
      expect(result.description).toBe(dto.description);
    });
  });
});
