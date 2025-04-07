import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BURST_GAME_ID,
  BurstSessionResponse,
  BurstSessionResponseSchema,
  BurstSpinRequest,
  BurstSpinResponse,
  BurstSpinResponseSchema,
  SignalRMessageType,
  SessionInfo
} from './burst.types';

@Injectable()
export class BurstService {
  private readonly logger = new Logger(BurstService.name);
  
  // Cache sessions in memory for quick access
  private readonly sessions: Map<string, any> = new Map();

  constructor(private readonly prisma: PrismaService) {
    // Initialize game in the database if it doesn't exist
    this.initializeGame();
  }

  private async initializeGame() {
    try {
      // Check if game exists, create if not
      const gameExists = await this.prisma.game.findUnique({
        where: { id: BURST_GAME_ID }
      });
      
      if (!gameExists) {
        await this.prisma.game.create({
          data: {
            id: BURST_GAME_ID,
            name: 'Burst',
            description: 'A mysterious slot with features',
            enabled: true,
            config: {
              reels: 5,
              rows: 3,
              paylines: 20,
              volatility: 'medium',
              rtp: 96.5
            }
          }
        });
        this.logger.log('Burst game initialized in database');
      }
    } catch (error) {
      this.logger.error(`Failed to initialize Burst game: ${error.message}`);
    }
  }

  /**
   * Process a session request and return session data
   * @param invocationId - The SignalR invocation ID
   * @param sessionId - The session ID from the connection
   * @returns A SignalR completion message with session data
   */
  async handleSession(invocationId: string, sessionId: string): Promise<BurstSessionResponse> {
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
              balance: 6987138.25
            }
          });
        }
        
        // Create new session
        session = await this.prisma.session.create({
          data: {
            id: sessionId,
            playerId: player.id,
            gameId: BURST_GAME_ID,
            data: {}
          },
          include: {
            player: true,
            game: true,
            rounds: true
          }
        });
        
        if (!session) {
          throw new Error('Failed to create session');
        }
        
        // Create initial round for the session
        await this.prisma.round.create({
          data: {
            id: "5eb0361a-e353-4060-800b-14a8e6ca8208",
            sessionId: session.id,
            bet: 1.0,
            win: 0,
            balance: player.balance,
            frame: [
              [7, 7, 7],
              [7, 3, 3],
              [3, 3, 3],
              [7, 7, 5],
              [5, 7, 6]
            ],
            paylines: [],
            features: { stickyWildFeatures: [] },
            data: {
              totalFreespins: 0,
              newFreespins: 0,
              nextGameMode: 1,
              endedUtc: new Date().toISOString(),
              freeRoundCampaign: null
            }
          }
        });
      }
      
      // Construct the response according to the API format
      const response: BurstSessionResponse = {
        type: SignalRMessageType.Completion,
        invocationId,
        result: {
          securityHash: "2C901ABB47834E245660F2996E25DB49DD8074DAD0CE4CB6E9B42F60B7810186",
          id: sessionId,
          gameId: BURST_GAME_ID,
          currency: "eur",
          round: {
            roundId: "5eb0361a-e353-4060-800b-14a8e6ca8208",
            bet: 1.0,
            totalFreespins: 0,
            newFreespins: 0,
            nextGameMode: 1,
            balance: session.player.balance,
            totalWin: 0.0,
            frame: [
              [7, 7, 7],
              [7, 3, 3],
              [3, 3, 3],
              [7, 7, 5],
              [5, 7, 6]
            ],
            paylines: [],
            stickyWildFeatures: [],
            endedUtc: "2024-07-02T06:42:14.449447",
            freeRoundCampaign: null
          },
          gameSettings: {
            allowedBets: [
              0.1, 0.2, 0.5, 1.0, 1.5, 2.0, 3.0,
              5.0, 8.0, 10.0, 20.0, 50.0, 75.0, 100.0
            ],
            autoSpinSettings: {
              availableAutoSpinCounts: [5, 10, 15, 20, 25, 50, 75, 100, 999]
            }
          },
          freeRoundCampaign: null,
          startGameMode: 1,
          isDemo: false
        }
      };

      // Cache session for quick access
      this.sessions.set(sessionId, response.result);
      
      // Validate against schema
      try {
        BurstSessionResponseSchema.parse(response);
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
    request: BurstSpinRequest,
  ): Promise<BurstSpinResponse> {
    this.logger.debug(`Processing spin request for ${sessionId} with bet ${request.bet}`);
    
    try {
      // Get session
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { player: true }
      });
      
      if (!session) {
        throw new NotFoundException(`Session with ID ${sessionId} not found`);
      }
      
      if (!session.isActive) {
        throw new BadRequestException(`Session with ID ${sessionId} is not active`);
      }
      
      // Check if player has enough balance
      if (session.player.balance < request.bet) {
        throw new BadRequestException('Insufficient funds');
      }
      
      // Calculate win amount (in this case we'll use a predefined response)
      const roundId = uuidv4();
      const totalWin = 10.5;
      const newBalance = session.player.balance + totalWin - request.bet;
      
      // Update player balance
      await this.prisma.player.update({
        where: { id: session.player.id },
        data: { balance: newBalance }
      });
      
      // Create round in database
      await this.prisma.round.create({
        data: {
          id: roundId,
          sessionId,
          bet: request.bet,
          win: totalWin,
          balance: newBalance,
          frame: [
            [8, 8, 8],
            [2, 2, 2],
            [3, 3, 3],
            [4, 4, 4],
            [5, 5, 5]
          ],
          paylines: [
            {
              lineId: 1,
              line: [0, 0, 0, 0, 0],
              winType: 2,
              value: 5.0
            },
            {
              lineId: 3,
              line: [1, 1, 1, 1, 1],
              winType: 2,
              value: 3.5
            },
            {
              lineId: 5,
              line: [2, 2, 2, 2, 2],
              winType: 2,
              value: 2.0
            }
          ],
          features: { stickyWildFeatures: [] },
          isCompleted: true,
          data: {
            totalFreespins: 0,
            newFreespins: 0,
            currentGameMode: 1,
            nextGameMode: 1,
            freeRoundCampaign: null
          }
        }
      });
      
      // Create spin response
      const response: BurstSpinResponse = {
        type: SignalRMessageType.Completion,
        invocationId,
        result: {
          roundId: "a97684ff-c4ba-500d-b7d7-bafa36f3052a",
          bet: request.bet,
          totalFreespins: 0,
          newFreespins: 0,
          balance: newBalance,
          totalWin: 10.5,
          currentGameMode: 1,
          nextGameMode: 1,
          frame: [
            [8, 8, 8],
            [2, 2, 2],
            [3, 3, 3],
            [4, 4, 4],
            [5, 5, 5]
          ],
          paylines: [
            {
              lineId: 1,
              line: [0, 0, 0, 0, 0],
              winType: 2,
              value: 5.0
            },
            {
              lineId: 3,
              line: [1, 1, 1, 1, 1],
              winType: 2,
              value: 3.5
            },
            {
              lineId: 5,
              line: [2, 2, 2, 2, 2],
              winType: 2,
              value: 2.0
            }
          ],
          stickyWildFeatures: [],
          freeRoundCampaign: null
        }
      };
      
      // Update cached session
      if (this.sessions.has(sessionId)) {
        const cachedSession = this.sessions.get(sessionId);
        cachedSession.round = response.result;
        this.sessions.set(sessionId, cachedSession);
      }
      
      // Validate against schema
      try {
        BurstSpinResponseSchema.parse(response);
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
          gameId: BURST_GAME_ID,
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
        gameId: BURST_GAME_ID,
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
        gameId: BURST_GAME_ID,
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
}