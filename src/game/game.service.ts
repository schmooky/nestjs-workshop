import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Game } from './entities/game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GameService {
  // Temporary storage until we implement database
  private games: Game[] = [];

  findAll(): Game[] {
    return this.games;
  }

  findOne(id: string): Game {
    const game = this.games.find(game => game.id === id);
    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    return game;
  }

  findByName(name: string): Game {
    const game = this.games.find(game => game.name === name);
    if (!game) {
      throw new NotFoundException(`Game with name ${name} not found`);
    }
    return game;
  }

  create(createGameDto: CreateGameDto): Game {
    // Check for duplicate name
    const existingGame = this.games.find(game => game.name === createGameDto.name);
    if (existingGame) {
      throw new ConflictException(`Game with name ${createGameDto.name} already exists`);
    }
    
    const newGame = new Game({
      id: uuidv4(),
      ...createGameDto,
    });
    
    this.games.push(newGame);
    return newGame;
  }

  update(id: string, updateGameDto: UpdateGameDto): Game {
    const gameIndex = this.games.findIndex(game => game.id === id);
    if (gameIndex === -1) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    
    // Check for duplicate name
    if (updateGameDto.name) {
      const existingGame = this.games.find(game => 
        game.name === updateGameDto.name && game.id !== id
      );
      
      if (existingGame) {
        throw new ConflictException(`Game with name ${updateGameDto.name} already exists`);
      }
    }
    
    const updatedGame = {
      ...this.games[gameIndex],
      ...updateGameDto,
      updatedAt: new Date(),
    };
    
    this.games[gameIndex] = updatedGame;
    return updatedGame;
  }

  remove(id: string): void {
    const gameIndex = this.games.findIndex(game => game.id === id);
    if (gameIndex === -1) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    
    this.games.splice(gameIndex, 1);
  }
}