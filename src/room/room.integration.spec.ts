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
import { FcmService } from 'src/fcm/fcm.service';

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
  let fcmService: FcmService;

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
        RoomModule,
        UserModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    roomController = moduleFixture.get<RoomController>(RoomController);
    roomService = moduleFixture.get<RoomService>(RoomService);
    userService = moduleFixture.get<UserService>(UserService);
    fcmService = moduleFixture.get<FcmService>(FcmService);
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

    // sendPushNotificationByUserUuid 모킹
    if (fcmService) {
      jest
        .spyOn(fcmService, 'sendPushNotificationByUserUuid')
        .mockResolvedValue({
          successCount: 1,
          failureCount: 0,
          responses: [],
        });
    }
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

  describe('cancelKickUserFromRoom', () => {
    let testRoom: any;
    let kickedUser: any;
    let testUserJwt: JwtPayload;

    beforeEach(async () => {
      testRoom = await roomService.create(testUtils.getTestUser().uuid, {
        description: '테스트 방입니다',
        title: '테스트 방',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '출발지',
        destinationLocation: '도착지',
        maxParticipant: 4,
      });

      // 강퇴할 유저 생성
      kickedUser = await userService.save({
        email: 'kicked@test.com',
        password: 'password123',
        name: 'Kicked User',
        userType: UserType.student,
      });

      await userService.createNickname(kickedUser.uuid, '강퇴된_유저_1234');

      // 방에 참여시킨 후 강퇴
      await roomService.joinRoom(testRoom.uuid, kickedUser.uuid);
      await roomService.kickUserFromRoom(
        testRoom.uuid,
        testUtils.getTestUser().uuid,
        kickedUser.uuid,
        '테스트 강퇴',
        UserType.student,
      );

      testUserJwt = {
        uuid: testUtils.getTestUser().uuid,
        email: testUtils.getTestUser().email,
        name: testUtils.getTestUser().name,
        nickname: '행복한_수소_1234',
        userType: UserType.student,
      };
    });

    it('should cancel kick user from room successfully', async () => {
      const result = await roomService.cancelKickUserFromRoom(
        testRoom.uuid,
        testUtils.getTestUser().uuid,
        kickedUser.uuid,
        UserType.student,
      );

      expect(result).toBeDefined();
      expect(result.uuid).toBe(testRoom.uuid);

      // 강퇴된 사용자가 방에 다시 참여할 수 있는지 확인
      const joinResult = await roomService.joinRoom(
        testRoom.uuid,
        kickedUser.uuid,
      );
      expect(joinResult.room.uuid).toBe(testRoom.uuid);
    });

    it('should throw NotFoundException when kicked user does not exist', async () => {
      const nonExistentUserUuid = '123e4567-e89b-12d3-a456-426614174000';

      await expect(
        roomService.cancelKickUserFromRoom(
          testRoom.uuid,
          testUtils.getTestUser().uuid,
          nonExistentUserUuid,
          UserType.student,
        ),
      ).rejects.toThrow('강퇴된 사용자를 찾을 수 없습니다.');
    });

    it('should throw UnauthorizedException when user is not the owner or admin', async () => {
      // 다른 유저 생성
      const anotherUser = await userService.save({
        email: 'another@test.com',
        password: 'password123',
        name: 'Another User',
        userType: UserType.student,
      });

      await expect(
        roomService.cancelKickUserFromRoom(
          testRoom.uuid,
          anotherUser.uuid,
          kickedUser.uuid,
          UserType.student,
        ),
      ).rejects.toThrow('방장 또는 관리자만 강퇴를 취소할 수 있습니다.');
    });

    it('should allow admin to cancel kick any user', async () => {
      const adminJwt: JwtPayload = {
        uuid: 'admin-uuid',
        email: 'admin@test.com',
        name: 'Admin User',
        nickname: 'admin',
        userType: UserType.admin,
      };

      const result = await roomService.cancelKickUserFromRoom(
        testRoom.uuid,
        adminJwt.uuid,
        kickedUser.uuid,
        UserType.admin,
      );

      expect(result).toBeDefined();
      expect(result.uuid).toBe(testRoom.uuid);

      // 방 재입장
      const joinResult = await roomService.joinRoom(
        testRoom.uuid,
        kickedUser.uuid,
      );
      expect(joinResult.room.uuid).toBe(testRoom.uuid);
    });

    it('should work through controller', async () => {
      const result = await roomController.cancelKickUserFromRoom(
        testUserJwt,
        testRoom.uuid,
        { kickedUserUuid: kickedUser.uuid },
      );

      expect(result).toBeDefined();
      expect(result.uuid).toBe(testRoom.uuid);

      // 방 재입장
      const joinResult = await roomService.joinRoom(
        testRoom.uuid,
        kickedUser.uuid,
      );
      expect(joinResult.room.uuid).toBe(testRoom.uuid);
    });
  });

  describe('statistics', () => {
    it('should return monthly statistics with status and location dictionaries', async () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const mStr = m.toString().padStart(2, '0');
      
      // 현재 월의 마지막 날 계산
      const lastDay = new Date(y, m, 0).getDate();
      
      const startDate = `${y}-${mStr}-01`;
      const endDate = `${y}-${mStr}-${lastDay}`;

      // Room A (ACTIVE)
      const roomA = await roomService.create(testUtils.getTestUser().uuid, {
        description: 'A desc',
        title: 'A 제목',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
        departureLocation: '학생회관',
        destinationLocation: '포항역',
        maxParticipant: 4,
      });

      // Room B (IN_SETTLEMENT)
      const roomB = await roomService.create(testUtils.getTestUser().uuid, {
        description: 'B desc',
        title: 'B 제목',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        departureLocation: '지곡회관',
        destinationLocation: '포항역',
        maxParticipant: 4,
      });
      await roomService.requestSettlement(
        roomB.uuid,
        testUtils.getTestUser().uuid,
        {
          payAmount: 1000,
          payerAccountNumber: '111-222',
          payerAccountHolderName: '테스터',
          payerBankName: '국민',
          updateAccount: true,
        },
      );

      // Room C (COMPLETED)
      const roomC = await roomService.create(testUtils.getTestUser().uuid, {
        description: 'C desc',
        title: 'C 제목',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
        departureLocation: '학생회관',
        destinationLocation: '지곡회관',
        maxParticipant: 4,
      });
      await roomService.requestSettlement(
        roomC.uuid,
        testUtils.getTestUser().uuid,
        {
          payAmount: 2000,
          payerAccountNumber: '333-444',
          payerAccountHolderName: '테스터',
          payerBankName: '농협',
          updateAccount: true,
        },
      );
      await roomService.completeRoom(
        roomC.uuid,
        testUtils.getTestUser().uuid,
        UserType.student,
      );

      // Room D (DELETED)
      const roomD = await roomService.create(testUtils.getTestUser().uuid, {
        description: 'D desc',
        title: 'D 제목',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
        departureLocation: '포항역',
        destinationLocation: '학생회관',
        maxParticipant: 4,
      });
      await roomService.remove(roomD.uuid, testUtils.getTestUser().uuid);

      const res = await roomController.getRoomStatistics({
        startDate,
        endDate,
      });
      expect(res).toBeDefined();
      
      // 현재 월을 기준으로 monthKey 생성 (두 자리 월 형식으로)
      const monthKey = `${y}-${mStr}`;
      
      const monthData = res.data[monthKey];
      expect(monthData).toBeDefined();
      if (!monthData) {
        throw new Error(`Month data not found for key: ${monthKey}. Available keys: ${Object.keys(res.data)}`);
      }

      // statusCounts dictionary
      expect(monthData.statusCounts).toBeDefined();
      expect(typeof monthData.statusCounts.total).toBe('number');
      expect(monthData.statusCounts.total).toBeGreaterThanOrEqual(4);
      // ACTIVE는 총 1개 (A)
      expect(
        monthData.statusCounts[RoomStatus.ACTIVATED],
      ).toBeGreaterThanOrEqual(1);
      // IN_SETTLEMENT는 총 1개 (B)
      expect(
        monthData.statusCounts[RoomStatus.IN_SETTLEMENT],
      ).toBeGreaterThanOrEqual(1);
      // COMPLETED는 총 1개 (C)
      expect(
        monthData.statusCounts[RoomStatus.COMPLETED],
      ).toBeGreaterThanOrEqual(1);
      // DELETED는 총 1개 (D)
      expect(monthData.statusCounts[RoomStatus.DELETED]).toBeGreaterThanOrEqual(
        1,
      );

      // locations dictionary
      expect(monthData.departureLocationCounts).toBeDefined();
      expect(monthData.destinationLocationCounts).toBeDefined();
      // 키-값 형태 검증
      expect(typeof monthData.departureLocationCounts).toBe('object');
      expect(typeof monthData.destinationLocationCounts).toBe('object');
      // 총합 검증
      expect(monthData.departureLocationCounts.total).toBe(
        monthData.statusCounts.total,
      );
      expect(monthData.destinationLocationCounts.total).toBe(
        monthData.statusCounts.total,
      );
    });
  });
});
