import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { before } from 'node:test';
import { group } from 'console';

import { User } from 'src/user/entities/user.entity';
import { AppModule } from 'src/app.module';

import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { Group } from './entities/group.entity';
import { GroupUser } from './entities/group.user.entity';

describe('GroupModule - Integration Test', () => {
  // let app: INestApplication;

  // beforeAll(async () => {
  //   const moduleFixture: TestingModule = await Test.createTestingModule({
  //     imports: [AppModule],
  //   }).compile();

  //   app = moduleFixture.createNestApplication();
  //   await app.init();
  // });

  // afterEach(async () => {
  //   // 각 테스트async  끝날 때마다 테스트 DB 초기화
  //   const dataSource = app.get(DataSource);
  //   await dataSource.synchronize(true);
  // });

  // afterAll(async () => {
  //   await app.close();
  // });

  let groupController: GroupController;
  let groupService: GroupService;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Group, GroupUser],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([User, Group, GroupUser]),
      ],
      providers: [GroupService, GroupController],
    }).compile();

    groupController = moduleFixture.get<GroupController>(GroupController);
    groupService = moduleFixture.get<GroupService>(GroupService);
  });

  it('should be defined', () => {
    expect(groupController).toBeDefined();
    expect(groupService).toBeDefined();
  });

  // describe('create', () => {
  //   it('should create a group', async () => {
  //     const dto: CreateGroupDto = {
  //       title: 'test',
  //       departureTime: new Date(),
  //       departureLocation: 'test',
  //       destinationLocation: 'test',
  //       maxParticipant: 1,
  //     };
  //     const req = {
  //       user: {
  //         uuid: 'test',
  //       },
  //     };
  //     const result: any = await groupController.create(req, dto);
  //     expect(result).toHaveProperty('id');
  //     expect(result.title).toBe(dto.title);
  //     expect(result.departureTime).toBe(dto.departureTime);
  //     expect(result.departureLocation).toBe(dto.departureLocation);
  //     expect(result.destinationLocation).toBe(dto.destinationLocation);
  //     expect(result.maxParticipant).toBe(dto.maxParticipant);
  //   });
  // });
});
