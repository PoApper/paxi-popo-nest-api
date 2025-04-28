import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import {
  initializeApp as initializeFirebaseApp,
  ServiceAccount,
} from 'firebase-admin/app';
import { credential as firebaseCredential } from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.use(cookieParser());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Paxi API')
    .setDescription('Paxi API Documentation')
    .setVersion('1.0')
    .addCookieAuth('Authentication')
    .setExternalDoc(
      'Websocket API 문서',
      'https://github.com/PoApper/paxi-popo-nest-api/blob/main/websocket-api.md',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  initializeFirebaseApp({
    credential: firebaseCredential.cert(
      configService.get('firebase') as ServiceAccount,
    ),
  });

  await app.listen(4100);
}

bootstrap();
