import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { FcmModule } from 'src/fcm/fcm.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { GroupModule } from './group/group.module';
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
    GroupModule,
    ChatModule,
    FcmModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
