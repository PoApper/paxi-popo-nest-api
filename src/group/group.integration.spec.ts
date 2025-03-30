import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import configurations from 'src/config/configurations';

import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupModule } from './group.module';

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
        ConfigModule.forRoot({
          load: [configurations],
          isGlobal: true,
          envFilePath: ['.env'],
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const dbConfig = configService.get('database');
            console.log(dbConfig);
            return dbConfig;
          },
        }),
        GroupModule,
      ],
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
