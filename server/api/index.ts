import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { HttpStatusInterceptor } from '../src/interceptors/http-status.interceptor';

let cachedApp: any;
let expressInstance: express.Application;

async function bootstrap() {
  if (cachedApp) return cachedApp;

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  
  cachedApp = await NestFactory.create(AppModule, adapter, {
    logger: false,
  });

  cachedApp.enableCors({
    origin: true,
    credentials: true,
  });
  cachedApp.setGlobalPrefix('api');
  cachedApp.use(express.json({ limit: '50mb' }));
  cachedApp.use(express.urlencoded({ limit: '50mb', extended: true }));
  cachedApp.useGlobalInterceptors(new HttpStatusInterceptor());

  await cachedApp.init();
  expressInstance = expressApp;
  return cachedApp;
}

export default async (req: any, res: any) => {
  await bootstrap();
  return expressInstance(req, res);
};
