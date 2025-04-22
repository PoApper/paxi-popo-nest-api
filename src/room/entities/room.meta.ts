export enum RoomStatus {
  ACTIVATED = 'ACTIVE', // 모집 중 및 정산 신청 전까지
  IN_SETTLEMENT = 'IN_SETTLEMENT', // 정산 신청 후 정산 중
  COMPLETED = 'COMPLETED', // 정산 완료
  DEACTIVATED = 'DEACTIVATED', // 모집 중단 또는 만료됨
  DELETED = 'DELETED', // 방장이 삭제한 방
}
