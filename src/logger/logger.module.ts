// src/logger/logger.module.ts
import { Module, Global } from '@nestjs/common';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import * as SlackWebHook from 'winston-slack-webhook-transport';
import * as path from 'path';
import * as os from 'os';

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('GameServices', {
              prettyPrint: true,
              colors: true,
            }),
          ),
        }),
        
        // Файловый транспорт для всех логов
        new DailyRotateFile({
          dirname: path.join(process.cwd(), 'logs'),
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        
        // Файловый транспорт только для ошибок
        new DailyRotateFile({
          level: 'error',
          dirname: path.join(process.cwd(), 'logs'),
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        
        // Slack транспорт для ошибок
        new SlackWebHook({
          level: 'error',
          webhookUrl: process.env.SLACK_WEBHOOK_URL!,
          username: 'GameServices-Bot',
          iconEmoji: ':rotating_light:',
          formatter: (info) => {
            const { timestamp, level, message, ...meta } = info;
            
            // Получаем имя сервера
            const serverName = process.env.SERVER_NAME || os.hostname();
            
            // Создаем блоки сообщения в формате Slack Block Kit
            return {
              blocks: [
                {
                  type: 'header',
                  text: {
                    type: 'plain_text',
                    text: `:rotating_light: Ошибка в ${process.env.NODE_ENV || 'development'} :rotating_light:`,
                    emoji: true
                  }
                },
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*Сообщение:* ${message}`
                  }
                },
                {
                  type: 'section',
                  fields: [
                    {
                      type: 'mrkdwn',
                      text: `*Сервис:* ${meta.service || 'Неизвестно'}`
                    },
                    {
                      type: 'mrkdwn',
                      text: `*Сервер:* ${serverName}`
                    },
                    {
                      type: 'mrkdwn',
                      text: `*Время:* ${new Date(timestamp).toLocaleString()}`
                    }
                  ]
                },
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*Стек ошибки:*\n\`\`\`${meta.stack || 'Не предоставлен'}\`\`\``
                  }
                }
              ]
            };
          }
        }),
      ],
      // Перехват необработанных исключений
      exceptionHandlers: [
        new winston.transports.File({ 
          filename: path.join(process.cwd(), 'logs', 'exceptions.log')
        })
      ]
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}