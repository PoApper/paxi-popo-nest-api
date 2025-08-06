import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import {
  initializeApp as initializeFirebaseApp,
  ServiceAccount,
} from 'firebase-admin/app';
import { credential as firebaseCredential } from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';

import { AppModule } from './app.module';

async function bootstrap() {
  const isLocalDeploy = process.env.NODE_ENV == 'local';
  const httpsOptions = isLocalDeploy
    ? {
        key: fs.readFileSync('./local-certs/localhost-key.pem'),
        cert: fs.readFileSync('./local-certs/localhost.pem'),
      }
    : undefined;

  const app = await NestFactory.create(AppModule, { httpsOptions });
  const configService = app.get(ConfigService);

  app.use(cookieParser());

  if (isLocalDeploy) {
    app.enableCors({
      origin: ['https://localhost:3000', 'https://localhost:3001'],
      credentials: true,
    });
  } else {
    app.enableCors({
      origin: [
        'https://popo.poapper.club',
        'https://popo-dev.poapper.club',
        'https://admin.popo.poapper.club',
        'https://admin.popo-dev.poapper.club',
        'https://popo.postech.ac.kr',
      ],
      credentials: true,
    });
  }

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
