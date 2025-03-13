import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserType } from 'src/user/user.meta';

import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@ApiBearerAuth()
@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateGroupDto })
  create(@Req() req, @Body() dto: CreateGroupDto) {
    const user = req.user as JwtPayload;

    // 출발 시간 현재보다 이전인지 확인
    if (dto.departureTime < new Date()) {
      throw new BadRequestException(
        '출발 시간은 현재 시간보다 이전일 수 없습니다.',
      );
    }

    return this.groupService.create(user, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.groupService.findAll();
  }

  @Get(':uuid')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('uuid') uuid: string) {
    return this.groupService.findOne(uuid);
  }

  @Patch(':uuid')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('uuid') uuid: string,
    @Req() req,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    const group = await this.groupService.findOne(uuid);
    if (!group) {
      throw new BadRequestException('그룹이 존재하지 않습니다.');
    }
    const user = req.user as JwtPayload;

    if (user.userType == UserType.admin || group?.ownerUuid == user.uuid) {
      // 출발 시간이 있다면 현재보다 이전인지 확인
      const departureTime = updateGroupDto.departureTime;
      if (departureTime && new Date(departureTime) < new Date()) {
        throw new BadRequestException(
          '출발 시간은 현재 시간보다 이전일 수 없습니다.',
        );
      }

      return this.groupService.update(uuid, updateGroupDto);
    } else {
      throw new UnauthorizedException('방장 또는 관리자가 아닙니다.');
    }
  }

  @Delete(':id')
  remove(@Param('id') uuid: string) {
    return this.groupService.remove(uuid);
  }
}
