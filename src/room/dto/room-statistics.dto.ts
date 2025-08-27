import { ApiProperty } from '@nestjs/swagger';

export class RoomStatisticsDto {
  @ApiProperty({
    description: '전체 방 생성 수',
    example: 155,
  })
  totalRoomsCount: number;

  @ApiProperty({
    description: '활성화된 방 수',
    example: 120,
  })
  activatedRoomsCount: number;

  @ApiProperty({
    description: '정산 중인 방 수',
    example: 10,
  })
  inSettlementRoomsCount: number;

  @ApiProperty({
    description: '완료된 방 수',
    example: 25,
  })
  completedRoomsCount: number;

  @ApiProperty({
    description: '비활성화/만료된 방 수',
    example: 5,
  })
  deactivatedRoomsCount: number;

  @ApiProperty({
    description: '삭제된 방 수',
    example: 5,
  })
  deletedRoomsCount: number;
}

export class RoomStatisticsResponseDto {
  @ApiProperty({
    description: '월별 방 통계 데이터',
    type: 'object',
    additionalProperties: false,
    example: {
      '2024-01': {
        totalRoomsCount: 165,
        activatedRoomsCount: 120,
        inSettlementRoomsCount: 10,
        completedRoomsCount: 25,
        deactivatedRoomsCount: 5,
        deletedRoomsCount: 5,
      },
      '2024-02': {
        totalRoomsCount: 195,
        activatedRoomsCount: 140,
        inSettlementRoomsCount: 10,
        completedRoomsCount: 35,
        deactivatedRoomsCount: 5,
        deletedRoomsCount: 5,
      },
    },
  })
  data: { [key: string]: RoomStatisticsDto };
}
