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
  
  // 注意：Vercel serverless 模式下不设置 setGlobalPrefix
  // 因为请求路径已经是 /api/xxx
  cachedApp.use(express.json({ limit: '50mb' }));
  cachedApp.use(express.urlencoded({ limit: '50mb', extended: true }));
  cachedApp.useGlobalInterceptors(new HttpStatusInterceptor());

  await cachedApp.init();
  expressInstance = expressApp;
  return cachedApp;
}

export default async (req: any, res: any) => {
  try {
    await bootstrap();
    expressInstance(req, res);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
