import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Paxi API')
    .setDescription('Paxi API documentation')
    .setVersion('1.0')
    .addTag('paxi')
    .addBearerAuth()
    .addCookieAuth('Authentication')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT || 4001);
}

bootstrap();
