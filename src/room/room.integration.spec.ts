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
import { ResponseRoomDto } from './dto/response-room.dto';

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
    await userService.createNickname(
      testUtils.getTestAdmin().uuid,
      '관리자_닉네임_5678',
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
      expect(result instanceof ResponseRoomDto).toBe(true);
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

  describe('findOne', () => {
    let testRoom: ResponseRoomDto;

    beforeEach(async () => {
      testRoom = await roomService.create(testUtils.getTestUser().uuid, {
        description: '테스트 방입니다',
        title: '테스트 방',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '출발지',
        destinationLocation: '도착지',
        maxParticipant: 4,
      });
    });

    it('should return myRoomUser when user is a participant', async () => {
      const result = await roomController.findOne(
        testUtils.getTestUserJwtToken(),
        testRoom.uuid,
      );

      expect(result).toBeDefined();
      expect(result.uuid).toBe(testRoom.uuid);
      expect(result.myRoomUser).toBeDefined();
      expect(result.myRoomUser!.status).toBe('JOINED');
      expect(result.myRoomUser!.isMuted).toBe(false);
      expect(result.myRoomUser!.isPaid).toBe(false);
      expect(typeof result.myRoomUser!.hasNewMessage).toBe('boolean');
    });

    it('should return myRoomUser as undefined when user is not a participant', async () => {
      const nonParticipant = await userService.save({
        email: 'nonparticipant@test.com',
        password: 'password123',
        name: 'Non Participant',
        userType: UserType.student,
      });

      const nonParticipantJwt: JwtPayload = {
        uuid: nonParticipant.uuid,
        email: nonParticipant.email,
        name: nonParticipant.name,
        nickname: 'non_participant',
        userType: UserType.student,
      };

      const result = await roomController.findOne(
        nonParticipantJwt,
        testRoom.uuid,
      );

      expect(result).toBeDefined();
      expect(result.uuid).toBe(testRoom.uuid);
      expect(result.myRoomUser).toBeUndefined();
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
      await roomService.create(testUtils.getTestUser().uuid, {
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
        throw new Error(
          `Month data not found for key: ${monthKey}. Available keys: ${Object.keys(res.data).join(', ')}`,
        );
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

  describe('settlement', () => {
    let testRoom: any;
    let testUser: any;

    beforeEach(async () => {
      testUser = testUtils.getTestUser();
      testRoom = await roomService.create(testUser.uuid, {
        description: 'Test room for settlement',
        title: '정산 테스트 방',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
        departureLocation: '학생회관',
        destinationLocation: '포항역',
        maxParticipant: 4,
      });
    });

    describe('requestSettlement', () => {
      it('should request settlement successfully', async () => {
        const settlementDto = {
          payAmount: 10000,
          payerAccountNumber: '123-456-789',
          payerAccountHolderName: '테스터',
          payerBankName: '국민은행',
          updateAccount: true,
        };

        const result = await roomService.requestSettlement(
          testRoom.uuid,
          testUser.uuid,
          settlementDto,
        );

        expect(result).toBeDefined();
        expect(result.roomUuid).toBe(testRoom.uuid);
        expect(result.payerNickname).toBe('행복한_수소_1234');
        expect(result.payAmount).toBe(10000);
        expect(result.payerAccountHolderName).toBe('테스터');
        expect(result.payerBankName).toBe('국민은행');
        expect(result.payAmountPerPerson).toBe(10000); // 1명이므로 전체 금액
      });

      it('should throw BadRequestException when room is already in settlement', async () => {
        const settlementDto = {
          payAmount: 10000,
          payerAccountNumber: '123-456-789',
          payerAccountHolderName: '테스터',
          payerBankName: '국민은행',
          updateAccount: true,
        };

        // 첫 번째 정산 요청
        await roomService.requestSettlement(
          testRoom.uuid,
          testUser.uuid,
          settlementDto,
        );

        // 두 번째 정산 요청 시도
        await expect(
          roomService.requestSettlement(
            testRoom.uuid,
            testUser.uuid,
            settlementDto,
          ),
        ).rejects.toThrow('이미 정산이 진행되고 있습니다.');
      });

      it('should throw BadRequestException when room is deleted', async () => {
        // 방 삭제
        await roomService.remove(testRoom.uuid, testUser.uuid);

        const settlementDto = {
          payAmount: 10000,
          payerAccountNumber: '123-456-789',
          payerAccountHolderName: '테스터',
          payerBankName: '국민은행',
          updateAccount: true,
        };

        await expect(
          roomService.requestSettlement(
            testRoom.uuid,
            testUser.uuid,
            settlementDto,
          ),
        ).rejects.toThrow('삭제된 방입니다.');
      });

      it('should throw BadRequestException when room is completed', async () => {
        const settlementDto = {
          payAmount: 10000,
          payerAccountNumber: '123-456-789',
          payerAccountHolderName: '테스터',
          payerBankName: '국민은행',
          updateAccount: true,
        };

        // 정산 요청
        await roomService.requestSettlement(
          testRoom.uuid,
          testUser.uuid,
          settlementDto,
        );

        // 방 완료
        await roomService.completeRoom(
          testRoom.uuid,
          testUser.uuid,
          UserType.student,
        );

        // 완료된 방에 정산 요청 시도
        await expect(
          roomService.requestSettlement(
            testRoom.uuid,
            testUser.uuid,
            settlementDto,
          ),
        ).rejects.toThrow('정산이 종료된 방입니다.');
      });
    });

    describe('updateSettlement', () => {
      beforeEach(async () => {
        const settlementDto = {
          payAmount: 10000,
          payerAccountNumber: '123-456-789',
          payerAccountHolderName: '테스터',
          payerBankName: '국민은행',
          updateAccount: true,
        };

        await roomService.requestSettlement(
          testRoom.uuid,
          testUser.uuid,
          settlementDto,
        );
      });

      it('should update settlement successfully', async () => {
        const updateDto = {
          payAmount: 15000,
          payerAccountNumber: '987-654-321',
          payerAccountHolderName: '수정된테스터',
          payerBankName: '신한은행',
          updateAccount: true,
        };

        const result = await roomService.updateSettlement(
          testRoom.uuid,
          testUser.uuid,
          updateDto,
        );

        expect(result).toBeDefined();
        expect(result.payAmount).toBe(15000);
        expect(result.payerAccountHolderName).toBe('수정된테스터');
        expect(result.payerBankName).toBe('신한은행');
        expect(result.payAmountPerPerson).toBe(15000);
      });

      it('should throw BadRequestException when room is not in settlement', async () => {
        // 정산 취소
        await roomService.cancelSettlement(testRoom.uuid, testUser.uuid);

        const updateDto = {
          payAmount: 15000,
          payerAccountNumber: '987-654-321',
          payerAccountHolderName: '수정된테스터',
          payerBankName: '신한은행',
          updateAccount: true,
        };

        await expect(
          roomService.updateSettlement(testRoom.uuid, testUser.uuid, updateDto),
        ).rejects.toThrow('정산이 진행되고 있지 않습니다.');
      });

      it('should throw UnauthorizedException when user is not the payer', async () => {
        const otherUser = testUtils.getTestAdmin();

        const updateDto = {
          payAmount: 15000,
          payerAccountNumber: '987-654-321',
          payerAccountHolderName: '수정된테스터',
          payerBankName: '신한은행',
          updateAccount: true,
        };

        await expect(
          roomService.updateSettlement(
            testRoom.uuid,
            otherUser.uuid,
            updateDto,
          ),
        ).rejects.toThrow('정산자가 아니므로 정산 정보를 수정할 수 없습니다.');
      });
    });

    describe('cancelSettlement', () => {
      beforeEach(async () => {
        const settlementDto = {
          payAmount: 10000,
          payerAccountNumber: '123-456-789',
          payerAccountHolderName: '테스터',
          payerBankName: '국민은행',
          updateAccount: true,
        };

        await roomService.requestSettlement(
          testRoom.uuid,
          testUser.uuid,
          settlementDto,
        );
      });

      it('should cancel settlement successfully', async () => {
        const result = await roomService.cancelSettlement(
          testRoom.uuid,
          testUser.uuid,
        );

        expect(result).toBeDefined();
        expect(result!.status).toBe(RoomStatus.ACTIVATED);
        expect(result!.payerUuid).toBeNull();
        expect(result!.payAmount).toBeNull();
      });

      it('should throw BadRequestException when room is not in settlement', async () => {
        // 정산 취소
        await roomService.cancelSettlement(testRoom.uuid, testUser.uuid);

        // 이미 취소된 정산을 다시 취소 시도
        await expect(
          roomService.cancelSettlement(testRoom.uuid, testUser.uuid),
        ).rejects.toThrow('정산이 진행되고 있지 않습니다.');
      });

      it('should throw UnauthorizedException when user is not the payer', async () => {
        const otherUser = testUtils.getTestAdmin();

        await expect(
          roomService.cancelSettlement(testRoom.uuid, otherUser.uuid),
        ).rejects.toThrow('정산자가 아니므로 정산 요청을 취소할 수 없습니다.');
      });
    });

    describe('getSettlement', () => {
      beforeEach(async () => {
        const settlementDto = {
          payAmount: 10000,
          payerAccountNumber: '123-456-789',
          payerAccountHolderName: '테스터',
          payerBankName: '국민은행',
          updateAccount: true,
        };

        await roomService.requestSettlement(
          testRoom.uuid,
          testUser.uuid,
          settlementDto,
        );
      });

      it('should get settlement information successfully', async () => {
        const result = await roomService.getSettlement(testRoom.uuid);

        expect(result).toBeDefined();
        expect(result.roomUuid).toBe(testRoom.uuid);
        expect(result.payerNickname).toBe('행복한_수소_1234');
        expect(result.payAmount).toBe(10000);
        expect(result.payerAccountHolderName).toBe('테스터');
        expect(result.payerBankName).toBe('국민은행');
        expect(result.payAmountPerPerson).toBe(10000);
      });

      it('should throw BadRequestException when room is not in settlement', async () => {
        // 정산 취소
        await roomService.cancelSettlement(testRoom.uuid, testUser.uuid);

        await expect(roomService.getSettlement(testRoom.uuid)).rejects.toThrow(
          '정산이 진행되고 있지 않습니다.',
        );
      });

      it('should throw NotFoundException when room does not exist', async () => {
        const nonExistentUuid = '123e4567-e89b-12d3-a456-426614174000';

        await expect(
          roomService.getSettlement(nonExistentUuid),
        ).rejects.toThrow('방이 존재하지 않습니다.');
      });
    });

    describe('updateRoomUserIsPaid', () => {
      it('should throw BadRequestException when room is not in settlement', async () => {
        const otherUser = testUtils.getTestAdmin();

        await expect(
          roomService.updateRoomUserIsPaid(testRoom.uuid, otherUser.uuid, true),
        ).rejects.toThrow('정산이 진행되고 있지 않습니다.');
      });

      it('should throw BadRequestException when user is not in room', async () => {
        const otherUser = testUtils.getTestAdmin();

        const settlementDto = {
          payAmount: 10000,
          payerAccountNumber: '123-456-789',
          payerAccountHolderName: '테스터',
          payerBankName: '국민은행',
          updateAccount: true,
        };

        await roomService.requestSettlement(
          testRoom.uuid,
          testUser.uuid,
          settlementDto,
        );

        await expect(
          roomService.updateRoomUserIsPaid(testRoom.uuid, otherUser.uuid, true),
        ).rejects.toThrow('방에 가입되어 있지 않습니다.');
      });
    });

    describe('completeRoom', () => {
      beforeEach(async () => {
        const settlementDto = {
          payAmount: 10000,
          payerAccountNumber: '123-456-789',
          payerAccountHolderName: '테스터',
          payerBankName: '국민은행',
          updateAccount: true,
        };

        await roomService.requestSettlement(
          testRoom.uuid,
          testUser.uuid,
          settlementDto,
        );
      });

      it('should complete room successfully', async () => {
        const result = await roomService.completeRoom(
          testRoom.uuid,
          testUser.uuid,
          UserType.student,
        );

        expect(result).toBeDefined();
        expect(result!.status).toBe(RoomStatus.COMPLETED);
      });

      it('should throw BadRequestException when room is already completed', async () => {
        // 방 완료
        await roomService.completeRoom(
          testRoom.uuid,
          testUser.uuid,
          UserType.student,
        );

        // 이미 완료된 방을 다시 완료 시도
        await expect(
          roomService.completeRoom(
            testRoom.uuid,
            testUser.uuid,
            UserType.student,
          ),
        ).rejects.toThrow('이미 종료된 방입니다.');
      });

      it('should throw UnauthorizedException when user is not the payer or admin', async () => {
        const otherUser = testUtils.getTestAdmin();

        await expect(
          roomService.completeRoom(
            testRoom.uuid,
            otherUser.uuid,
            UserType.student,
          ),
        ).rejects.toThrow('정산자 또는 관리자가 아닙니다.');
      });

      it('should allow admin to complete room', async () => {
        const adminUser = testUtils.getTestAdmin();

        const result = await roomService.completeRoom(
          testRoom.uuid,
          adminUser.uuid,
          UserType.admin,
        );

        expect(result).toBeDefined();
        expect(result!.status).toBe(RoomStatus.COMPLETED);
      });
    });
  });

  describe('joinRoom - settlement condition', () => {
    let testRoom: any;
    let testUser: any;
    let otherUser: any;

    beforeEach(async () => {
      testUser = testUtils.getTestUser();
      otherUser = testUtils.getTestAdmin();

      testRoom = await roomService.create(testUser.uuid, {
        description: 'Test room for join',
        title: '참여 테스트 방',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
        departureLocation: '학생회관',
        destinationLocation: '포항역',
        maxParticipant: 4,
      });
    });

    it('should join room successfully when room is activated', async () => {
      const result = await roomService.joinRoom(testRoom.uuid, otherUser.uuid);

      expect(result).toBeDefined();
      expect(result.sendMessage).toBe(true);
      expect(result.room.uuid).toBe(testRoom.uuid);
      expect(result.room.roomUsers).toHaveLength(2); // 방장 + 참여한 사용자
    });

    it('should throw BadRequestException when trying to join room in settlement', async () => {
      // 정산 요청
      const settlementDto = {
        payAmount: 10000,
        payerAccountNumber: '123-456-789',
        payerAccountHolderName: '테스터',
        payerBankName: '국민은행',
        updateAccount: true,
      };

      await roomService.requestSettlement(
        testRoom.uuid,
        testUser.uuid,
        settlementDto,
      );

      const newUser = await userService.save({
        email: 'new@test.com',
        password: 'password123',
        name: 'New User',
        userType: UserType.student,
      });
      await userService.createNickname(newUser.uuid, '새로운_유저_1234');
      // 정산 중인 방에 참여 시도
      await expect(
        roomService.joinRoom(testRoom.uuid, newUser.uuid),
      ).rejects.toThrow('정산이 진행되고 있어 참여할 수 없습니다.');
    });

    it('should throw BadRequestException when trying to join completed room', async () => {
      // 정산 요청
      const settlementDto = {
        payAmount: 10000,
        payerAccountNumber: '123-456-789',
        payerAccountHolderName: '테스터',
        payerBankName: '국민은행',
        updateAccount: true,
      };

      await roomService.requestSettlement(
        testRoom.uuid,
        testUser.uuid,
        settlementDto,
      );

      // 방 완료
      await roomService.completeRoom(
        testRoom.uuid,
        testUser.uuid,
        UserType.student,
      );

      const newUser = await userService.save({
        email: 'new@test.com',
        password: 'password123',
        name: 'New User',
        userType: UserType.student,
      });
      await userService.createNickname(newUser.uuid, '새로운_유저_1234');
      // 완료된 방에 참여 시도
      await expect(
        roomService.joinRoom(testRoom.uuid, newUser.uuid),
      ).rejects.toThrow('정산이 진행되고 있어 참여할 수 없습니다.');
    });

    it('should allow re-joining for existing room users even when room is in settlement', async () => {
      // 먼저 방에 참여
      await roomService.joinRoom(testRoom.uuid, otherUser.uuid);

      // 정산 요청
      const settlementDto = {
        payAmount: 10000,
        payerAccountNumber: '123-456-789',
        payerAccountHolderName: '테스터',
        payerBankName: '국민은행',
        updateAccount: true,
      };

      await roomService.requestSettlement(
        testRoom.uuid,
        testUser.uuid,
        settlementDto,
      );

      // 이미 참여한 사용자가 다시 참여 시도
      const result = await roomService.joinRoom(testRoom.uuid, otherUser.uuid);

      expect(result).toBeDefined();
      expect(result.sendMessage).toBe(false); // 이미 참여한 사용자이므로 메시지 전송 안함
      expect(result.room.uuid).toBe(testRoom.uuid);
    });

    it('should allow re-joining for existing room users even when room is completed', async () => {
      // 먼저 방에 참여
      await roomService.joinRoom(testRoom.uuid, otherUser.uuid);

      // 정산 요청
      const settlementDto = {
        payAmount: 10000,
        payerAccountNumber: '123-456-789',
        payerAccountHolderName: '테스터',
        payerBankName: '국민은행',
        updateAccount: true,
      };

      await roomService.requestSettlement(
        testRoom.uuid,
        testUser.uuid,
        settlementDto,
      );

      // 방 완료
      await roomService.completeRoom(
        testRoom.uuid,
        testUser.uuid,
        UserType.student,
      );

      // 이미 참여한 사용자가 다시 참여 시도
      const result = await roomService.joinRoom(testRoom.uuid, otherUser.uuid);

      expect(result).toBeDefined();
      expect(result.sendMessage).toBe(false); // 이미 참여한 사용자이므로 메시지 전송 안함
      expect(result.room.uuid).toBe(testRoom.uuid);
    });
  });
});
