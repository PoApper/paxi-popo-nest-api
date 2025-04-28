import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { ReportService } from 'src/report/report.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { CreateReportDto } from 'src/report/dto/create-report.dto';
import { RolesGuard } from 'src/auth/authorization/roles.guard';
import { UserType } from 'src/user/user.meta';
import { Report } from 'src/report/entities/report.entity';

@ApiCookieAuth()
@UseGuards(RolesGuard)
@UseGuards(JwtAuthGuard)
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @ApiOperation({
    summary: '방 또는 방의 특정 유저를 신고합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '신고가 성공적으로 생성.',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  async create(@Req() req, @Body() dto: CreateReportDto) {
    const user = req.user as JwtPayload;
    return await this.reportService.create(user.uuid, dto);
  }

  @Get()
  @ApiOperation({
    summary: '모든 신고 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '신고 목록을 반환',
    type: [Report],
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않는 경우',
  })
  @ApiResponse({
    status: 403,
    description: '관리자 권한이 없는 경우',
  })
  @SetMetadata('roles', [UserType.admin])
  async findAll() {
    return await this.reportService.findAll();
  }

  @Get('/my')
  @ApiOperation({
    summary: '내가 신고한 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '신고 목록을 반환',
    type: [Report],
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  async findMyReports(@Req() req) {
    const user = req.user as JwtPayload;
    return await this.reportService.findByReporterUuid(user.uuid);
  }
}
