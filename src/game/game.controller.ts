import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Game } from './entities/game.entity';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  findAll(): Game[] {
    return this.gameService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Game {
    return this.gameService.findOne(id);
  }

  @Get('by-name/:name')
  findByName(@Param('name') name: string): Game {
    return this.gameService.findByName(name);
  }

  @Post()
  create(@Body() createGameDto: CreateGameDto): Game {
    return this.gameService.create(createGameDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateGameDto: UpdateGameDto): Game {
    return this.gameService.update(id, updateGameDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.gameService.remove(id);
  }
}