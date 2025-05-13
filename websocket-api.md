# WebSocket API Documentation

## 연결 정보
- local server URL: `ws://localhost:4100`
- dev server URL: `wss://api.paxi-dev.popo.poapper.club?Authentication=[토큰값]`
- 인증: Cookie에 'Authentication' 토큰 필요
  - 토큰이 없거나 유효하지 않은 경우 연결이 거부됨
  - React Native에서 웹소켓 연결 시 쿠키를 보내지 못한므로 `Authentication` 토큰 값을 쿼리 파라미터에 실어 보냄

## Listening 이벤트

### 1. 메세지 받기
- `newMessage`를 통해 채팅 혹은 공지 등 새로운 메세지를 받을 수 있음
  - 유저의 방 입장, 퇴장, 강퇴, 정산 요청, 정산 완료 등 방의 상태 변경 시 시스템 메세지를 받을 수 있음
- `SenderUuid: null`인 경우는 시스템 메세지이므로 프론트에서 따로 처리 필요
- 메시지 예시:
```json
{
  "uuid": "12e18adf-9a25-42e7-b0b9-88d222542c5e",
  "roomUuid": "45281c1e-61e5-4628-8821-6e0cb0940fd3",
  "senderUuid": null, // 시스템 메세지
  "message": "나태양 님이 방에 참여했습니다.",
  "messageType": "TEXT",
  "createdAt": "2025-05-10T11:27:41.045Z",
  "updatedAt": "2025-05-10T11:27:41.045Z"
}
```

### 2. 메세지 수정
- `updatedMessage`를 통해 수정된 메세지를 받을 수 있음
- `PUT /chat/:chatUuid` 엔드포인트에서 사용됨
- 현재 채팅방에 있는 유저(=소켓에 연결되어 있는 유저)들의 채팅 메세지를 실시간으로 수정하기 위해 사용
- 응답 메세지 예시:
```json
{
  "uuid": "12e18adf-9a25-42e7-b0b9-88d222542c5e",
  "roomUuid": "45281c1e-61e5-4628-8821-6e0cb0940fd3",
  "senderUuid": "12e18adf-9a25-42e7-b0b9-88d222542c5e", // 유저 메세지
  "message": "수정된 메세지.",
  "messageType": "TEXT",
  "createdAt": "2025-05-10T11:27:41.045Z",
  "updatedAt": "2025-05-10T11:27:41.045Z"
}
```

### 3. 메세지 삭제
- `deletedMessage`를 통해 **삭제된 메세지의 UUID**를 받을 수 있음
- `DELETE /chat/:chatUuid` 엔드포인트에서 사용됨
- 현재 채팅방에 있는 유저(=소켓에 연결되어 있는 유저)들의 채팅 메세지를 실시간으로 삭제하기 위해 사용
- 응답 메세지 예시:
```json
{
  "uuid": "12e18adf-9a25-42e7-b0b9-88d222542c5e"
}
```

## 이벤트 발생

### 1. 연결 해제 (Disconnection)
- 자동으로 처리됨
- 연결 해제 시:
  - 유저의 소켓 데이터를 삭제해 실시간 채팅 기능 중단
  - JWT Payload 정보가 담긴 `client.data.user` 삭제

### **NOTE: 아래 채팅방 참여, 메세지 전송, 방 나가기 이벤트들은 웹소켓을 컨트롤러에 병합하는 작업이 완료되면 사라질 예정**

### 2. *채팅방 참여(삭제 예정)*
- 이벤트명: `joinRoom`
- 요청 데이터:
```json
{
  "roomUuid": "string"  // 참여할 방의 UUID
}
```
- 응답: `newMessage` 이벤트로 시스템 메시지 수신
- 동작:
  1. 방 참여 유저인지 확인
  2. 첫 입장 시에만:
     - 소켓 방 참여
     - 시스템 메시지 전송 ("[유저명] 님이 방에 참여했습니다.")
  3. 이미 참여한 경우:
     - 메시지 읽음 처리 (TODO)
- **주의:** 방에 실제로 참여하는 것은 아니므로 */room/join/:uuid* 도 함께 호출해야 함

### 3. *메시지 전송(삭제 예정)*
- 이벤트명: `sendMessage`
- 요청 데이터:
```json
{
  "roomUuid": "string",  // 메시지를 전송할 방의 UUID
  "message": "string"     // 전송할 메시지 내용
}
```
- 응답: `newMessage` 이벤트로 전송된 메시지 수신
- 동작:
  1. 방 참여 유저인지 확인
  2. 메시지 저장
  3. 본인과 다른 방 유저들에게 메시지 전송

### 4. *방 나가기(삭제 예정)*
- 이벤트명: `leaveRoom`
- 요청 데이터: `string` (roomUuid)
- 응답: `newMessage` 이벤트로 시스템 메시지 수신
- 동작:
  1. 방 참여 유저인지 확인
  2. 시스템 메시지 전송 ("[유저명] 님이 방에서 나갔습니다.")
- **주의:** 실제 방을 나가게 하지는 않으므로 */room/leave/:uuid* 도 함께 호출해야 함

## 에러 처리
- 모든 에러는 `WsException`으로 처리됨
- 에러 메시지는 한글로 제공됨
- 주요 에러 케이스:
  - 인증 토큰 없음/유효하지 않음
  - 방에 속하지 않은 유저
  - 메시지 전송 실패
  - 방 참여/나가기 실패

## TODO
- ~~소켓이 끊어지고 다시 연결될 때 소켓 복원 기능~~ 필요하지 않음
- 메시지 읽음 처리 기능
