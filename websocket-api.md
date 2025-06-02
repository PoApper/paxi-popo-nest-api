# WebSocket API Documentation

## 연결 정보
- local server URL: `ws://localhost:4100`
- dev server URL: `wss://api.paxi-dev.popo.poapper.club?Authentication=[토큰값]`
- 인증: Cookie에 'Authentication' 토큰 필요
  - 토큰이 없거나 유효하지 않은 경우 연결이 거부됨
  - React Native에서 웹소켓 연결 시 쿠키를 보내지 못한므로 `Authentication` 토큰 값을 쿼리 파라미터에 실어 보냄
- 연결 시 유저의 정보를 저장함
  - JWT Payload 정보가 담긴 정보
  - 유저가 마지막으로 포커싱했던 방 정보 트래킹

## 연결 해제
  - 프론트에서 신경 쓸 필요 없이 자동으로 처리됨
  - 연결 해제 시:
    - 유저의 소켓 데이터를 삭제해 실시간 채팅 기능 중단
    - 유저 정보 및 유저가 마지막으로 포커싱했던 방 정보(메세지 읽음 처리를 위해 관리 필요) 삭제
    - 마지막으로 연결되었던 방의 채팅 메세지 읽음 처리

## 에러 처리
- 모든 에러는 `WsException`으로 처리됨
- 에러 메시지는 한글로 제공됨
- 주요 에러 케이스:
  - 인증 토큰 없음/유효하지 않음
  - 방에 속하지 않은 유저
  - 메시지 전송 실패
  - 방 참여/나가기 실패

## 프론트에서 Listening 해야 할 이벤트

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

### 4. 정산 요청
- `newSettlement`를 통해 **정산 요청 정보가 담긴 메세지**를 받을 수 있음
- `POST /:uuid/settlement` 엔드포인트에서 사용됨
- 정산 요청 공지를 위해 사용
- 응답 메세지 예시:
```json
{
  "roomUuid": "45281c1e-61e5-4628-8821-6e0cb0940fd3",
  "payerUuid": "12e18adf-9a25-42e7-b0b9-88d222542c5e",
  "payerNickname": "포닉스",
  "payerAccountNumber": "1234-5678-9012-3456",
  "payerAccountHolderName": "포닉스",
  "payerBankName": "국민은행",
  "payAmount": 10000,
  "currentParticipant": 3,
  "payAmountPerPerson": 3334 // 정산자 제외 참여자가 내야할 금액(=ceil(payAmount / currentParticipant))
}
```

### 5. 정산 정보 수정
- `updatedSettlement`를 통해 **수정된 정산 정보가 담긴 메세지**를 받을 수 있음
- `PUT /:uuid/settlement` 엔드포인트에서 사용됨
- 정산 정보 수정 공지를 위해 사용
- 응답 메세지 예시:
```json
{
  "roomUuid": "45281c1e-61e5-4628-8821-6e0cb0940fd3",
  "payerUuid": "12e18adf-9a25-42e7-b0b9-88d222542c5e",
  "payerNickname": "포닉스",
  "payerAccountNumber": "1234-5678-9012-3456",
  "payerAccountHolderName": "포닉스",
  "payerBankName": "국민은행",
  "payAmount": 15000,
  "currentParticipant": 3,
  "payAmountPerPerson": 5000
}
```

### 6. 정산 취소
- `deletedSettlement`를 통해 **정산이 취소된 방의 UUID**를 받을 수 있음
- `DELETE /:uuid/settlement` 엔드포인트에서 사용됨
- 정산 취소 공지를 위해 사용
- 응답 메세지 예시:
```json
{
  "roomUuid": "45281c1e-61e5-4628-8821-6e0cb0940fd3",
}
```
