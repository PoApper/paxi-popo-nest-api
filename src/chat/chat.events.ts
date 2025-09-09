export const enum ChatEvent {
  // 메시지 관련 이벤트
  NEW_MESSAGE = 'newMessage',
  UPDATED_MESSAGE = 'updatedMessage',
  DELETED_MESSAGE = 'deletedMessage',

  // 정산 관련 이벤트
  NEW_SETTLEMENT = 'newSettlement',
  UPDATED_SETTLEMENT = 'updatedSettlement',
  DELETED_SETTLEMENT = 'deletedSettlement',

  // 방 관련 이벤트
  UPDATED_ROOM = 'updatedRoom',
  UPDATED_IS_PAID = 'updatedIsPaid',

  // 유저 강퇴 관련 이벤트
  USER_KICKED = 'userKicked',

  // 에러 이벤트
  ERROR = 'error',
}
