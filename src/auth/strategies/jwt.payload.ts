import { ApiProperty } from '@nestjs/swagger';

import { UserType } from 'src/user/user.meta';

export class JwtPayload {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  uuid: string;

  @ApiProperty({
    example: '포닉스',
  })
  name: string;

  @ApiProperty({
    example: '행복한_수소_1234',
  })
  nickname: string;

  @ApiProperty({
    example: UserType.student,
  })
  userType: UserType;

  @ApiProperty({
    example: 'paxi@postech.ac.kr',
  })
  email: string;
}
