# WebSocket API Documentation

## 연결 정보
- URL: `ws://localhost:4001`
- 인증: Cookie에 'Authentication' 토큰 필요
  - 토큰이 없거나 유효하지 않은 경우 연결이 거부됨
  - **React Native에서 Websocket 연결 시 쿠키를 사용할 수 없다면 다른 인증 방법을 사용해야 함 (TODO)**

## 이벤트

### 1. 연결 (Connection)
- 자동으로 처리됨
- 연결 시 인증 토큰 검증
- 연결 성공 시:
  - `client.data.user`: JWT 페이로드 정보 저장
  - `client.data.groups`: 참여 중인 그룹 UUID Set 초기화

### 2. 연결 해제 (Disconnection)
- 자동으로 처리됨
- 연결 해제 시:
  - `client.data.user` 삭제
  - `client.data.groups` 삭제

### 3. 그룹 채팅방 참여
- 이벤트명: `joinGroup`
- 요청 데이터:
```json
{
  "groupUuid": "string"  // 참여할 그룹의 UUID
}
```
- 응답: `newMessage` 이벤트로 시스템 메시지 수신
- 동작:
  1. 그룹 참여 유저 확인
  2. 첫 입장 시에만:
     - 소켓 그룹 참여
     - 시스템 메시지 전송 ("[유저명] 님이 그룹에 참여했습니다.")
  3. 이미 참여한 경우:
     - 메시지 읽음 처리 (TODO)

### 4. 메시지 전송
- 이벤트명: `sendMessage`
- 요청 데이터:
```json
{
  "groupUuid": "string",  // 메시지를 전송할 그룹의 UUID
  "message": "string"     // 전송할 메시지 내용
}
```
- 응답: `newMessage` 이벤트로 전송된 메시지 수신
- 동작:
  1. 그룹 참여 유저 확인
  2. 메시지 저장
  3. 본인과 다른 그룹 유저들에게 메시지 전송

### 5. 그룹 채팅방 나가기
- 이벤트명: `leaveGroup`
- 요청 데이터: `string` (groupUuid)
- 응답: `newMessage` 이벤트로 시스템 메시지 수신
- 동작:
  1. 그룹 참여 유저 확인
  2. 소켓 그룹에서 제거
  3. 시스템 메시지 전송 ("[유저명] 님이 그룹에서 나갔습니다.")

## 에러 처리
- 모든 에러는 `WsException`으로 처리됨
- 에러 메시지는 한글로 제공됨
- 주요 에러 케이스:
  - 인증 토큰 없음/유효하지 않음
  - 그룹에 속하지 않은 유저
  - 메시지 전송 실패
  - 그룹 참여/나가기 실패

## TODO
1. 채팅 메시지 수정 기능
2. 채팅 메시지 삭제 기능
3. 소켓이 끊어지고 다시 연결될 때 소켓 복원 기능
4. 채팅방 메시지 불러오기 기능
5. 메시지 읽음 처리 기능
