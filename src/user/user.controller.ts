import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Body,
  Put,
  Param,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/authorization/roles.guard';
import { Roles } from 'src/auth/authorization/roles.decorator';

import { UserService } from './user.service';
import { UserType } from './user.meta';
import { Nickname } from './entities/nickname.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
@ApiResponse({
  status: 401,
  description: '유저가 로그인하지 않은 경우',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('onboarding-status')
  @ApiOperation({
    summary: '유저의 온보딩 상태를 반환합니다.',
    description:
      'Paxi에 처음 방문하는 유저들을 온보딩 페이지로 리다이렉트 시키기 위한 엔드포인트입니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '유저와 대응되는 닉네임이 있다면 true와 해당 닉네임을 반환하고, 없다면 false와 랜덤 닉네임을 반환합니다.',
    schema: {
      type: 'object',
      properties: {
        onboardingStatus: { type: 'boolean', example: true },
        nickname: { type: 'string', example: '행복한_수소_1234' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description:
      '낮은 확률이지만, 제한 횟수 초과로 랜덤 닉네임을 생성하는 데 실패한 경우',
  })
  async getOnboardingStatus(@Req() req) {
    const user = req.user as JwtPayload;
    const nickname = await this.userService.getNickname(user.uuid);
    if (nickname) {
      return {
        onboardingStatus: true,
        nickname: nickname.nickname,
      };
    }

    const randomNickname = await this.userService.generateRandomNickname();
    return {
      onboardingStatus: false,
      nickname: randomNickname,
    };
  }

  @Post('nickname')
  @ApiOperation({
    summary: '유저의 닉네임을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '유저 UUID와 생성된 닉네임을 반환합니다.',
    type: Nickname,
  })
  @ApiResponse({
    status: 409,
    description: '닉네임이 이미 존재하는 경우',
  })
  @ApiResponse({
    status: 400,
    description: '이미 닉네임을 갖고 있는 경우',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nickname: { type: 'string', example: '행복한_수소_1234' },
      },
    },
  })
  // TODO: 온보딩에서 유저의 닉네임과 계좌번호까지 같이 받을 수 있게 하면 좋을 것 같음
  async createNickname(@Req() req, @Body() body: { nickname: string }) {
    const user = req.user as JwtPayload;
    return await this.userService.createNickname(user.uuid, body.nickname);
  }

  @Put('nickname/:userUuid')
  @ApiOperation({
    summary: '유저의 닉네임을 수정합니다. 관리자만 가능합니다',
    description: '부적절한 닉네임을 수정하기 위한 엔드포인트입니다.',
  })
  @ApiResponse({
    status: 200,
    description: '수정된 닉네임을 반환합니다.',
    schema: {
      type: 'string',
      example: '행복한_수소_1234',
    },
  })
  @ApiResponse({
    status: 409,
    description: '닉네임이 이미 존재하는 경우',
  })
  @ApiResponse({
    status: 404,
    description: '닉네임이 존재하지 않는 경우',
  })
  @ApiParam({
    name: 'userUuid',
    description: '닉네임을 수정할 유저의 UUID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nickname: { type: 'string', example: '행복한_수소_1234' },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserType.student)
  async updateNickname(
    @Req() req,
    @Param('userUuid') userUuid: string,
    @Body() body: { nickname: string },
  ) {
    const nickname = await this.userService.updateNickname(
      userUuid,
      body.nickname,
    );
    return nickname;
  }

  @Get('my')
  @ApiOperation({
    summary: '유저의 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '닉네임, 계좌번호, 계좌주 이름, 은행명을 반환합니다. 닉네임, 계좌 정보가 없다면 아무것도 반환하지 않습니다.',
    schema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        nickname: {
          type: 'string',
          example: '행복한_수소_1234',
        },
        accountNumber: {
          type: 'string',
          example: '1234-5678-9012-3456',
        },
        accountHolderName: {
          type: 'string',
          example: '포닉스',
        },
        bankName: { type: 'string', example: '국민은행' },
      },
    },
  })
  async getUserInfo(@Req() req) {
    const user = req.user as JwtPayload;
    return await this.userService.getUserInfo(user.uuid);
  }

  @Post('account')
  @ApiOperation({
    summary: '유저의 계좌번호를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description:
      '유저의 계좌번호를 생성합니다. 생성된 계좌번호 정보를 반환합니다.',
    type: CreateAccountDto,
  })
  @ApiResponse({
    status: 400,
    description: '유저의 계좌번호가 이미 존재하는 경우',
  })
  @ApiBody({
    type: CreateAccountDto,
  })
  async createAccount(@Req() req, @Body() dto: CreateAccountDto) {
    const user = req.user as JwtPayload;
    return await this.userService.createAccount(user.uuid, dto);
  }

  @Put('account')
  @ApiOperation({
    summary: '유저의 계좌번호를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '유저의 계좌번호를 수정합니다. 수정된 계좌번호 정보를 반환합니다.',
    type: UpdateAccountDto,
  })
  @ApiBody({
    type: UpdateAccountDto,
  })
  async updateAccount(@Req() req, @Body() dto: UpdateAccountDto) {
    const user = req.user as JwtPayload;
    return await this.userService.updateAccount(user.uuid, dto);
  }
}
