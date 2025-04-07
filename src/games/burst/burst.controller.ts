import { Controller, Get, Param, Logger } from '@nestjs/common';
import { BurstService } from './burst.service';
import { BURST_GAME_ID } from './burst.types';

@Controller('burst')
export class BurstController {
  private readonly logger = new Logger(BurstController.name);
  
  constructor(private readonly BurstService: BurstService) {}
  
  /**
   * Get a list of all active sessions
   * @returns An array of active sessions
   */
  @Get('sessions')
  async getActiveSessions() {
    this.logger.debug('Getting all active sessions');
    return await this.BurstService.getActiveSessions();
  }
  
  /**
   * Get details for a specific session
   * @param id - The session ID
   * @returns Session details or error
   */
  @Get('sessions/:id')
  async getSessionDetails(@Param('id') id: string) {
    this.logger.debug(`Getting session details for ID: ${id}`);
    
    const session = await this.BurstService.getSession(id);
    if (!session) {
      return { error: 'Session not found' };
    }
    
    return session;
  }
  
  /**
   * Get game ID
   * @returns The game ID
   */
  @Get('id')
  getGameId() {
    return { id: BURST_GAME_ID };
  }
}