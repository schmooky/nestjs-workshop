import { Injectable, NotFoundException } from '@nestjs/common';
import { Player } from './entities/player.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PlayerService {
  // Temporary storage until we implement database
  private players: Player[] = [];

  findAll(): Player[] {
    return this.players;
  }

  findOne(id: string): Player {
    const player = this.players.find(player => player.id === id);
    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }
    return player;
  }

  create(createPlayerDto: CreatePlayerDto): Player {
    const newPlayer = new Player({
      id: uuidv4(),
      name: createPlayerDto.name,
      email: createPlayerDto.email,
      balance: createPlayerDto.initialBalance || 1000,
    });
    
    this.players.push(newPlayer);
    return newPlayer;
  }

  update(id: string, updatePlayerDto: UpdatePlayerDto): Player {
    const playerIndex = this.players.findIndex(player => player.id === id);
    if (playerIndex === -1) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }
    
    const updatedPlayer = {
      ...this.players[playerIndex],
      ...updatePlayerDto,
      updatedAt: new Date(),
    };
    
    this.players[playerIndex] = updatedPlayer;
    return updatedPlayer;
  }

  remove(id: string): void {
    const playerIndex = this.players.findIndex(player => player.id === id);
    if (playerIndex === -1) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }
    
    this.players.splice(playerIndex, 1);
  }
}