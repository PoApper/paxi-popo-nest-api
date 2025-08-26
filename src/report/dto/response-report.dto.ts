import { ApiProperty } from '@nestjs/swagger';

import { ReportStatus } from '../entities/report.meta';
import { Report } from '../entities/report.entity';

export class ReportResponseDto {
  constructor(report: Report) {
    this.id = report.id;
    this.reporterUuid = report.reporterUuid;
    this.reporterEmail = report.reporter.email;
    this.reporterNickname = report.reporter.nickname.nickname;
    this.targetUserUuid = report.targetUserUuid;
    this.targetUserEmail = report.targetUser.email;
    this.targetUserNickname = report.targetUser.nickname.nickname;
    this.targetRoomUuid = report.targetRoomUuid;
    this.targetRoomName = report.targetRoom.title;
    this.reason = report.reason;
    this.status = report.status;
    this.resolverName = report.resolverName ?? '';
    this.resolutionMessage = report.resolutionMessage ?? '';
    this.resolvedAt = report.resolvedAt ?? undefined;
    this.createdAt = report.createdAt;
  }
  @ApiProperty({
    description: '신고 ID',
  })
  id: number;

  @ApiProperty({
    description: '신고 유저 UUID',
  })
  reporterUuid: string;

  @ApiProperty({
    description: '신고 유저 이메일',
  })
  reporterEmail: string;

  @ApiProperty({
    description: '신고 유저 닉네임',
  })
  reporterNickname: string;

  @ApiProperty({
    description: '신고 대상 유저 UUID',
  })
  targetUserUuid: string;

  @ApiProperty({
    description: '신고 대상 유저 이메일',
  })
  targetUserEmail: string;

  @ApiProperty({
    description: '신고 대상 유저 닉네임',
  })
  targetUserNickname: string;

  @ApiProperty({
    description: '신고 대상 방 UUID',
  })
  targetRoomUuid: string;

  @ApiProperty({
    description: '신고 대상 방 이름',
  })
  targetRoomName: string;

  @ApiProperty({
    description: '신고 이유',
  })
  reason: string;

  @ApiProperty({
    description: '신고 상태',
  })
  status: ReportStatus;

  @ApiProperty({
    description: '신고 처리 관리자 이름',
  })
  resolverName: string;

  @ApiProperty({
    description: '신고 처리 결과 메시지',
  })
  resolutionMessage: string;

  @ApiProperty({
    description: '신고 처리 날짜',
  })
  resolvedAt: Date;

  @ApiProperty({
    description: '신고 생성 날짜',
  })
  createdAt: Date;
}
