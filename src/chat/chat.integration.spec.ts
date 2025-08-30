import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import configurations from 'src/config/configurations';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';
import { TestUtils } from 'src/test/test-utils';
import { UserType } from 'src/user/user.meta';
import { FcmService } from 'src/fcm/fcm.service';
import { RoomService } from 'src/room/room.service';
import { RoomModule } from 'src/room/room.module';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatModule } from './chat.module';
import { Chat } from './entities/chat.entity';
import { ChatMessageType } from './entities/chat.meta';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatSenderGuard } from './guards/chat-sender.guard';

describe('ChatModule - Integration Test', () => {
  let app: INestApplication;

  let chatController: ChatController;
  let chatService: ChatService;
  let userService: UserService;
  let roomService: RoomService;
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
        ChatModule,
        UserModule,
        RoomModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    chatController = moduleFixture.get<ChatController>(ChatController);
    chatService = moduleFixture.get<ChatService>(ChatService);
    userService = moduleFixture.get<UserService>(UserService);
    roomService = moduleFixture.get<RoomService>(RoomService);
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

    // JWT 토큰의 nickname 업데이트
    const nickname = await userService.getNickname(
      testUtils.getTestUser().uuid,
    );
    testUtils.getTestUserJwtToken().nickname = nickname?.nickname || '';

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
    expect(chatController).toBeDefined();
    expect(chatService).toBeDefined();
  });

  describe('create', () => {
    let testRoom: any;

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

    it('should create a chat message with user sender', async () => {
      const createDto = {
        message: '안녕하세요!',
      };

      const result = await chatController.create(
        testRoom.uuid,
        createDto,
        testUtils.getTestUserJwtToken(),
      );

      expect(result).toBeDefined();
      expect(result.message).toBe(createDto.message);
      expect(result.roomUuid).toBe(testRoom.uuid);
      expect(result.senderUuid).toBe(testUtils.getTestUser().uuid);
      expect(result.senderNickname).toBe('행복한_수소_1234');
      expect(result.messageType).toBe(ChatMessageType.TEXT);
      expect(result.isEdited).toBe(false);
      expect(result.uuid).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should create a system message without sender', async () => {
      const createChatDto: CreateChatDto = {
        roomUuid: testRoom.uuid,
        message: '시스템 메시지입니다',
        messageType: ChatMessageType.TEXT,
      };

      const result = await chatService.create(createChatDto);

      expect(result).toBeDefined();
      expect(result.message).toBe(createChatDto.message);
      expect(result.roomUuid).toBe(testRoom.uuid);
      expect(result.senderUuid).toBeNull();
      expect(result.senderNickname).toBeNull();
      expect(result.messageType).toBe(ChatMessageType.TEXT);
    });

    it('should create a chat message with custom nickname', async () => {
      const nickname = '서비스에_들어갈_닉네임';
      const createChatDto: CreateChatDto = {
        roomUuid: testRoom.uuid,
        senderUuid: testUtils.getTestUser().uuid,
        message: '커스텀 닉네임으로 보낸 메시지',
        messageType: ChatMessageType.TEXT,
      };

      const result = await chatService.create(createChatDto, nickname);

      expect(result).toBeDefined();
      expect(result.senderNickname).toBe(nickname);
    });
  });

  describe('findOne', () => {
    let testRoom: any;
    let testChat: Chat;

    beforeEach(async () => {
      testRoom = await roomService.create(testUtils.getTestUser().uuid, {
        description: '테스트 방입니다',
        title: '테스트 방',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '출발지',
        destinationLocation: '도착지',
        maxParticipant: 4,
      });

      testChat = await chatService.create(
        {
          roomUuid: testRoom.uuid,
          senderUuid: testUtils.getTestUser().uuid,
          message: '테스트 메시지',
          messageType: ChatMessageType.TEXT,
        },
        '테스트_닉네임',
      );
    });

    it('should find a chat message by UUID', async () => {
      const result = await chatService.findOne(testChat.uuid);

      expect(result).toBeDefined();
      expect(result.uuid).toBe(testChat.uuid);
      expect(result.message).toBe(testChat.message);
    });

    it('should throw NotFoundException when chat message does not exist', async () => {
      const nonExistentUuid = '123e4567-e89b-12d3-a456-426614174000';

      await expect(chatService.findOne(nonExistentUuid)).rejects.toThrow(
        '존재하지 않는 메세지입니다.',
      );
    });
  });

  describe('findByRoomUuid', () => {
    let testRoom: any;

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

    it('should find all chat messages in a room', async () => {
      const chat1 = await chatService.create(
        {
          roomUuid: testRoom.uuid,
          senderUuid: testUtils.getTestUser().uuid,
          message: '첫 번째 메시지',
          messageType: ChatMessageType.TEXT,
        },
        '테스트_닉네임',
      );

      const chat2 = await chatService.create(
        {
          roomUuid: testRoom.uuid,
          senderUuid: testUtils.getTestUser().uuid,
          message: '두 번째 메시지',
          messageType: ChatMessageType.TEXT,
        },
        '테스트_닉네임',
      );

      const result = await chatService.findByRoomUuid(testRoom.uuid);

      expect(result).toHaveLength(2);
      expect(result.map((chat) => chat.uuid)).toContain(chat1.uuid);
      expect(result.map((chat) => chat.uuid)).toContain(chat2.uuid);
    });

    it('should return empty array when room has no messages', async () => {
      const result = await chatService.findByRoomUuid(testRoom.uuid);

      expect(result).toHaveLength(0);
    });
  });

  describe('getMessagesByCursor', () => {
    let testRoom: any;
    let testChats: Chat[];

    beforeEach(async () => {
      testRoom = await roomService.create(testUtils.getTestUser().uuid, {
        description: '테스트 방입니다',
        title: '테스트 방',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '출발지',
        destinationLocation: '도착지',
        maxParticipant: 4,
      });

      // 여러 메시지 생성
      testChats = [];
      for (let i = 1; i <= 10; i++) {
        const chat = await chatService.create(
          {
            roomUuid: testRoom.uuid,
            senderUuid: testUtils.getTestUser().uuid,
            message: `메시지 ${i}`,
            messageType: ChatMessageType.TEXT,
          },
          '테스트_닉네임',
        );
        testChats.push(chat);
      }
    });

    it('should get messages without before parameter (latest messages)', async () => {
      const before = null;
      const take = 5;
      const result = await chatController.getMessages(
        testRoom.uuid,
        before,
        take,
        testUtils.getTestUserJwtToken(),
      );

      expect(result).toHaveLength(take);
      // 최신 메시지부터 가져와야 함 (ID 내림차순)
      expect(result[0].id).toBeGreaterThan(result[1].id);
    });

    it('should get messages with before parameter', async () => {
      const middleChat = testChats[5];
      const result = await chatController.getMessages(
        testRoom.uuid,
        middleChat.uuid,
        3,
        testUtils.getTestUserJwtToken(),
      );

      expect(result).toHaveLength(3);
      // before 메시지보다 이전 메시지들만 가져와야 함
      expect(result.every((chat) => chat.id < middleChat.id)).toBe(true);
    });

    it('should return empty array when before message does not exist', async () => {
      const nonExistentUuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = await chatController.getMessages(
        testRoom.uuid,
        nonExistentUuid,
        5,
        testUtils.getTestUserJwtToken(),
      );

      expect(result).toHaveLength(0);
    });

    it('should throw NotFoundException when room does not exist', async () => {
      const nonExistentRoomUuid = '123e4567-e89b-12d3-a456-426614174000';

      await expect(
        chatController.getMessages(
          nonExistentRoomUuid,
          null,
          5,
          testUtils.getTestUserJwtToken(),
        ),
      ).rejects.toThrow('방이 존재하지 않습니다.');
    });

    it('should throw ForbiddenException when user is not the room owner', async () => {
      const anotherUserJwtToken: JwtPayload = {
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@test.com',
        name: 'test',
        nickname: 'test',
        userType: UserType.student,
      };

      await expect(
        chatController.getMessages(testRoom.uuid, null, 5, anotherUserJwtToken),
      ).rejects.toThrow(
        '채팅을 볼 권한이 없습니다. 관리자 혹은 방에 속한 유저만 가능합니다.',
      );
    });

    it('should use default take value when not provided', async () => {
      const result = await chatController.getMessages(
        testRoom.uuid,
        null,
        30,
        testUtils.getTestUserJwtToken(),
      );

      expect(result).toHaveLength(10); // 실제 생성된 메시지 개수
    });

    it('should return empty array when room has no messages', async () => {
      const emptyRoom = await roomService.create(testUtils.getTestUser().uuid, {
        description: '빈 방',
        title: '빈 방',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '출발지',
        destinationLocation: '도착지',
        maxParticipant: 4,
      });

      const result = await chatController.getMessages(
        emptyRoom.uuid,
        null,
        5,
        testUtils.getTestUserJwtToken(),
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('updateMessage', () => {
    let testRoom: any;
    let testChat: Chat;

    beforeEach(async () => {
      testRoom = await roomService.create(testUtils.getTestUser().uuid, {
        description: '테스트 방입니다',
        title: '테스트 방',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '출발지',
        destinationLocation: '도착지',
        maxParticipant: 4,
      });

      testChat = await chatService.create(
        {
          roomUuid: testRoom.uuid,
          senderUuid: testUtils.getTestUser().uuid,
          message: '원본 메시지',
          messageType: ChatMessageType.TEXT,
        },
        '테스트_닉네임',
      );
    });

    it('should update a chat message', async () => {
      const updateDto = {
        message: '수정된 메시지',
      };

      const result = await chatService.updateMessage(testChat.uuid, updateDto);

      expect(result).toBeDefined();
      if (!result) {
        throw new Error('Update failed');
      }
      expect(result.message).toBe(updateDto.message);
      expect(result.isEdited).toBe(true);
      expect(result.uuid).toBe(testChat.uuid);
    });

    it('should throw NotFoundException when chat message does not exist', async () => {
      const nonExistentUuid = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto = {
        message: '수정된 메시지',
      };

      await expect(
        chatService.updateMessage(nonExistentUuid, updateDto),
      ).rejects.toThrow('메세지를 찾을 수 없습니다.');
    });

    it('should update message through controller', async () => {
      const updateDto = {
        message: '컨트롤러를 통한 수정',
      };

      const result = await chatController.updateMessage(
        testChat.uuid,
        updateDto,
      );

      expect(result).toBeDefined();
      if (!result) {
        throw new Error('Update failed');
      }
      expect(result.message).toBe(updateDto.message);
      expect(result.isEdited).toBe(true);
    });

    it('should throw NotFoundException when chat message does not exist in controller', async () => {
      const nonExistentUuid = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto = {
        message: '수정된 메시지',
      };

      await expect(
        chatController.updateMessage(nonExistentUuid, updateDto),
      ).rejects.toThrow('메세지를 찾을 수 없습니다.');
    });
  });

  describe('deleteMessage', () => {
    let testRoom: any;
    let testChat: Chat;

    beforeEach(async () => {
      testRoom = await roomService.create(testUtils.getTestUser().uuid, {
        description: '테스트 방입니다',
        title: '테스트 방',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '출발지',
        destinationLocation: '도착지',
        maxParticipant: 4,
      });

      testChat = await chatService.create(
        {
          roomUuid: testRoom.uuid,
          senderUuid: testUtils.getTestUser().uuid,
          message: '삭제할 메시지',
          messageType: ChatMessageType.TEXT,
        },
        '테스트_닉네임',
      );
    });

    it('should delete a chat message', async () => {
      const result = await chatService.deleteMessage(testChat.uuid);

      expect(result).toBeDefined();
      expect(result.roomUuid).toBe(testRoom.uuid);
      expect(result.deletedChatUuid).toBe(testChat.uuid);

      // 메시지가 실제로 삭제되었는지 확인
      await expect(chatService.findOne(testChat.uuid)).rejects.toThrow(
        '존재하지 않는 메세지입니다.',
      );
    });

    it('should throw NotFoundException when chat message does not exist', async () => {
      const nonExistentUuid = '123e4567-e89b-12d3-a456-426614174000';

      await expect(chatService.deleteMessage(nonExistentUuid)).rejects.toThrow(
        '메세지를 찾을 수 없습니다.',
      );
    });

    it('should delete message through controller', async () => {
      const result = await chatController.deleteMessage(testChat.uuid);

      expect(result).toBe(testChat.uuid);

      // 메시지가 실제로 삭제되었는지 확인
      await expect(chatService.findOne(testChat.uuid)).rejects.toThrow(
        '존재하지 않는 메세지입니다.',
      );
    });
  });

  describe('getLastMessageOfRoom', () => {
    let testRoom: any;

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

    it('should get the last message of a room', async () => {
      await chatService.create(
        {
          roomUuid: testRoom.uuid,
          senderUuid: testUtils.getTestUser().uuid,
          message: '첫 번째 메시지',
          messageType: ChatMessageType.TEXT,
        },
        '테스트_닉네임',
      );

      const chat2 = await chatService.create(
        {
          roomUuid: testRoom.uuid,
          senderUuid: testUtils.getTestUser().uuid,
          message: '두 번째 메시지',
          messageType: ChatMessageType.TEXT,
        },
        '테스트_닉네임',
      );

      const result = await chatService.getLastMessageOfRoom(testRoom.uuid);

      expect(result).toBeDefined();
      if (!result) {
        throw new Error('Last message not found');
      }
      expect(result.uuid).toBe(chat2.uuid); // 가장 최근 메시지
    });

    it('should return null when room has no messages', async () => {
      const result = await chatService.getLastMessageOfRoom(testRoom.uuid);

      expect(result).toBeNull();
    });
  });

  describe('deleteAll', () => {
    let testRoom1: any;
    let testRoom2: any;
    let testChat1: Chat;
    let testChat2: Chat;

    beforeEach(async () => {
      testRoom1 = await roomService.create(testUtils.getTestUser().uuid, {
        description: '테스트 방 1',
        title: '테스트 방 1',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '출발지',
        destinationLocation: '도착지',
        maxParticipant: 4,
      });

      testRoom2 = await roomService.create(testUtils.getTestUser().uuid, {
        description: '테스트 방 2',
        title: '테스트 방 2',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '출발지',
        destinationLocation: '도착지',
        maxParticipant: 4,
      });

      // 각 방에 메시지 생성
      testChat1 = await chatService.create(
        {
          roomUuid: testRoom1.uuid,
          senderUuid: testUtils.getTestUser().uuid,
          message: '방 1 메시지 1',
          messageType: ChatMessageType.TEXT,
        },
        '테스트_닉네임',
      );

      await chatService.create(
        {
          roomUuid: testRoom1.uuid,
          senderUuid: testUtils.getTestUser().uuid,
          message: '방 1 메시지 2',
          messageType: ChatMessageType.TEXT,
        },
        '테스트_닉네임',
      );

      testChat2 = await chatService.create(
        {
          roomUuid: testRoom2.uuid,
          senderUuid: testUtils.getTestUser().uuid,
          message: '방 2 메시지',
          messageType: ChatMessageType.TEXT,
        },
        '테스트_닉네임',
      );
    });

    it('should delete a specific chat message', async () => {
      await chatService.deleteAll(testChat1.uuid);

      // 특정 메시지가 삭제되었는지 확인
      await expect(chatService.findOne(testChat1.uuid)).rejects.toThrow(
        '존재하지 않는 메세지입니다.',
      );

      // 다른 메시지는 그대로 남아있어야 함
      const room1Messages = await chatService.findByRoomUuid(testRoom1.uuid);
      expect(room1Messages).toHaveLength(1); // 하나만 삭제됨

      const room2Messages = await chatService.findByRoomUuid(testRoom2.uuid);
      expect(room2Messages).toHaveLength(1); // 그대로 남아있음

      await chatService.deleteAll(testChat2.uuid);

      const room2MessagesAfterDeletion = await chatService.findByRoomUuid(
        testRoom2.uuid,
      );
      expect(room2MessagesAfterDeletion).toHaveLength(0);
    });

    it('should delete all messages when no chatUuid is provided', async () => {
      await chatService.deleteAll();

      // 모든 메시지가 삭제되었는지 확인
      const room1Messages = await chatService.findByRoomUuid(testRoom1.uuid);
      const room2Messages = await chatService.findByRoomUuid(testRoom2.uuid);
      expect(room1Messages).toHaveLength(0);
      expect(room2Messages).toHaveLength(0);
    });

    it('should throw error when chat message does not exist', async () => {
      const nonExistentChatUuid = '123e4567-e89b-12d3-a456-426614174000';

      await expect(chatService.deleteAll(nonExistentChatUuid)).rejects.toThrow(
        '존재하지 않는 메세지입니다.',
      );
    });
  });

  describe('ChatSenderGuard - HTTP Request Mocking', () => {
    let testRoom: any;
    let testChat: Chat;
    let anotherUser: any;
    let anotherUserJwtToken: any;

    beforeEach(async () => {
      testRoom = await roomService.create(testUtils.getTestUser().uuid, {
        description: '테스트 방입니다',
        title: '테스트 방',
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        departureLocation: '출발지',
        destinationLocation: '도착지',
        maxParticipant: 4,
      });

      testChat = await chatService.create(
        {
          roomUuid: testRoom.uuid,
          senderUuid: testUtils.getTestUser().uuid,
          message: '테스트 메시지',
          messageType: ChatMessageType.TEXT,
        },
        '테스트_닉네임',
      );

      // 다른 유저 생성
      anotherUser = await userService.save({
        email: 'another@test.com',
        password: 'password123',
        name: 'Another User',
        userType: UserType.student,
      });

      await userService.createNickname(anotherUser.uuid, '다른_유저_1234');

      // 다른 유저의 JWT 토큰 생성
      const nickname = await userService.getNickname(anotherUser.uuid);
      anotherUserJwtToken = {
        uuid: anotherUser.uuid,
        email: anotherUser.email,
        name: anotherUser.name,
        nickname: nickname?.nickname || '',
        userType: UserType.student,
      };
    });

    it('should test ChatSenderGuard with HTTP request mocking', async () => {
      // HTTP 요청을 모킹하여 실제 Guard 테스트
      const mockRequest = {
        user: anotherUserJwtToken, // 다른 유저의 JWT 토큰
        params: { chatUuid: testChat.uuid },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      };

      // ChatSenderGuard 인스턴스 생성
      const chatSenderGuard = new ChatSenderGuard(chatService);

      // 다른 유저로 메시지 수정 시도 시 ForbiddenException 발생
      await expect(
        chatSenderGuard.canActivate(mockContext as any),
      ).rejects.toThrow('메세지 전송자가 아닙니다.');
    });

    it('should allow message sender to pass ChatSenderGuard', async () => {
      // 메시지 발신자의 JWT 토큰
      const senderRequest = {
        user: testUtils.getTestUserJwtToken(),
        params: { chatUuid: testChat.uuid },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => senderRequest,
        }),
      };

      // ChatSenderGuard 인스턴스 생성
      const chatSenderGuard = new ChatSenderGuard(chatService);

      // 메시지 발신자는 통과해야 함
      const result = await chatSenderGuard.canActivate(mockContext as any);
      expect(result).toBe(true);
    });
  });
});
