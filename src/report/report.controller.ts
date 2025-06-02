import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  SetMetadata,
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
import { UserType } from 'src/user/user.meta';
import { Report } from 'src/report/entities/report.entity';
import { User } from 'src/common/decorators/user.decorator';
@ApiCookieAuth()
@UseGuards(RolesGuard)
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
  async create(@User() user: JwtPayload, @Body() dto: CreateReportDto) {
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
  async findMyReports(@User() user: JwtPayload) {
    return await this.reportService.findByReporterUuid(user.uuid);
  }

  @Put(':id')
  @ApiOperation({
    summary: '신고 상태를 업데이트합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '신고 상태 업데이트 성공',
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
        status: {
          type: 'string',
          description: '신고 상태',
        },
      },
    },
  })
  @SetMetadata('roles', [UserType.admin])
  async updateReportStatus(
    @Param('id') id: number,
    @Body() dto: { status: string },
  ) {
    return await this.reportService.updateReportStatus(id, dto.status);
  }

  // TODO: 메일링
}
