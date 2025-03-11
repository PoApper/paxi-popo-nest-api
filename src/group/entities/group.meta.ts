export enum GroupStatus {
  ACTIVATED = 'ACTIVE', // 모집 중 및 정산 완료 전까지
  DEACTIVATED = 'DEACTIVATED', // 모집 중단 또는 만료됨
  COMPLETED = 'COMPLETED', // 정산 완료
  DELETED = 'DELETED', // 방장이 삭제한 그룹
}
