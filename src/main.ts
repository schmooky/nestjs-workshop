import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('Starting NestJS application...');
    
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enable all log levels for debugging
    });
    
    // Enable CORS
    app.enableCors({
      origin: true, // Allow all origins (or specify your domains)
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'Content-Type, Accept, Authorization',
    });
    
    // Use WebSocket adapter with custom settings
    const wsAdapter = new WsAdapter(app);
    app.useWebSocketAdapter(wsAdapter);
    
    const port = process.env.PORT || 3000;
    await app.listen(port);
    
    console.log(`Application is running on port ${port}`); // Use console.log instead of logger
    console.log(`WebSocket endpoints available at ws://localhost:${port}/...`);
  } catch (error) {
    console.error('Failed to start application:', error);
  }
}

bootstrap();