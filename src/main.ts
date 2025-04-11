import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Используем Winston в качестве логгера приложения
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  
  // Включаем CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  
  // Используем WebSocket адаптер
  const wsAdapter = new WsAdapter(app);
  app.useWebSocketAdapter(wsAdapter);
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  // Используем встроенный логгер для этих сообщений
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`Приложение запущено на порту ${port}`);
  logger.log(`WebSocket эндпоинты доступны на ws://localhost:${port}/...`);
}

bootstrap();