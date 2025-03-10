import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { PlayerService } from './player.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { Player } from './entities/player.entity';

@Controller('players')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get()
  findAll(): Player[] {
    return this.playerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Player {
    return this.playerService.findOne(id);
  }

  @Post()
  create(@Body() createPlayerDto: CreatePlayerDto): Player {
    return this.playerService.create(createPlayerDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePlayerDto: UpdatePlayerDto): Player {
    return this.playerService.update(id, updatePlayerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.playerService.remove(id);
  }
}