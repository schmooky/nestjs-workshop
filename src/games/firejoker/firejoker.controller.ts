import { Controller, Get, Param, Logger, Query } from '@nestjs/common';
import { FirejokerService } from './firejoker.service';
import { FIREJOKER_GAME_ID } from './firejoker.types';

@Controller('firejoker')
export class FirejokerController {
  private readonly logger = new Logger(FirejokerController.name);
  
  constructor(private readonly firejokerService: FirejokerService) {}
  
  /**
   * Get a list of all active sessions
   * @returns An array of active sessions
   */
  @Get('sessions')
  async getActiveSessions() {
    this.logger.debug('Getting all active sessions');
    return await this.firejokerService.getActiveSessions();
  }
  
  /**
   * Get details for a specific session
   * @param id - The session ID
   * @returns Session details or error
   */
  @Get('sessions/:id')
  async getSessionDetails(@Param('id') id: string) {
    this.logger.debug(`Getting session details for ID: ${id}`);
    
    const session = await this.firejokerService.getSession(id);
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
    return { id: FIREJOKER_GAME_ID };
  }
  
  /**
   * Calculate RTP for testing purposes
   * This endpoint is for development and testing only
   * @param simulations Number of simulations to run
   * @param bet Bet amount to use
   * @returns RTP calculation results
   */
  @Get('test/rtp')
  async testRTP(
    @Query('simulations') simulations: string = '1000', 
    @Query('bet') bet: string = '1'
  ) {
    this.logger.debug(`Testing RTP with ${simulations} simulations and bet ${bet}`);
    
    return await this.firejokerService.calculateRTP(
      parseInt(simulations), 
      parseFloat(bet)
    );
  }
}