import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FIREJOKER_GAME_ID,
  FirejokerSessionResponse,
  FirejokerSessionResponseSchema,
  FirejokerSpinRequest,
  FirejokerSpinResponse,
  FirejokerSpinResponseSchema,
  SignalRMessageType,
  SessionInfo,
  GameMode
} from './firejoker.types';
import { FirejokerGameEngine } from './utils/game-engine';
import { DEFAULT_GAME_SETTINGS, DEFAULT_RTP } from './models/reels.config';
import * as crypto from 'crypto';

@Injectable()
export class FirejokerService {
  private readonly logger = new Logger(FirejokerService.name);
  private readonly gameEngine: FirejokerGameEngine;
  
  // Cache sessions in memory for quick access
  private readonly sessions: Map<string, any> = new Map();

  constructor(private readonly prisma: PrismaService) {
    this.gameEngine = new FirejokerGameEngine(DEFAULT_RTP);
    
    // Initialize game in the database if it doesn't exist
    this.initializeGame();
  }

  private async initializeGame() {
    try {
      // Check if game exists, create if not
      const gameExists = await this.prisma.game.findUnique({
        where: { id: FIREJOKER_GAME_ID }
      });
      
      if (!gameExists) {
        await this.prisma.game.create({
          data: {
            id: FIREJOKER_GAME_ID,
            name: 'Fire Joker',
            description: 'A hot slot game with joker wilds and freespins',
            enabled: true,
            config: {
              reels: 5,
              rows: 3,
              paylines: 5,
              volatility: 'medium',
              rtp: 95.4
            }
          }
        });
        this.logger.log('Firejoker game initialized in database');
      }
    } catch (error) {
      this.logger.error(`Failed to initialize Firejoker game: ${error.message}`);
    }
  }
  
  /**
   * Generate a security hash for the session
   * @param sessionId The session ID to hash
   */
  private generateSecurityHash(sessionId: string): string {
    return crypto
      .createHash('sha256')
      .update(`${sessionId}${process.env.SESSION_SECRET || 'firejoker-secret'}`)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Process a session request and return session data
   * @param invocationId - The SignalR invocation ID
   * @param sessionId - The session ID from the connection
   * @returns A SignalR completion message with session data
   */
  async handleSession(invocationId: string, sessionId: string): Promise<FirejokerSessionResponse> {
    this.logger.debug(`Processing session request for ${sessionId}`);
    
    try {
      // Find or create session in DB
      let session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          player: true,
          game: true,
          rounds: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
      
      if (!session) {
        // In a real scenario, you'd have player authentication
        // For demo, we'll just grab a player or create one
        let player = await this.prisma.player.findFirst();
        if (!player) {
          player = await this.prisma.player.create({
            data: {
              name: 'Demo Player',
              email: 'demo@example.com',
              balance: 10000.00
            }
          });
        }
        
        // Create new session
        session = await this.prisma.session.create({
          data: {
            id: sessionId,
            playerId: player.id,
            gameId: FIREJOKER_GAME_ID,
            data: {
              gameMode: GameMode.Regular,
              freeSpinsRemaining: 0
            }
          },
          include: {
            player: true,
            game: true,
            rounds: true
          }
        });
        
        // Create initial round
        const initialFrame = this.gameEngine.generateFrame();
        const initialRoundId = uuidv4();
        
        await this.prisma.round.create({
          data: {
            id: initialRoundId,
            sessionId: session.id,
            bet: 1.0,
            win: 0,
            balance: player.balance,
            frame: initialFrame,
            paylines: [],
            features: { stickyWildFeatures: [] },
            data: {
              totalFreespins: 0,
              newFreespins: 0,
              currentGameMode: GameMode.Regular,
              nextGameMode: GameMode.Regular,
              endedUtc: new Date().toISOString(),
              freeRoundCampaign: null
            }
          }
        });
        
        // Update session with initial round
        session = await this.prisma.session.findUnique({
          where: { id: sessionId },
          include: {
            player: true,
            game: true,
            rounds: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        });
      }
      
      // Prepare current round data
      const currentRound = session!.rounds[0] || {
        id: uuidv4(),
        bet: 1.0,
        win: 0,
        balance: session!.player.balance,
        frame: this.gameEngine.generateFrame(),
        paylines: [],
        features: { stickyWildFeatures: [] },
        data: {
          totalFreespins: 0,
          newFreespins: 0,
          currentGameMode: GameMode.Regular,
          nextGameMode: GameMode.Regular
        }
      };
      
      // Ensure we have the necessary data properties
      const roundData = currentRound.data || {};
      
      // Construct the response according to the API format
      const response: FirejokerSessionResponse = {
        type: SignalRMessageType.Completion,
        invocationId,
        result: {
          securityHash: this.generateSecurityHash(sessionId),
          id: sessionId,
          gameId: FIREJOKER_GAME_ID,
          currency: "eur",
          round: {
            roundId: currentRound.id,
            bet: currentRound.bet,
            totalFreespins: (roundData as any).totalFreespins || 0,
            newFreespins: (roundData as any).newFreespins || 0,
            balance: (session as any).player.balance,
            totalWin: currentRound.win || 0,
            currentGameMode: (roundData as any).currentGameMode || GameMode.Regular,
            nextGameMode: (roundData as any).nextGameMode || GameMode.Regular,
            frame: (currentRound.frame || this.gameEngine.generateFrame()) as any,
            paylines: (currentRound.paylines || []) as any,
            endedUtc: (roundData as any).endedUtc || new Date().toISOString(),
            freeRoundCampaign: null
          },
          gameSettings: DEFAULT_GAME_SETTINGS,
          freeRoundCampaign: null,
          startGameMode: (roundData as any).currentGameMode || GameMode.Regular,
          isDemo: false
        }
      };

      // Cache session for quick access
      this.sessions.set(sessionId, response.result);
      
      // Validate against schema
      try {
        FirejokerSessionResponseSchema.parse(response);
        return response;
      } catch (error) {
        this.logger.error(`Session response validation failed: ${error.message}`);
        throw new Error(`Invalid session data: ${error.message}`);
      }
    } catch (error) {
      this.logger.error(`Error handling session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a spin request and return spin results
   * @param invocationId - The SignalR invocation ID
   * @param sessionId - The session ID from the connection
   * @param request - The spin request data
   * @returns A SignalR completion message with spin results
   */
  async handleSpin(
    invocationId: string, 
    sessionId: string,
    request: FirejokerSpinRequest,
  ): Promise<FirejokerSpinResponse> {
    this.logger.debug(`Processing spin request for ${sessionId} with bet ${request.bet}`);
    
    try {
      // Get session
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          player: true,
          rounds: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
      
      if (!session) {
        throw new NotFoundException(`Session with ID ${sessionId} not found`);
      }
      
      if (!session.isActive) {
        throw new BadRequestException(`Session with ID ${sessionId} is not active`);
      }
      
      // Get current game state
      const sessionData : {gameMode?: GameMode, freeSpinsRemaining?: number} = (session.data || {}) as any;
      const currentGameMode = sessionData.gameMode || GameMode.Regular;
      const freeSpinsRemaining = sessionData.freeSpinsRemaining || 0;
      
      // Check if player has enough balance
      const betAmount = currentGameMode === GameMode.FreeSpins ? 0 : request.bet;
      if (session.player.balance < betAmount) {
        throw new BadRequestException('Insufficient funds');
      }
      
      // Make the spin using our game engine
      const round = this.gameEngine.spin(
        request.bet,
        session.player.balance,
        currentGameMode,
        freeSpinsRemaining
      );
      
      // Update player balance
      await this.prisma.player.update({
        where: { id: session.player.id },
        data: { balance: round.balance }
      });
      
      // Update session state
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          data: {
            gameMode: round.nextGameMode,
            freeSpinsRemaining: round.freeSpinsRemaining || 0
          }
        }
      });
      
      // Create round in database
      await this.prisma.round.create({
        data: {
          id: round.roundId,
          sessionId,
          bet: round.bet,
          win: round.totalWin,
          balance: round.balance,
          frame: round.frame,
          paylines: round.paylines,
          features: { stickyWildFeatures: [] },
          isCompleted: true,
          data: {
            totalFreespins: round.totalFreespins,
            newFreespins: round.newFreespins,
            currentGameMode: round.currentGameMode,
            nextGameMode: round.nextGameMode,
            freeRoundCampaign: null,
            endedUtc: round.endedUtc
          }
        }
      });
      
      // Create spin response
      const response: FirejokerSpinResponse = {
        type: SignalRMessageType.Completion,
        invocationId,
        result: round
      };
      
      // Update cached session
      if (this.sessions.has(sessionId)) {
        const cachedSession = this.sessions.get(sessionId);
        cachedSession.round = round;
        this.sessions.set(sessionId, cachedSession);
      }
      
      // Validate against schema
      try {
        FirejokerSpinResponseSchema.parse(response);
        return response;
      } catch (error) {
        this.logger.error(`Spin response validation failed: ${error.message}`);
        throw new Error(`Invalid spin data: ${error.message}`);
      }
    } catch (error) {
      this.logger.error(`Error handling spin: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all active sessions for this game
   * @returns Array of active session information
   */
  async getActiveSessions(): Promise<SessionInfo[]> {
    try {
      const sessions = await this.prisma.session.findMany({
        where: {
          gameId: FIREJOKER_GAME_ID,
          isActive: true
        },
        include: {
          player: true,
          rounds: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
      
      return sessions.map(session => ({
        sessionId: session.id,
        gameId: FIREJOKER_GAME_ID,
        currency: 'eur',
        balance: session.player.balance,
        lastActive: session.updatedAt,
        bet: session.rounds[0]?.bet,
        totalWin: session.rounds[0]?.win
      }));
    } catch (error) {
      this.logger.error(`Error getting active sessions: ${error.message}`);
      return [];
    }
  }

  /**
   * Get details for a specific session
   * @param sessionId - The session ID to retrieve
   * @returns Session information or null if not found
   */
  async getSession(sessionId: string): Promise<SessionInfo | null> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          player: true,
          rounds: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
      
      if (!session) {
        return null;
      }
      
      return {
        sessionId: session.id,
        gameId: FIREJOKER_GAME_ID,
        currency: 'eur',
        balance: session.player.balance,
        lastActive: session.updatedAt,
        bet: session.rounds[0]?.bet,
        totalWin: session.rounds[0]?.win
      };
    } catch (error) {
      this.logger.error(`Error getting session details: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Calculate RTP for testing purposes
   * @param simulations Number of spins to simulate
   * @param bet Bet amount to use
   * @returns RTP calculation results
   */
  async calculateRTP(simulations: number = 10000, bet: number = 1) {
    const calculator = new FirejokerGameEngine(DEFAULT_RTP);
    return calculator.spin(bet, 1000000, GameMode.Regular, 0);
  }
}