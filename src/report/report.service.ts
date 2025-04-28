import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Report } from 'src/report/entities/report.entity';
import { CreateReportDto } from 'src/report/dto/create-report.dto';
import { RoomService } from 'src/room/room.service';
import { UserService } from 'src/user/user.service';
import { ReportStatus } from 'src/report/entities/report.meta';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly userService: UserService,
    private readonly roomService: RoomService,
  ) {}

  async create(reporterUuid: string, createReportDto: CreateReportDto) {
    const room = await this.roomService.findOne(createReportDto.targetRoomUuid);
    if (!room) {
      throw new Error('방을 찾을 수 없습니다.');
    }

    const user = await this.userService.findOne(createReportDto.targetUserUuid);
    if (!user) {
      throw new Error('유저를 찾을 수 없습니다.');
    }
    return await this.reportRepository.save({
      ...createReportDto,
      reporterUuid: reporterUuid,
    });
  }

  async findAll() {
    return await this.reportRepository.find({
      relations: ['reporter', 'targetUser', 'targetRoom'],
    });
  }

  async findByReporterUuid(reporterUuid: string) {
    return await this.reportRepository.find({
      where: { reporterUuid: reporterUuid },
      relations: ['reporter', 'targetUser', 'targetRoom'],
    });
  }

  async updateReportStatus(id: number, status: string) {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('신고를 찾을 수 없습니다.');
    }
    report.status = ReportStatus[status];
    if (!report.status) {
      throw new BadRequestException('잘못된 신고 상태입니다.');
    }
    await this.reportRepository.update(id, {
      status: report.status,
    });
    return report;
  }
}
