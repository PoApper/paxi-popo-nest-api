import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { ReportService } from 'src/report/report.service';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { CreateReportDto } from 'src/report/dto/create-report.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/authorization/roles.decorator';
import { UserType } from 'src/user/user.meta';
import { User } from 'src/common/decorators/user.decorator';

import { ReportStatus } from './entities/report.meta';
import { ReportResponseDto } from './dto/response-report.dto';
@ApiCookieAuth()
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @ApiOperation({
    summary: '방의 특정 유저를 신고합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '신고가 성공적으로 생성.',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  @ApiResponse({
    status: 400,
    description: '자기 자신을 신고하는 경우',
  })
  async create(@User() user: JwtPayload, @Body() dto: CreateReportDto) {
    return await this.reportService.create(user.uuid, dto);
  }

  @Get()
  @ApiOperation({
    summary: '[관리자 전용] 모든 신고 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '신고 목록을 반환',
    type: [ReportResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않는 경우',
  })
  @ApiResponse({
    status: 403,
    description: '관리자 권한이 없는 경우',
  })
  @UseGuards(RolesGuard)
  @Roles(UserType.admin)
  async findAll() {
    const reports = await this.reportService.findAll();
    return reports.map((report) => new ReportResponseDto(report));
  }

  @Get('/my')
  @ApiOperation({
    summary: '내가 신고한 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '신고 목록을 반환',
    type: [ReportResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  async findMyReports(@User() user: JwtPayload) {
    const reports = await this.reportService.findByReporterUuid(user.uuid);
    return reports.map((report) => new ReportResponseDto(report));
  }

  @Put('/:id/resolve')
  @ApiOperation({
    summary: '[관리자 전용] 신고를 처리합니다.',
  })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  @ApiResponse({
    status: 403,
    description: '관리자 권한이 없는 경우',
  })
  @ApiResponse({
    status: 404,
    description: '신고를 찾을 수 없는 경우',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        resolutionMessage: {
          type: 'string',
          description: '관리자 처리 결과 메시지',
        },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserType.admin)
  async resolveReport(
    @User() user: JwtPayload,
    @Param('id') id: number,
    @Body() dto: { resolutionMessage: string },
  ) {
    return await this.reportService.resolve(
      id,
      user.uuid,
      user.name,
      ReportStatus.COMPLETED,
      dto.resolutionMessage,
    );
  }

  // TODO: 메일링
}
