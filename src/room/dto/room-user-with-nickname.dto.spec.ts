import { RoomUserWithNicknameDto, RoomWithUsersDto } from './room-user-with-nickname.dto';
import { RoomUserStatus } from 'src/room/entities/room-user.meta';
import { RoomStatus } from 'src/room/entities/room.meta';
import { RoomUser } from 'src/room/entities/room-user.entity';
import { Room } from 'src/room/entities/room.entity';

describe('RoomUserWithNicknameDto', () => {
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
    const dto = new RoomUserWithNicknameDto(baseRoomUser);

    expect(dto.userUuid).toBe(baseRoomUser.userUuid);
    expect(dto.roomUuid).toBe(baseRoomUser.roomUuid);
    expect(dto.status).toBe(baseRoomUser.status);
    expect(dto.isPaid).toBe(baseRoomUser.isPaid);
    expect(dto.lastReadChatUuid).toBe(baseRoomUser.lastReadChatUuid);
    expect(dto.isMuted).toBe(baseRoomUser.isMuted);
    expect(dto.nickname).toBe(baseRoomUser.user.nickname.nickname);
  });

  it('should omit kickedReason field', () => {
    const dto = new RoomUserWithNicknameDto(baseRoomUser);
    // @ts-expect-error - kickedReason should not exist on DTO shape
    expect(dto.kickedReason).toBeUndefined();
  });
});

describe('RoomWithUsersDto', () => {
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
    roomUsers: roomUsers,
  } as unknown as Room;

  it('should map room fields and replace roomUsers with RoomUserWithNicknameDto[]', () => {
    const payerAccountNumber = '123-456-7890';
    const dto = new RoomWithUsersDto(baseRoom, payerAccountNumber);

    expect(dto.uuid).toBe(baseRoom.uuid);
    expect(dto.title).toBe(baseRoom.title);
    expect(dto.payerAccountNumber).toBe(payerAccountNumber);

    // original roomUsers removed from plain mapping, and replaced by DTO mapped list
    expect(Array.isArray(dto.roomUsers)).toBe(true);
    expect(dto.roomUsers).toHaveLength(2);
    expect(dto.roomUsers[0].nickname).toBe(roomUsers[0].user.nickname.nickname);
    expect(dto.roomUsers[1].nickname).toBe(roomUsers[1].user.nickname.nickname);
  });

  it('should exclude departureAlertSent and payerEncryptedAccountNumber from DTO', () => {
    const payerAccountNumber = '123-456-7890';
    const dto = new RoomWithUsersDto(baseRoom, payerAccountNumber);
    // @ts-expect-error - should not exist on DTO
    expect(dto.departureAlertSent).toBeUndefined();
    // @ts-expect-error - should not exist on DTO
    expect(dto.payerEncryptedAccountNumber).toBeUndefined();
  });

  it('should handle room with one roomUser', () => {
    const minimalRoom = { ...baseRoom, roomUsers: [roomUsers[0]] } as unknown as Room;
    const dto = new RoomWithUsersDto(minimalRoom);
    expect(Array.isArray(dto.roomUsers)).toBe(true);
    expect(dto.roomUsers).toHaveLength(1);
    expect(dto.roomUsers[0].nickname).toBe(roomUsers[0].user.nickname.nickname);
  });
});


