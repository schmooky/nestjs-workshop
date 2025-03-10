import { Controller, Get } from '@nestjs/common';
import { PlayerService } from './player.service';
import { Player } from './entities/player.entity';

@Controller('player')
export class PlayerController {
    constructor( private readonly playerService: PlayerService){}

    @Get('/getAll')
    findAll(): Player[] {
        return this.playerService.findAll();
    }
}
