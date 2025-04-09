import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlayerModule } from './player/player.module';
import { WalletModule } from './wallet/wallet.module';
import { GameModule } from './game/game.module';
import { SessionModule } from './session/session.module';
import { PrismaModule } from './prisma/prisma.module';
import { BurstModule } from './games/burst/burst.module';
import { FirejokerModule } from './games/firejoker/firejoker.module';

@Module({
  imports: [
    PrismaModule,
    PlayerModule,
    WalletModule,
    GameModule,
    SessionModule,
    BurstModule,
    FirejokerModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}