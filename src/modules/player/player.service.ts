import { Injectable, NotFoundException } from '@nestjs/common';
import { Player } from './entities/player.entity';

@Injectable()
export class PlayerService {

    private players: Player[] = [];

    findAll(): Player[]{
        return this.players;
    }

    findOne(id: string): Player | never {
        const player = this.players.find(player=>player.id === id)

        if(!player) {
            throw new NotFoundException(`Player with ID ${id} not found`)
        }

        return player;
    }
}
