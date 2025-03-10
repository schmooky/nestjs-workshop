import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Session } from './entities/session.entity';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  findAll(): Session[] {
    return this.sessionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Session {
    return this.sessionService.findOne(id);
  }

  @Get('player/:playerId')
  findByPlayer(@Param('playerId') playerId: string): Session[] {
    return this.sessionService.findByPlayer(playerId);
  }

  @Get('player/:playerId/active')
  findActiveByPlayer(@Param('playerId') playerId: string): Session[] {
    return this.sessionService.findActiveByPlayer(playerId);
  }

  @Post()
  create(@Body() createSessionDto: CreateSessionDto): Session {
    return this.sessionService.create(createSessionDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto): Session {
    return this.sessionService.update(id, updateSessionDto);
  }

  @Put(':id/end')
  endSession(@Param('id') id: string): Session {
    return this.sessionService.endSession(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.sessionService.remove(id);
  }
}