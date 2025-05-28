import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import configurations from 'src/config/configurations';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';
import { TestUtils } from 'src/test/test-utils';

import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomModule } from './room.module';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomStatus } from './entities/room.meta';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { RoomWithUsersDto } from './dto/room-user-with-nickname.dto';

describe('RoomModule - Integration Test', () => {
  let app: INestApplication;

  let roomController: RoomController;
  let roomService: RoomService;
  let userService: UserService;
  let testUtils: TestUtils;

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

    app = moduleFixture.createNestApplication();
    await app.init();

    roomController = moduleFixture.get<RoomController>(RoomController);
    roomService = moduleFixture.get<RoomService>(RoomService);
    userService = moduleFixture.get<UserService>(UserService);
  });

  beforeEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
    testUtils = new TestUtils();
    await testUtils.initializeTestUsers(userService);
    await userService.createNickname(
      testUtils.getTestUser().uuid,
      '행복한_수소_1234',
    );
  });

  afterEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(roomController).toBeDefined();
    expect(roomService).toBeDefined();
  });

  describe('create', () => {
    it('should create a room', async () => {
      const dto: CreateRoomDto = {
        description: '캐리어 두 개 있습니다',
        title: '지곡회관 포항역 카풀해요~ 😎',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '지곡회관',
        destinationLocation: '포항역',
        maxParticipant: 4,
      };
      const result = await roomController.create(
        testUtils.getTestUserJwtToken(),
        dto,
      );
      expect(result).not.toBeNull();
      if (!result) {
        throw new Error('Room creation failed');
      }
      expect(result instanceof RoomWithUsersDto).toBe(true);
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

  describe('settlement', () => {
    it('should create a requested settlement with an account number', async () => {
      const room = await roomService.create(testUtils.getTestUser().uuid, {
        description: '캐리어 두 개 있습니다',
        title: '지곡회관 포항역 카풀해요~ 😎',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '지곡회관',
        destinationLocation: '포항역',
        maxParticipant: 4,
      });

      expect(room).not.toBeNull();
      if (!room) {
        throw new Error('Room creation failed');
      }

      const dto: CreateSettlementDto = {
        payAmount: 10000,
        payerAccountNumber: '123-456-7890-1234',
        payerAccountHolderName: '포닉스',
        payerBankName: '농협',
        updateAccount: true,
      };
      const settlement = await roomService.requestSettlement(
        room.uuid,
        testUtils.getTestUser().uuid,
        dto,
      );
      expect(settlement).not.toBeNull();
      if (!settlement) {
        throw new Error('Settlement creation failed');
      }
      expect(settlement.payAmount).toBe(dto.payAmount);

      // 계좌번호 복호화 검증
      const account = await userService.getAccount(
        testUtils.getTestUser().uuid,
      );
      expect(account).not.toBeNull();
      if (!account) {
        throw new Error('Account retrieval failed');
      }
      expect(account.accountNumber).toBe(dto.payerAccountNumber);
      expect(account.accountHolderName).toBe(dto.payerAccountHolderName);
      expect(account.bankName).toBe(dto.payerBankName);
    });
  });
});
