import { Controller, Delete, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { User } from 'src/common/decorators/user.decorator';
import { RoomService } from 'src/room/room.service';
import { ChatService } from 'src/chat/chat.service';
import { UserService } from 'src/user/user.service';
import { GuardName } from 'src/common/guard-name';
import { PublicGuard } from 'src/common/public-guard.decorator';

@ApiCookieAuth()
@PublicGuard([GuardName.NicknameGuard])
@Controller('cheat')
export class CheatController {
  constructor(
    private readonly roomService: RoomService,
    private readonly chatService: ChatService,
    private readonly userService: UserService,
  ) {}

  @Delete('room')
  //   @ApiExcludeEndpoint()
  @ApiQuery({
    name: 'roomUuid',
    required: false,
    type: String,
    description: '특정 방 UUID. 없으면 모든 방 삭제',
  })
  @ApiOperation({
    summary: '방 및 해당 방의 채팅 데이터를 삭제합니다.',
  })
  async deleteRooms(
    @User() user: JwtPayload,
    @Query('roomUuid') roomUuid?: string,
  ) {
    // if (user.userType !== UserType.admin) {
    //   throw new ForbiddenException({
    //     error: 'Forbidden',
    //     message: '관리자 권한이 필요합니다.',
    //   });
    // }
    return await this.roomService.deleteAll(roomUuid);
  }

  @Delete('chat')
  //   @ApiExcludeEndpoint()
  @ApiQuery({
    name: 'chatUuid',
    required: false,
    type: String,
    description: '특정 방의 채팅 UUID. 없으면 모든 채팅 삭제',
  })
  async deleteChats(
    @User() user: JwtPayload,
    @Query('chatUuid') chatUuid?: string,
  ) {
    // if (user.userType !== UserType.admin) {
    //   throw new ForbiddenException({
    //     error: 'Forbidden',
    //     message: '관리자 권한이 필요합니다.',
    //   });
    // }
    return await this.chatService.deleteAll(chatUuid);
  }

  @Delete('nickname')
  //   @ApiExcludeEndpoint()
  @ApiQuery({
    name: 'userUuid',
    required: false,
    type: String,
    description: '특정 사용자 UUID. 없으면 모든 닉네임 삭제',
  })
  async deleteNicknames(
    @User() user: JwtPayload,
    @Query('userUuid') userUuid?: string,
  ) {
    // if (user.userType !== UserType.admin) {
    //   throw new ForbiddenException({
    //     error: 'Forbidden',
    //     message: '관리자 권한이 필요합니다.',
    //   });
    // }
    return await this.userService.deleteAllNickname(userUuid);
  }

  @Delete('account')
  //   @ApiExcludeEndpoint()
  @ApiQuery({
    name: 'userUuid',
    required: false,
    type: String,
    description: '특정 사용자 UUID. 없으면 모든 계좌 삭제',
  })
  async deleteAccounts(
    @User() user: JwtPayload,
    @Query('userUuid') userUuid?: string,
  ) {
    // if (user.userType !== UserType.admin) {
    //   throw new ForbiddenException({
    //     error: 'Forbidden',
    //     message: '관리자 권한이 필요합니다.',
    //   });
    // }
    return await this.userService.deleteAllAccount(userUuid);
  }
}
