import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {} from 'src/user/user.meta';

import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group } from './entities/group.entity';

@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @ApiOperation({
    summary: '그룹을 생성하고 그룹 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '생성된 그룹 정보를 반환',
    type: [Group],
  })
  @ApiResponse({
    status: 400,
    description: '출발 시간이 현재보다 이전인 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  @ApiResponse({
    status: 500,
    description: '내부 트랜잭션 오류 등으로 그룹 생성이 실패할 경우',
  })
  async create(@Req() req, @Body() dto: CreateGroupDto) {
    const user = req.user as JwtPayload;
    return await this.groupService.create(user, dto);
  }

  @Get()
  @ApiOperation({
    summary: '모든 그룹을 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '모든 그룹을 반환',
    type: [Group],
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  findAll() {
    console.log('findAll');
    return this.groupService.findAll();
  }

  @Get(':uuid')
  @ApiOperation({
    summary: '그룹의 UUID에 따라 특정 그룹을 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '특정 그룹을 반환, 그룹이 존재하지 않을 경우 null 반환',
    type: Group,
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  findOne(@Param('uuid') uuid: string) {
    console.log(uuid);
    return this.groupService.findOne(uuid);
  }

  @Patch(':uuid')
  @ApiOperation({
    summary: '그룹의 정보를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '수정된 그룹 정보를 반환',
    type: Group,
  })
  @ApiResponse({
    status: 400,
    description:
      '그룹이 존재하지 않는 경우, 이미 종료된 그룹인 경우, 출발 시간이 현재보다 이전인 경우',
  })
  @ApiResponse({
    status: 401,
    description:
      '로그인이 되어 있지 않은 경우, 그룹의 owner나 관리자가 아닌 경우',
  })
  async update(
    @Param('uuid') uuid: string,
    @Req() req,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    const user = req.user as JwtPayload;
    return await this.groupService.update(uuid, updateGroupDto, user);
  }

  @Delete(':uuid')
  @ApiOperation({
    summary: '그룹의 상태를 DELETED로 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '상태가 DELETED로 변경된 그룹의 UUID를 반환',
    type: Group,
  })
  @ApiResponse({
    status: 400,
    description: '그룹이 존재하지 않는 경우, 이미 삭제된 그룹인 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  async remove(@Req() req, @Param('uuid') uuid: string) {
    const user = req.user as JwtPayload;
    return this.groupService.remove(uuid, user.uuid);
  }

  @Post('join/:uuid')
  @ApiOperation({
    summary: '주어진 사용자를 주어진 그룹에 가입시킵니다.',
  })
  @ApiResponse({
    status: 200,
    description: '가입된 그룹 정보를 반환',
    type: Group,
  })
  @ApiResponse({
    status: 400,
    description:
      '그룹이 존재하지 않는 경우, 그룹이 가입할 수 없는 상태(ACTIVATED 상태가 아님, 이미 가입된 그룹, 강퇴된 그룹)인 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  async joinGroup(@Req() req, @Param('uuid') uuid: string) {
    const user = req.user as JwtPayload;
    return await this.groupService.joinGroup(uuid, user.uuid);
  }

  @Put('leave/:uuid')
  @ApiOperation({
    summary: '주어진 사용자를 주어진 그룹에서 상태를 LEFT로 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자와 그룹 정보를 반환',
    type: Group,
  })
  @ApiResponse({
    status: 400,
    description:
      '그룹이 존재하지 않는 경우, 그룹에 가입되어 있지 않은 경우, 방장이 탈퇴하는 경우에 다른 방장을 지정할 수 없는 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  async leaveGroup(@Req() req, @Param('uuid') uuid: string) {
    const user = req.user as JwtPayload;
    return await this.groupService.leaveGroup(uuid, user.uuid);
  }

  @Put('kick/:uuid')
  @ApiOperation({
    summary: '주어진 사용자를 주어진 그룹에서 상태를 KICKED로 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '강퇴된 사용자와 그룹 정보를 반환',
    type: Group,
  })
  @ApiResponse({
    status: 400,
    description: '그룹이 존재하지 않는 경우, 그룹에 가입되어 있지 않은 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우, 방장이 아닌 경우',
  })
  async kickGroup(
    @Req() req,
    @Param('uuid') uuid: string,
    @Query('userUuid') userUuid: string,
  ) {
    const user = req.user as JwtPayload;
    return await this.groupService.kickGroup(uuid, user.uuid, userUuid);
  }
}

/* docs 데코레이터 간소화 */
/*
  @ApiOperation({
    summary: '주어진 사용자를 주어진 그룹에 가입시킵니다.',
    responses: {
      200: {
        description: '가입된 그룹 정보를 반환',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Group',
            },
          },
        },
      },
      400: {
        description:
          '그룹이 존재하지 않는 경우, 그룹이 가입할 수 없는 상태(ACTIVATED 상태가 아님, 이미 가입된 그룹, 강퇴된 그룹)인 경우',
      },
      401: {
        description: '로그인이 되어 있지 않은 경우',
      },
    },
  })
 */
