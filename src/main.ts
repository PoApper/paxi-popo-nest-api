import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { initializeApp as initializeFirebaseApp } from 'firebase-admin/app';
import { credential as firebaseCredential } from 'firebase-admin';
import * as process from 'node:process';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
      process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
    ),
  });

  await app.listen(process.env.PORT || 4001);
}

bootstrap();
