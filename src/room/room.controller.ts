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

import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';

@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @ApiOperation({
    summary: '방을 생성하고 방 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '생성된 방 정보를 반환',
    type: [Room],
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
    description: '내부 트랜잭션 오류 등으로 방 생성이 실패할 경우',
  })
  async create(@Req() req, @Body() dto: CreateRoomDto) {
    const user = req.user as JwtPayload;
    return await this.roomService.create(user, dto);
  }

  @Get()
  @ApiOperation({
    summary: '모든 방의 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '모든 방을 반환',
    type: [Room],
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  findAll() {
    console.log('findAll');
    return this.roomService.findAll();
  }

  @Get(':uuid')
  @ApiOperation({
    summary: '특정 방의 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '특정 방을 반환, 방이 존재하지 않을 경우 null 반환',
    type: Room,
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  findOne(@Param('uuid') uuid: string) {
    console.log(uuid);
    return this.roomService.findOne(uuid);
  }

  @Patch(':uuid')
  @ApiOperation({
    summary: '방의 정보를 수정합니다. 방장, 관리자만 가능합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '수정된 방 정보를 반환',
    type: Room,
  })
  @ApiResponse({
    status: 400,
    description:
      '방이 존재하지 않는 경우, 이미 종료된 방인 경우, 출발 시간이 현재보다 이전인 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우, 방장이나 관리자가 아닌 경우',
  })
  async update(
    @Param('uuid') uuid: string,
    @Req() req,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    const user = req.user as JwtPayload;
    // TODO: Update 된 객체 반환하기
    return await this.roomService.update(uuid, updateRoomDto, user);
  }

  @Delete(':uuid')
  @ApiOperation({
    summary: '방을 삭제합니다. 방장, 관리자만 가능합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '상태가 DELETED로 변경된 방의 UUID를 반환',
    type: Room,
  })
  @ApiResponse({
    status: 400,
    description: '방이 존재하지 않는 경우, 이미 삭제된 방인 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우, 방장이나 관리자가 아닌 경우',
  })
  async remove(@Req() req, @Param('uuid') uuid: string) {
    const user = req.user as JwtPayload;
    return this.roomService.remove(uuid, user.uuid);
  }

  @Post('join/:uuid')
  @ApiOperation({
    summary: '방에 참여합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '가입된 방 정보를 반환',
    type: Room,
  })
  @ApiResponse({
    status: 400,
    description:
      '방이 존재하지 않는 경우, 방에 가입할 수 없는 상태(방이 활성화되지 않은 경우, 이미 가입된 방, 강퇴된 방)인 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  async joinRoom(@Req() req, @Param('uuid') uuid: string) {
    const user = req.user as JwtPayload;
    return await this.roomService.joinRoom(uuid, user.uuid);
  }

  @Put('leave/:uuid')
  @ApiOperation({
    summary: '방에서 나갑니다. 사용자의 상태가 LEFT로 변경됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자와 방 정보를 반환',
    type: Room,
  })
  @ApiResponse({
    status: 400,
    description:
      '방이 존재하지 않는 경우, 방에 가입되어 있지 않은 경우, 방장이 탈퇴하는 경우에 다른 방장을 지정할 수 없는 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우',
  })
  async leaveRoom(@Req() req, @Param('uuid') uuid: string) {
    const user = req.user as JwtPayload;
    return await this.roomService.leaveRoom(uuid, user.uuid);
  }

  @Put('kick/:uuid')
  @ApiOperation({
    summary:
      '사용자를 추방합니다. 방장만 가능하며, 사용자의 상태를 KICKED로 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '강퇴된 사용자와 방 정보를 반환',
    type: Room,
  })
  @ApiResponse({
    status: 400,
    description: '방이 존재하지 않는 경우, 방에 가입되어 있지 않은 경우',
  })
  @ApiResponse({
    status: 401,
    description: '로그인이 되어 있지 않은 경우, 방장이 아닌 경우',
  })
  async kickRoom(
    @Req() req,
    @Param('uuid') uuid: string,
    @Query('userUuid') userUuid: string,
  ) {
    const user = req.user as JwtPayload;
    return await this.roomService.kickRoom(uuid, user.uuid, userUuid);
  }
}

/* docs 데코레이터 간소화 */
/*
  @ApiOperation({
    summary: '주어진 사용자를 주어진 방에 가입시킵니다.',
    responses: {
      200: {
        description: '가입된 방 정보를 반환',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Room',
            },
          },
        },
      },
      400: {
        description:
          '룸이 존재하지 않는 경우, 룸이 가입할 수 없는 상태(ACTIVATED 상태가 아님, 이미 가입된 룸, 강퇴된 룸)인 경우',
      },
      401: {
        description: '로그인이 되어 있지 않은 경우',
      },
    },
  })
 */
