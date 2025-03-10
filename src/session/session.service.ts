import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Session } from './entities/session.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { PlayerService } from '../player/player.service';
import { GameService } from '../game/game.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionService {
  // Temporary storage until we implement database
  private sessions: Session[] = [];

  constructor(
    private readonly playerService: PlayerService,
    private readonly gameService: GameService
  ) {}

  findAll(): Session[] {
    return this.sessions;
  }

  findByPlayer(playerId: string): Session[] {
    // Verify player exists
    this.playerService.findOne(playerId);
    
    return this.sessions.filter(session => session.playerId === playerId);
  }

  findActiveByPlayer(playerId: string): Session[] {
    // Verify player exists
    this.playerService.findOne(playerId);
    
    return this.sessions.filter(
      session => session.playerId === playerId && session.isActive
    );
  }

  findOne(id: string): Session {
    const session = this.sessions.find(session => session.id === id);
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    return session;
  }

  create(createSessionDto: CreateSessionDto): Session {
    // Verify player exists
    this.playerService.findOne(createSessionDto.playerId);
    
    // Verify game exists and is enabled
    const game = this.gameService.findOne(createSessionDto.gameId);
    
    if (!game.enabled) {
      throw new BadRequestException(`Game with ID ${createSessionDto.gameId} is not enabled`);
    }
    
    const newSession = new Session({
      id: uuidv4(),
      playerId: createSessionDto.playerId,
      gameId: createSessionDto.gameId,
      data: createSessionDto.initialData || {},
    });
    
    this.sessions.push(newSession);
    return newSession;
  }

  update(id: string, updateSessionDto: UpdateSessionDto): Session {
    const sessionIndex = this.sessions.findIndex(session => session.id === id);
    if (sessionIndex === -1) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    
    const session = this.sessions[sessionIndex];
    
    // Check if session is active
    if (!session.isActive) {
      throw new BadRequestException(`Session with ID ${id} is not active`);
    }
    
    const updatedSession = {
      ...session,
      data: {
        ...session.data,
        ...updateSessionDto.data
      },
      updatedAt: new Date(),
    };
    
    this.sessions[sessionIndex] = updatedSession;
    return updatedSession;
  }

  endSession(id: string): Session {
    const sessionIndex = this.sessions.findIndex(session => session.id === id);
    if (sessionIndex === -1) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    
    const session = this.sessions[sessionIndex];
    
    // Check if session is already closed
    if (!session.isActive) {
      throw new BadRequestException(`Session with ID ${id} is already closed`);
    }
    
    const updatedSession = {
      ...session,
      isActive: false,
      endTime: new Date(),
      updatedAt: new Date(),
    };
    
    this.sessions[sessionIndex] = updatedSession;
    return updatedSession;
  }

  remove(id: string): void {
    const sessionIndex = this.sessions.findIndex(session => session.id === id);
    if (sessionIndex === -1) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    
    this.sessions.splice(sessionIndex, 1);
  }
}