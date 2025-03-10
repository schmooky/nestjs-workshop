import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlayerModule } from './player/player.module';
import { WalletModule } from './wallet/wallet.module';
import { GameModule } from './game/game.module';
import { SessionModule } from './session/session.module';

@Module({
  imports: [
    PlayerModule,
    WalletModule,
    GameModule,
    SessionModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}