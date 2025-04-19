import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import {
  initializeApp as initializeFirebaseApp,
  ServiceAccount,
} from 'firebase-admin/app';
import { credential as firebaseCredential } from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.use(cookieParser());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Paxi API')
    .setDescription('Paxi API documentation')
    .setVersion('1.0')
    .addTag('paxi')
    .addCookieAuth('Authentication')
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
