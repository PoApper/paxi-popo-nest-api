import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Report } from 'src/report/entities/report.entity';
import { CreateReportDto } from 'src/report/dto/create-report.dto';
import { RoomService } from 'src/room/room.service';
import { UserService } from 'src/user/user.service';

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
}
