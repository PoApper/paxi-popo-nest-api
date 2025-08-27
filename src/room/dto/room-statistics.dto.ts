import { ApiProperty } from '@nestjs/swagger';

export class RoomStatisticsDto {
  @ApiProperty({
    description:
      '방 상태별 카운트 맵 (ACTIVE, IN_SETTLEMENT, COMPLETED, DEACTIVATED, DELETED)',
    example: {
      ACTIVE: 120,
      IN_SETTLEMENT: 10,
      COMPLETED: 25,
      DEACTIVATED: 5,
      DELETED: 5,
    },
  })
  statusCounts: Record<string, number>;

  @ApiProperty({
    description: '출발지별 방 생성 수',
    example: {
      학생회관: 15,
      지곡회관: 12,
      'KTX 포항역': 8,
      '포항 터미널': 5,
    },
  })
  departureLocationCounts: Record<string, number>;

  @ApiProperty({
    description: '도착지별 방 생성 수',
    example: {
      학생회관: 10,
      지곡회관: 18,
      'KTX 포항역': 12,
      '포항 터미널': 8,
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
        statusCounts: {
          ACTIVE: 120,
          IN_SETTLEMENT: 10,
          COMPLETED: 25,
          DEACTIVATED: 5,
          DELETED: 5,
        },
        departureLocationCounts: {
          학생회관: 15,
          지곡회관: 12,
          'KTX 포항역': 8,
        },
        destinationLocationCounts: {
          학생회관: 10,
          지곡회관: 18,
          'KTX 포항역': 12,
        },
      },
      '2024-02': {
        statusCounts: {
          ACTIVE: 140,
          IN_SETTLEMENT: 10,
          COMPLETED: 35,
          DEACTIVATED: 5,
          DELETED: 5,
        },
        departureLocationCounts: {
          학생회관: 16,
          지곡회관: 14,
          'KTX 포항역': 11,
        },
        destinationLocationCounts: {
          학생회관: 13,
          지곡회관: 19,
          'KTX 포항역': 11,
        },
      },
    },
  })
  data: { [key: string]: RoomStatisticsDto };
}
