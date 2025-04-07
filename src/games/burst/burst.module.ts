import { Module } from '@nestjs/common';
import { BurstController } from './burst.controller';
import { BurstGateway } from './burst.gateway';
import { BurstService } from './burst.service';

@Module({
  controllers: [BurstController],
  providers: [BurstService, BurstGateway],
  exports: [BurstService]
})
export class BurstModule {}