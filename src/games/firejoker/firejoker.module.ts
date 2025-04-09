import { Module } from '@nestjs/common';
import { FirejokerController } from './firejoker.controller';
import { FirejokerGateway } from './firejoker.gateway';
import { FirejokerService } from './firejoker.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [FirejokerController],
  providers: [FirejokerService, FirejokerGateway, PrismaService],
  exports: [FirejokerService]
})
export class FirejokerModule {}