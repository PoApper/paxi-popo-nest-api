export enum RoomUserStatus {
  PENDING = 'PENDING', // 가입 요청 중(현재는 안씀)
  JOINED = 'JOINED', // 가입 완료
  KICKED = 'KICKED', // 강퇴됨
  LEFT = 'LEFT', // 탈퇴함
}
