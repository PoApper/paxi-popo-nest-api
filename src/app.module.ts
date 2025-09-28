// constants.ts를 가장 먼저 import하여 환경변수 로딩 보장
// TODO: 장기적으로는 환경변수 configService로 가져와야 함
import './auth/constants';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import { FcmModule } from 'src/fcm/fcm.module';
import { RoomModule } from 'src/room/room.module';
import { ReportModule } from 'src/report/report.module';
import { CheatModule } from 'src/cheat/cheat.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import configurations from './config/configurations';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { NicknameExistsGuard } from './auth/guards/nickname.guard';
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configurations],
      isGlobal: true,
      // NOTE: /usr/src/app/.env 로 사용 가능성
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        // Create a safe copy of the config without sensitive information
        const safeConfig = { ...dbConfig };
        if (safeConfig.password) {
          safeConfig.password = '********';
        }
        console.log(safeConfig);
        return dbConfig;
      },
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      }),
    }),
    AuthModule,
    UserModule,
    RoomModule,
    ChatModule,
    FcmModule,
    ReportModule,
    CheatModule,
    ScheduleModule.forRoot(), // For cron jobs
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: NicknameExistsGuard,
    },
  ],
})
export class AppModule {}
