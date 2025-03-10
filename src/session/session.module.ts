import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { PlayerModule } from '../player/player.module';
import { GameModule } from '../game/game.module';

@Module({
  imports: [PlayerModule, GameModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService]
})
export class SessionModule {}