import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post, Put,
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
  async create(@Req() req, @Body() dto: CreateGroupDto) {
    const user = req.user as JwtPayload;
    return await this.groupService.create(user, dto);
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
    const user = req.user as JwtPayload;
    return await this.groupService.update(uuid, updateGroupDto, user);
  }

  @Delete(':id')
  remove(@Param('id') uuid: string) {
    return this.groupService.remove(uuid);
  }

  @Post('join/:uuid')
  @UseGuards(JwtAuthGuard)
  async joinGroup(@Req() req, @Param('uuid') uuid: string) {
    const user = req.user as JwtPayload;
    return await this.groupService.joinGroup(uuid, user.uuid);
  }

  @Put('leave/:uuid')
  @UseGuards(JwtAuthGuard)
  async leaveGroup(@Req() req, @Param('uuid') uuid: string) {
    const user = req.user as JwtPayload;
    return await this.groupService.leaveGroup(uuid, user.uuid);
  }
}
