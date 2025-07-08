import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import configurations from 'src/config/configurations';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';
import { TestUtils } from 'src/test/test-utils';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { UserType } from 'src/user/user.meta';

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

  describe('update', () => {
    let testRoom: any;
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      // Create a test room
      testRoom = await roomService.create(testUtils.getTestUser().uuid, {
        description: '캐리어 두 개 있습니다',
        title: '지곡회관 포항역 카풀해요~ 😎',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '지곡회관',
        destinationLocation: '포항역',
        maxParticipant: 4,
      });

      testUserJwt = testUtils.getTestUserJwtToken();
    });

    it('should successfully update room information', async () => {
      const updateDto = {
        title: '수정된 방 제목',
        description: '수정된 설명',
        maxParticipant: 6,
      };

      const result = await roomController.update(
        testRoom.uuid,
        testUserJwt,
        updateDto,
      );

      expect(result).toBeDefined();
      expect(result.title).toBe(updateDto.title);
      expect(result.description).toBe(updateDto.description);
      expect(result.maxParticipant).toBe(updateDto.maxParticipant);
      expect(result.departureLocation).toBe(testRoom.departureLocation); // 바뀌지 않음
      expect(result.destinationLocation).toBe(testRoom.destinationLocation); // 바뀌지 않음

      const updateDto2 = {
        title: '다중 수정 제목',
        description: '다중 수정 설명',
        maxParticipant: 8,
        departureLocation: '수정된 출발지',
        destinationLocation: '수정된 도착지',
      };

      const result2 = await roomController.update(
        testRoom.uuid,
        testUserJwt,
        updateDto2,
      );

      expect(result2.title).toBe(updateDto2.title);
      expect(result2.description).toBe(updateDto2.description);
      expect(result2.maxParticipant).toBe(updateDto2.maxParticipant);
      expect(result2.departureLocation).toBe(updateDto2.departureLocation);
      expect(result2.destinationLocation).toBe(updateDto2.destinationLocation);
    });

    it('should update departure time and reset departure alert', async () => {
      const newDepartureTime = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48시간 뒤
      const updateDto = {
        departureTime: newDepartureTime,
      };

      const result = await roomController.update(
        testRoom.uuid,
        testUserJwt,
        updateDto,
      );

      expect(result).toBeDefined();
      expect(result.departureTime.getTime()).toBe(newDepartureTime.getTime());
      expect(result.departureAlertSent).toBe(false); // 출발 알림 초기화
    });

    it('should update only provided fields', async () => {
      const updateDto = {
        title: '부분 수정된 제목',
      };

      const result = await roomController.update(
        testRoom.uuid,
        testUserJwt,
        updateDto,
      );

      expect(result).toBeDefined();
      expect(result.title).toBe(updateDto.title);
      expect(result.description).toBe(testRoom.description); // 바뀌지 않음
      expect(result.maxParticipant).toBe(testRoom.maxParticipant); // 바뀌지 않음
      expect(result.departureLocation).toBe(testRoom.departureLocation); // 바뀌지 않음
    });

    it('should throw BadRequestException when departure time is in the past', async () => {
      const pastTime = new Date(Date.now() - 1000 * 60 * 60); // 1시간 전
      const updateDto = {
        departureTime: pastTime,
      };

      await expect(
        roomController.update(testRoom.uuid, testUserJwt, updateDto),
      ).rejects.toThrow('출발 시간은 현재 시간보다 이전일 수 없습니다.');
    });

    it('should throw NotFoundException when room does not exist', async () => {
      const nonExistentUuid = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto = {
        title: '수정된 제목',
      };

      await expect(
        roomController.update(nonExistentUuid, testUserJwt, updateDto),
        // TODO: 에러 메세지 constants로 빼는 것 고민
      ).rejects.toThrow('방이 존재하지 않습니다.');
    });

    it('should throw UnauthorizedException when user is not the owner or admin', async () => {
      // 다른 유저 생성
      const anotherUser = await userService.save({
        email: 'another@test.com',
        password: 'password123',
        name: 'Another User',
        userType: UserType.student,
      });

      const anotherUserJwt: JwtPayload = {
        uuid: anotherUser.uuid,
        email: anotherUser.email,
        name: anotherUser.name,
        nickname: 'another_user',
        userType: UserType.student,
      };

      const updateDto = {
        title: '수정된 제목',
      };

      await expect(
        roomController.update(testRoom.uuid, anotherUserJwt, updateDto),
      ).rejects.toThrow('방장 또는 관리자가 아닙니다.');
    });

    it('should allow admin to update any room', async () => {
      const adminJwt: JwtPayload = {
        uuid: 'admin-uuid',
        email: 'admin@test.com',
        name: 'Admin User',
        nickname: 'admin',
        userType: UserType.admin,
      };

      const updateDto = {
        title: '관리자가 수정한 제목',
      };

      const result = await roomController.update(
        testRoom.uuid,
        adminJwt,
        updateDto,
      );

      expect(result).toBeDefined();
      expect(result.title).toBe(updateDto.title);
    });

    it('should throw BadRequestException when the room is completed', async () => {
      // 먼저 정산 요청을 통해 방을 정산 상태로 만듦
      await roomService.requestSettlement(
        testRoom.uuid,
        testUtils.getTestUser().uuid,
        {
          payAmount: 10000,
          payerAccountNumber: '123-456-7890-1234',
          payerAccountHolderName: '포닉스',
          payerBankName: '농협',
          updateAccount: true,
        },
      );

      // 그 후 방을 완료
      await roomService.completeRoom(
        testRoom.uuid,
        testUtils.getTestUser().uuid,
        UserType.student,
      );

      const updateDto = {
        title: '수정된 제목',
      };

      await expect(
        roomController.update(testRoom.uuid, testUserJwt, updateDto),
      ).rejects.toThrow('이미 종료된 방입니다.');
    });

    it('should throw BadRequestException when the room is deleted', async () => {
      // 먼저 방을 삭제
      await roomService.remove(testRoom.uuid, testUtils.getTestUser().uuid);

      const updateDto = {
        title: '수정된 제목',
      };

      await expect(
        roomController.update(testRoom.uuid, testUserJwt, updateDto),
      ).rejects.toThrow('이미 종료된 방입니다.');
    });
  });
});
