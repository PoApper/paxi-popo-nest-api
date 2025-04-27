import { CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';

export abstract class BaseEntity {
  @CreateDateColumn()
  @ApiHideProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiHideProperty()
  updatedAt: Date;
}
