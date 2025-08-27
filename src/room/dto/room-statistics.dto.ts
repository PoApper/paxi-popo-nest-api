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

  @ApiProperty({
    description: '출발지별 방 생성 수',
    example: {
      학생회관: 15,
      지곡회관: 12,
      포항역: 8,
      기숙사: 5,
    },
  })
  departureLocationCounts: Record<string, number>;

  @ApiProperty({
    description: '도착지별 방 생성 수',
    example: {
      학생회관: 10,
      지곡회관: 18,
      포항역: 12,
      기숙사: 8,
    },
  })
  destinationLocationCounts: Record<string, number>;
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
        departureLocationCounts: {
          학생회관: 15,
          지곡회관: 12,
          포항역: 8,
        },
        destinationLocationCounts: {
          학생회관: 10,
          지곡회관: 18,
          포항역: 12,
        },
      },
      '2024-02': {
        totalRoomsCount: 195,
        activatedRoomsCount: 140,
        inSettlementRoomsCount: 10,
        completedRoomsCount: 35,
        deactivatedRoomsCount: 5,
        deletedRoomsCount: 5,
        departureLocationCounts: {
          학생회관: 16,
          지곡회관: 14,
          포항역: 11,
        },
        destinationLocationCounts: {
          학생회관: 13,
          지곡회관: 19,
          포항역: 11,
        },
      },
    },
  })
  data: { [key: string]: RoomStatisticsDto };
}
