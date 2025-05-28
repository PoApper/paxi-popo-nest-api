import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';

import { FcmModule } from 'src/fcm/fcm.module';
import { RoomModule } from 'src/room/room.module';
import { ReportModule } from 'src/report/report.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import configurations from './config/configurations';

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
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    AuthModule,
    UserModule,
    RoomModule,
    ChatModule,
    FcmModule,
    ReportModule,
    ScheduleModule.forRoot(), // For cron jobs
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
