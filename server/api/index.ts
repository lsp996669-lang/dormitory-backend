import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import * as express from 'express';
import { HttpStatusInterceptor } from '../src/interceptors/http-status.interceptor';
import type { Request, Response } from 'express';

let cachedApp: any;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.useGlobalInterceptors(new HttpStatusInterceptor());

  await app.init();
  cachedApp = app;
  return app;
}

export default async function handler(req: Request, res: Response) {
  const app = await createApp();
  const expressInstance = app.getHttpAdapter().getInstance();
  return expressInstance(req, res);
}
