import { RoomUserStatus } from 'src/room/entities/room-user.meta';
import { RoomStatus } from 'src/room/entities/room.meta';
import { RoomUser } from 'src/room/entities/room-user.entity';
import { Room } from 'src/room/entities/room.entity';

import { RoomParticipantDto } from './room-participant.dto';
import { MyRoomUserDto } from './my-room-user.dto';
import { ResponseRoomDto } from './response-room.dto';

describe('RoomParticipantDto', () => {
  const baseRoomUser = {
    userUuid: 'user-uuid-1',
    roomUuid: 'room-uuid-1',
    status: RoomUserStatus.JOINED,
    isPaid: false,
    kickedReason: 'some reason',
    lastReadChatUuid: 'chat-uuid-1',
    isMuted: false,
    user: {
      uuid: 'user-uuid-1',
      nickname: { nickname: '포닉스' },
    },
  } as unknown as RoomUser;

  it('should map basic fields and set nickname from user.nickname.nickname', () => {
    const dto = new RoomParticipantDto(baseRoomUser);

    expect(dto.userUuid).toBe(baseRoomUser.userUuid);
    expect(dto.roomUuid).toBe(baseRoomUser.roomUuid);
    expect(dto.status).toBe(baseRoomUser.status);
    expect(dto.isPaid).toBe(baseRoomUser.isPaid);
    expect(dto.lastReadChatUuid).toBe(baseRoomUser.lastReadChatUuid);
    expect(dto.isMuted).toBe(baseRoomUser.isMuted);
    expect(dto.nickname).toBe(baseRoomUser.user.nickname.nickname);
  });

  it('should handle missing user nickname gracefully', () => {
    const roomUserNoNickname = {
      ...baseRoomUser,
      user: null,
    } as unknown as RoomUser;
    const dto = new RoomParticipantDto(roomUserNoNickname);
    expect(dto.nickname).toBe('');
  });
});

describe('MyRoomUserDto', () => {
  const baseRoomUser = {
    status: RoomUserStatus.JOINED,
    isPaid: false,
    isMuted: true,
    lastReadChatUuid: 'chat-uuid-1',
    kickedReason: null,
  } as unknown as RoomUser;

  it('should map RoomUser fields and hasNewMessage', () => {
    const dto = new MyRoomUserDto(baseRoomUser, true);

    expect(dto.status).toBe(RoomUserStatus.JOINED);
    expect(dto.isPaid).toBe(false);
    expect(dto.isMuted).toBe(true);
    expect(dto.lastReadChatUuid).toBe('chat-uuid-1');
    expect(dto.kickedReason).toBeNull();
    expect(dto.hasNewMessage).toBe(true);
  });

  it('should set hasNewMessage to false', () => {
    const dto = new MyRoomUserDto(baseRoomUser, false);
    expect(dto.hasNewMessage).toBe(false);
  });
});

describe('ResponseRoomDto', () => {
  const roomUsers: RoomUser[] = [
    {
      userUuid: 'user-uuid-1',
      roomUuid: 'room-uuid-1',
      status: RoomUserStatus.JOINED,
      isPaid: false,
      kickedReason: null,
      lastReadChatUuid: 'chat-uuid-1',
      isMuted: false,
      user: {
        uuid: 'user-uuid-1',
        nickname: { nickname: '유저1' },
      },
    } as unknown as RoomUser,
    {
      userUuid: 'user-uuid-2',
      roomUuid: 'room-uuid-1',
      status: RoomUserStatus.JOINED,
      isPaid: true,
      kickedReason: null,
      lastReadChatUuid: 'chat-uuid-2',
      isMuted: true,
      user: {
        uuid: 'user-uuid-2',
        nickname: { nickname: '유저2' },
      },
    } as unknown as RoomUser,
  ];

  const baseRoom = {
    uuid: 'room-uuid-1',
    title: '테스트 방',
    ownerUuid: 'owner-uuid',
    departureLocation: '출발지',
    destinationLocation: '도착지',
    maxParticipant: 4,
    currentParticipant: 2,
    departureTime: new Date(),
    status: RoomStatus.ACTIVATED,
    description: '설명',
    payerUuid: null,
    payAmount: null,
    payerEncryptedAccountNumber: 'encrypted-account',
    payerAccountHolderName: null,
    payerBankName: null,
    departureAlertSent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    roomUsers: roomUsers,
  } as unknown as Room;

  it('should map room fields and include roomUsers when includeRoomUsers is true', () => {
    const payerAccountNumber = '123-456-7890';
    const dto = new ResponseRoomDto(baseRoom, {
      payerAccountNumber,
      includeRoomUsers: true,
    });

    expect(dto.uuid).toBe(baseRoom.uuid);
    expect(dto.title).toBe(baseRoom.title);
    expect(dto.payerAccountNumber).toBe(payerAccountNumber);

    expect(Array.isArray(dto.roomUsers)).toBe(true);
    expect(dto.roomUsers).toHaveLength(2);
    expect(dto.roomUsers![0].nickname).toBe(
      roomUsers[0].user.nickname.nickname,
    );
    expect(dto.roomUsers![1].nickname).toBe(
      roomUsers[1].user.nickname.nickname,
    );
  });

  it('should exclude departureAlertSent and payerEncryptedAccountNumber', () => {
    const dto = new ResponseRoomDto(baseRoom, { includeRoomUsers: true });
    // @ts-expect-error - should not exist on DTO
    expect(dto.departureAlertSent).toBeUndefined();
    // @ts-expect-error - should not exist on DTO
    expect(dto.payerEncryptedAccountNumber).toBeUndefined();
  });

  it('should not include roomUsers when includeRoomUsers is not set', () => {
    const dto = new ResponseRoomDto(baseRoom);
    expect(dto.roomUsers).toBeUndefined();
  });

  it('should include myRoomUser when provided', () => {
    const myRoomUser = new MyRoomUserDto(roomUsers[0], true);
    const dto = new ResponseRoomDto(baseRoom, { myRoomUser });

    expect(dto.myRoomUser).toBeDefined();
    expect(dto.myRoomUser!.status).toBe(RoomUserStatus.JOINED);
    expect(dto.myRoomUser!.hasNewMessage).toBe(true);
  });

  it('should set deprecated fields for backward compatibility when myRoomUser is provided', () => {
    const myRoomUser = new MyRoomUserDto(roomUsers[0], true);
    const dto = new ResponseRoomDto(baseRoom, { myRoomUser });

    expect(dto.hasNewMessage).toBe(true);
    expect(dto.kickedReason).toBeNull();
    expect(dto.userStatus).toBe(RoomUserStatus.JOINED);
  });

  it('should handle room with one roomUser', () => {
    const minimalRoom = {
      ...baseRoom,
      roomUsers: [roomUsers[0]],
    } as unknown as Room;
    const dto = new ResponseRoomDto(minimalRoom, { includeRoomUsers: true });
    expect(Array.isArray(dto.roomUsers)).toBe(true);
    expect(dto.roomUsers).toHaveLength(1);
    expect(dto.roomUsers![0].nickname).toBe(
      roomUsers[0].user.nickname.nickname,
    );
  });
});
