import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { APP_CONSTANTS } from './common/constants/app.constants';
import * as express from 'express';

const server = express();

let app: any;

async function createNestApp() {
  if (!app) {
    app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: ['error', 'warn', 'log'],
    });
    
    // Enable CORS
    app.enableCors({
      origin: [
        'https://upwork-llmproject.vercel.app',
        'https://*.vercel.app',
        'http://localhost:3000',
        'http://localhost:4200'
      ],
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // API prefix
    app.setGlobalPrefix(APP_CONSTANTS.API_PREFIX);

    await app.init();
  }
  return app;
}

export default async function handler(req: any, res: any) {
  await createNestApp();
  return server(req, res);
}
