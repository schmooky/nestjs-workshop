Path: app.controller.spec.ts
```
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});

```

---

Path: app.controller.ts
```
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

```

---

Path: app.module.ts
```
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlayerModule } from './player/player.module';
import { WalletModule } from './wallet/wallet.module';
import { GameModule } from './game/game.module';
import { SessionModule } from './session/session.module';
import { PrismaModule } from './prisma/prisma.module';
import { BurstModule } from './games/burst/burst.module';

@Module({
  imports: [
    PrismaModule,
    PlayerModule,
    WalletModule,
    GameModule,
    SessionModule,
    BurstModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

Path: app.service.ts
```
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}

```

---

Path: game\dto\create-game.dto.ts
```
export class CreateGameDto {
    name: string;
    description?: string;
    config?: any;
    enabled?: boolean;
  }
```

---

Path: game\dto\update-game.dto.ts
```
export class UpdateGameDto {
    name?: string;
    description?: string;
    config?: any;
    enabled?: boolean;
  }
```

---

Path: game\entities\game.entity.ts
```
export class Game {
  id: string;
  name: string;
  description?: string;
  config?: any;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Game>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
    this.enabled = this.enabled !== undefined ? this.enabled : true;
  }
}
```

---

Path: game\game.controller.ts
```
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
```

---

Path: game\game.module.ts
```
import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';

@Module({
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService]
})
export class GameModule {}
```

---

Path: game\game.service.ts
```
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
```

---

Path: games\burst\burst.controller.ts
```
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
```

---

Path: games\burst\burst.gateway.ts
```
import { Logger, OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as WebSocket from 'ws';
import { Server } from 'ws';
import { SignalRMessageType } from './burst.types';
import { BurstService } from './burst.service';
import { v4 as uuidv4 } from 'uuid';
import {Request} from 'express';

@WebSocketGateway({
  path: '/burst/slot',
})
export class BurstGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  private readonly logger = new Logger(BurstGateway.name);
  
  @WebSocketServer()
  server: Server;
  
  constructor(private readonly BurstService: BurstService) {}
  
  onModuleInit() {
    this.logger.log('Burst WebSocket Gateway initialized');
  }
  
  async handleConnection(client: WebSocket, request: Request) {
    try {
      // Extract session ID from request URL or generate a new one
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      let sessionId = url.searchParams.get('sessionId');
      
      if (!sessionId) {
        sessionId = uuidv4();
        this.logger.debug(`No sessionId provided, generated new sessionId: ${sessionId}`);
      }
      
      // Store sessionId on client for later reference
      (client as any).sessionId = sessionId;
      
      this.logger.log(`Client connected with sessionId: ${sessionId}`);
      
      client.on('message', async (data: WebSocket.Data) => {
        try {
          // Convert to string and remove the Information Separator Two (U+001E) character
          let message = data.toString();
          message = message.replace(/\u001E/g, '');
          
          // Parse the cleaned message
          const parsedData = JSON.parse(message);
          
          if (parsedData.protocol && parsedData.version) {
            // Handle handshake
            if (parsedData.protocol === 'json' && parsedData.version === 1) {
              client.send(this.formatSignalRResponse({}));
              this.logger.debug(`Handshake successful for session ${sessionId}`);
            } else {
              client.send(JSON.stringify({ error: 'Unsupported protocol or version' }));
              client.close();
            }
          } else if (parsedData.type === SignalRMessageType.Invocation) {
            // Process invocation
            await this.processInvocation(client, parsedData, sessionId);
          }
        } catch (error) {
          this.logger.error(`Error processing message: ${error.message}`);
          client.close();
        }
      });
    } catch (error) {
      this.logger.error(`Error in handleConnection: ${error.message}`);
      client.close();
    }
  }
  
  handleDisconnect(client: WebSocket) {
    const sessionId = (client as any).sessionId || 'unknown';
    this.logger.log(`Client disconnected with sessionId: ${sessionId}`);
  }
  
  /**
   * Formats a response according to SignalR protocol standards
   * by appending the Information Separator Two character
   */
  private formatSignalRResponse(data: any): string {
    return JSON.stringify(data) + '\u001E';
  }
  
  private async processInvocation(client: WebSocket, invocation: any, sessionId: string) {
    this.logger.debug(`Processing invocation target=${invocation.target}, id=${invocation.invocationId}`);
    
    try {
      let response;
      
      switch (invocation.target) {
        case 'session':
          response = await this.BurstService.handleSession(
            invocation.invocationId,
            sessionId
          );
          break;
          
        case 'spin':
          const spinRequest = invocation.arguments[0];
          response = await this.BurstService.handleSpin(
            invocation.invocationId,
            sessionId,
            spinRequest
          );
          break;
          
        default:
          this.logger.warn(`Unknown invocation target: ${invocation.target}`);
          response = {
            type: SignalRMessageType.Completion,
            invocationId: invocation.invocationId,
            error: `Unknown target: ${invocation.target}`,
          };
      }
      
      client.send(this.formatSignalRResponse(response));
    } catch (error) {
      this.logger.error(`Error processing invocation: ${error.message}`);
      
      const errorResponse = {
        type: SignalRMessageType.Completion,
        invocationId: invocation.invocationId,
        error: error.message,
      };
      
      client.send(this.formatSignalRResponse(errorResponse));
    }
  }
}
```

---

Path: games\burst\burst.module.ts
```
import { Module } from '@nestjs/common';
import { BurstController } from './burst.controller';
import { BurstGateway } from './burst.gateway';
import { BurstService } from './burst.service';

@Module({
  controllers: [BurstController],
  providers: [BurstService, BurstGateway],
  exports: [BurstService]
})
export class BurstModule {}
```

---

Path: games\burst\burst.service.ts
```
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
```

---

Path: games\burst\burst.types.ts
```
import { z } from 'zod';

// Game constants
export const BURST_GAME_ID = 'fe418252-3db9-4ab9-8151-e848da2dd83e';

// Enum for SignalR message types
export enum SignalRMessageType {
  Invocation = 1,
  StreamItem = 2,
  Completion = 3,
  StreamInvocation = 4,
  CancelInvocation = 5,
  Ping = 6,
  Close = 7,
}

// Schemas for Burst API structures
export const PaylineSchema = z.object({
  lineId: z.number(),
  line: z.array(z.number().nullable()),
  winType: z.number(),
  value: z.number(),
});

export const StickyWildFeatureSchema = z.object({
  symbolId: z.number(),
  reel: z.number(),
  respinsLeft: z.number(),
});

export const FreeRoundCampaignSchema = z.object({
  id: z.string(),
  spinsLeft: z.number(),
  validUntil: z.string(),
}).nullable();

export const BurstRoundSchema = z.object({
  roundId: z.string(),
  bet: z.number(),
  totalFreespins: z.number(),
  newFreespins: z.number(),
  balance: z.number(),
  totalWin: z.number(),
  currentGameMode: z.number().optional(),
  nextGameMode: z.number(),
  frame: z.array(z.array(z.number())),
  paylines: z.array(PaylineSchema),
  stickyWildFeatures: z.array(StickyWildFeatureSchema),
  freeRoundCampaign: FreeRoundCampaignSchema,
  endedUtc: z.string().optional(),
});

export const GameSettingsSchema = z.object({
  allowedBets: z.array(z.number()),
  autoSpinSettings: z.object({
    availableAutoSpinCounts: z.array(z.number()),
  }),
});

export const BurstSessionSchema = z.object({
  securityHash: z.string(),
  id: z.string(),
  gameId: z.string(),
  currency: z.string(),
  round: BurstRoundSchema,
  gameSettings: GameSettingsSchema,
  freeRoundCampaign: FreeRoundCampaignSchema,
  startGameMode: z.number(),
  isDemo: z.boolean(),
});

export const BurstSpinRequestSchema = z.object({
  bet: z.number(),
});

export const BurstSpinResponseSchema = z.object({
  type: z.number(),
  invocationId: z.string(),
  result: BurstRoundSchema,
});

export const BurstSessionResponseSchema = z.object({
  type: z.number(),
  invocationId: z.string(),
  result: BurstSessionSchema,
});

// Export types
export type Payline = z.infer<typeof PaylineSchema>;
export type StickyWildFeature = z.infer<typeof StickyWildFeatureSchema>;
export type FreeRoundCampaign = z.infer<typeof FreeRoundCampaignSchema>;
export type BurstRound = z.infer<typeof BurstRoundSchema>;
export type GameSettings = z.infer<typeof GameSettingsSchema>;
export type BurstSession = z.infer<typeof BurstSessionSchema>;
export type BurstSpinRequest = z.infer<typeof BurstSpinRequestSchema>;
export type BurstSpinResponse = z.infer<typeof BurstSpinResponseSchema>;
export type BurstSessionResponse = z.infer<typeof BurstSessionResponseSchema>;

// SessionInfo for admin panel
export interface SessionInfo {
  sessionId: string;
  gameId: string;
  currency: string;
  balance: number;
  lastActive: Date;
  bet?: number;
  totalWin?: number;
}
```

---

Path: main.ts
```
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

```

---

Path: player\dto\create-player.dto.ts
```
export class CreatePlayerDto {
  name: string;
  email: string;
  initialBalance?: number;
}
```

---

Path: player\dto\update-player.dto.ts
```
export class UpdatePlayerDto {
    name?: string;
    email?: string;
  }
```

---

Path: player\entities\player.entity.ts
```
export class Player {
  id: string;
  name: string;
  email: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Player>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }
}
```

---

Path: player\player.controller.spec.ts
```
import { Test, TestingModule } from '@nestjs/testing';
import { PlayerController } from './player.controller';

describe('PlayerController', () => {
  let controller: PlayerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerController],
    }).compile();

    controller = module.get<PlayerController>(PlayerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

```

---

Path: player\player.controller.ts
```
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
```

---

Path: player\player.module.ts
```
import { Module } from '@nestjs/common';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';

@Module({
  controllers: [PlayerController],
  providers: [PlayerService],
  exports: [PlayerService]
})
export class PlayerModule {}
```

---

Path: player\player.service.spec.ts
```
import { Test, TestingModule } from '@nestjs/testing';
import { PlayerService } from './player.service';

describe('PlayerService', () => {
  let service: PlayerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerService],
    }).compile();

    service = module.get<PlayerService>(PlayerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

```

---

Path: player\player.service.ts
```
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
```

---

Path: prisma\prisma.module.ts
```
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

Path: prisma\prisma.service.ts
```
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

---

Path: session\dto\create-session.dto.ts
```
export class CreateSessionDto {
  playerId: string;
  gameId: string;
  initialData?: any;
}
```

---

Path: session\dto\update-session.dto.ts
```
export class UpdateSessionDto {
  data?: any;
}
```

---

Path: session\entities\session.entity.ts
```
export class Session {
  id: string;
  playerId: string;
  gameId: string;
  isActive: boolean;
  data?: any;
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Session>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
    this.startTime = this.startTime || new Date();
    this.isActive = this.isActive !== undefined ? this.isActive : true;
  }
}
```

---

Path: session\session.controller.ts
```
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
```

---

Path: session\session.guard.ts
```
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly logger = new Logger(SessionGuard.name);
  
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const request = client.request;
    
    if (!request || !request.url) {
      this.logger.warn('Missing request or URL in SessionGuard');
      return false;
    }
    
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      this.logger.warn('No sessionId provided in URL');
      return false;
    }
    
    // Validate session ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      this.logger.warn(`Invalid sessionId format: ${sessionId}`);
      return false;
    }
    
    return true;
  }
}
```

---

Path: session\session.module.ts
```
import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { PlayerModule } from '../player/player.module';
import { GameModule } from '../game/game.module';

@Module({
  imports: [PlayerModule, GameModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService]
})
export class SessionModule {}
```

---

Path: session\session.service.ts
```
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
```

---

Path: wallet\dto\create-wallet.dto.ts
```
export class CreateWalletDto {
  playerId: string;
  currency: string;
  initialBalance?: number;
}
```

---

Path: wallet\dto\update-balance.dto.ts
```
export class UpdateBalanceDto {
  amount: number;
}
```

---

Path: wallet\entities\wallet.entity.ts
```
export class Wallet {
  id: string;
  playerId: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Wallet>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }
}
```

---

Path: wallet\wallet.controller.ts
```
import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { Wallet } from './entities/wallet.entity';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  findAll(): Wallet[] {
    return this.walletService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Wallet {
    return this.walletService.findOne(id);
  }

  @Get('player/:playerId')
  findByPlayer(@Param('playerId') playerId: string): Wallet[] {
    return this.walletService.findByPlayer(playerId);
  }

  @Post()
  create(@Body() createWalletDto: CreateWalletDto): Wallet {
    return this.walletService.create(createWalletDto);
  }

  @Put(':id/balance')
  updateBalance(
    @Param('id') id: string,
    @Body() updateBalanceDto: UpdateBalanceDto
  ): Wallet {
    return this.walletService.updateBalance(id, updateBalanceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.walletService.remove(id);
  }
}
```

---

Path: wallet\wallet.module.ts
```
import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PlayerModule } from '../player/player.module';

@Module({
  imports: [PlayerModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService]
})
export class WalletModule {}
```

---

Path: wallet\wallet.service.ts
```
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Wallet } from './entities/wallet.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { PlayerService } from '../player/player.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  // Temporary storage until we implement database
  private wallets: Wallet[] = [];

  constructor(private readonly playerService: PlayerService) {}

  findAll(): Wallet[] {
    return this.wallets;
  }

  findByPlayer(playerId: string): Wallet[] {
    // Verify player exists
    this.playerService.findOne(playerId);
    
    return this.wallets.filter(wallet => wallet.playerId === playerId);
  }

  findOne(id: string): Wallet {
    const wallet = this.wallets.find(wallet => wallet.id === id);
    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }
    return wallet;
  }

  create(createWalletDto: CreateWalletDto): Wallet {
    // Verify player exists
    this.playerService.findOne(createWalletDto.playerId);
    
    // Check if a wallet with this currency already exists for this player
    const existingWallet = this.wallets.find(
      wallet => wallet.playerId === createWalletDto.playerId && 
                wallet.currency === createWalletDto.currency
    );
    
    if (existingWallet) {
      throw new ConflictException(
        `Wallet with currency ${createWalletDto.currency} already exists for player ${createWalletDto.playerId}`
      );
    }
    
    const newWallet = new Wallet({
      id: uuidv4(),
      playerId: createWalletDto.playerId,
      currency: createWalletDto.currency,
      balance: createWalletDto.initialBalance || 0,
    });
    
    this.wallets.push(newWallet);
    return newWallet;
  }

  updateBalance(id: string, updateBalanceDto: UpdateBalanceDto): Wallet {
    const walletIndex = this.wallets.findIndex(wallet => wallet.id === id);
    if (walletIndex === -1) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }
    
    const wallet = this.wallets[walletIndex];
    const newBalance = wallet.balance + updateBalanceDto.amount;
    
    if (newBalance < 0) {
      throw new ConflictException(`Insufficient funds in wallet ${id}`);
    }
    
    const updatedWallet = {
      ...wallet,
      balance: newBalance,
      updatedAt: new Date(),
    };
    
    this.wallets[walletIndex] = updatedWallet;
    return updatedWallet;
  }

  remove(id: string): void {
    const walletIndex = this.wallets.findIndex(wallet => wallet.id === id);
    if (walletIndex === -1) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }
    
    this.wallets.splice(walletIndex, 1);
  }
}
```

---

