Path: admin\admin.controller.ts
```
import { Controller, Get, Param, Render, Res } from '@nestjs/common';
import { Response } from 'express';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Render('admin/dashboard')
  getDashboard() {
    const sessionGroups = this.adminService.getAllSessions();
    const totalSessions = sessionGroups.reduce(
      (sum, group) => sum + group.activeCount, 0
    );
    
    return {
      title: 'Admin Dashboard',
      sessionGroups,
      totalSessions,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('sessions/:gameId/:sessionId')
  @Render('admin/session-details')
  getSessionDetails(
    @Param('gameId') gameId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const session = this.adminService.getGameSession(gameId, sessionId);
    
    return {
      title: 'Session Details',
      session,
      gameId,
      sessionId,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('sessions')
  getSessionsApi() {
    return this.adminService.getAllSessions();
  }

  @Get('sessions/:gameId/:sessionId')
  getSessionApi(
    @Param('gameId') gameId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.adminService.getGameSession(gameId, sessionId);
  }

  @Get('styles.css')
  getStyles(@Res() res: Response) {
    res.type('text/css').send(`
      /* Basic CSS for admin panel */
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      
      header {
        background-color: #2c3e50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      h1, h2, h3 {
        margin-top: 0;
      }
      
      .summary {
        background-color: #ecf0f1;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
      }
      
      .summary-item {
        text-align: center;
      }
      
      .game-container {
        margin-bottom: 30px;
        border: 1px solid #ddd;
        border-radius: 5px;
        overflow: hidden;
      }
      
      .game-header {
        background-color: #34495e;
        color: white;
        padding: 10px 15px;
        display: flex;
        justify-content: space-between;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
      }
      
      th, td {
        text-align: left;
        padding: 10px;
        border-bottom: 1px solid #ddd;
      }
      
      tr:nth-child(even) {
        background-color: #f2f2f2;
      }
      
      th {
        background-color: #3498db;
        color: white;
      }
      
      .currency {
        text-align: right;
      }
      
      .session-link {
        color: #2980b9;
        text-decoration: none;
      }
      
      .session-link:hover {
        text-decoration: underline;
      }
      
      .refresh-button {
        background-color: #3498db;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .refresh-button:hover {
        background-color: #2980b9;
      }
      
      .empty-message {
        padding: 20px;
        text-align: center;
        color: #7f8c8d;
      }
      
      footer {
        margin-top: 40px;
        text-align: center;
        color: #7f8c8d;
        font-size: 14px;
      }
    `);
  }
}
```

---

Path: admin\admin.module.ts
```
import { Module } from '@nestjs/common';
import { MoonlightBurstModule } from '../games/moonlight-burst/moonlight-burst.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [MoonlightBurstModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
```

---

Path: admin\admin.service.ts
```
// src/admin/admin.service.ts
import { Injectable } from '@nestjs/common';
import { MoonlightBurstService } from '../games/moonlight-burst/moonlight-burst.service';

export interface SessionInfo {
  sessionId: string;
  gameId: string;
  currency: string;
  balance: number;
  lastActive: Date;
  bet?: number;
  totalWin?: number;
}

export interface GameSessionsGroup {
  gameId: string;
  displayName: string;
  sessions: SessionInfo[];
  activeCount: number;
}

@Injectable()
export class AdminService {
  private readonly gameServices: { [key: string]: any } = {};
  private readonly gameDisplayNames: { [key: string]: string } = {
    'moonlight-burst': 'Moonlight Burst',
    // Add other games here as they're implemented
  };

  constructor(
    private readonly moonlightBurstService: MoonlightBurstService,
  ) {
    // Register all game services
    this.gameServices['moonlight-burst'] = moonlightBurstService;
    // Add other games here as they're implemented
  }

  getAllSessions(): GameSessionsGroup[] {
    const sessionGroups: GameSessionsGroup[] = [];

    // Get sessions from each game service
    for (const [gameId, service] of Object.entries(this.gameServices)) {
      if (service && typeof service.getActiveSessions === 'function') {
        const sessions = service.getActiveSessions();
        
        // Calculate totals
        const activeCount = sessions.length;

        sessionGroups.push({
          gameId,
          displayName: this.gameDisplayNames[gameId] || gameId,
          sessions,
          activeCount,
        });
      }
    }

    return sessionGroups;
  }

  getGameSession(gameId: string, sessionId: string): SessionInfo | null {
    const service = this.gameServices[gameId];
    if (service && typeof service.getSession === 'function') {
      return service.getSession(sessionId);
    }
    return null;
  }
}
```

---

Path: app.module.ts
```
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { MoonlightBurstModule } from './games/moonlight-burst/moonlight-burst.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { SirensFortuneModule } from './games/sirens-fortune/sirens-fortune.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    LoggerModule,
    MoonlightBurstModule,
    SirensFortuneModule
  ],
})
export class AppModule {}

```

---

Path: common\guards\session.guard.ts
```
// src/common/guards/session.guard.ts
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly logger = new Logger(SessionGuard.name);
  
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    
    // Access request info directly from the client
    if (!client || !client.upgradeReq || !client.upgradeReq.url) {
      this.logger.warn('Missing client or URL in SessionGuard');
      return false;
    }
    
    const url = new URL(client.upgradeReq.url, `http://${client.upgradeReq.headers.host || 'localhost'}`);
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

Path: common\interceptors\websocket.interceptor.ts
```
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class WebSocketInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WebSocketInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();
    
    const now = Date.now();
    const sessionId = client.handshake.query.sessionId;
    
    this.logger.debug(`Request [${sessionId}]: ${JSON.stringify(data)}`);
    
    return next.handle().pipe(
      tap(response => {
        const delay = Date.now() - now;
        this.logger.debug(`Response [${sessionId}] (${delay}ms): ${JSON.stringify(response)}`);
      }),
    );
  }
}
```

---

Path: common\types\base-game.types.ts
```
// src/common/types/base-game.types.ts
import { z } from 'zod';

// Base schema for paylines
export const BasePaylineSchema = z.object({
  lineId: z.number(),
  line: z.array(z.number().nullable()),
  winType: z.number(),
  value: z.number(),
});

// Base schema for sticky wild features
export const BaseStickyWildFeatureSchema = z.object({
  symbolId: z.number(),
  reel: z.number(),
  respinsLeft: z.number(),
});

// Base schema for free round campaigns
export const BaseFreeRoundCampaignSchema = z.object({
  id: z.string(),
  spinsLeft: z.number(),
  validUntil: z.string(),
}).nullable();

// Base schema for round data (common to all games)
export const BaseRoundSchema = z.object({
  roundId: z.string(),
  bet: z.number(),
  totalFreespins: z.number(),
  newFreespins: z.number(),
  balance: z.number(),
  totalWin: z.number(),
  currentGameMode: z.number().optional(),
  nextGameMode: z.number(),
  frame: z.array(z.array(z.number())),
  paylines: z.array(BasePaylineSchema),
  stickyWildFeatures: z.array(BaseStickyWildFeatureSchema),
  freeRoundCampaign: BaseFreeRoundCampaignSchema,
  endedUtc: z.string().optional(),
});

// Base schema for game settings
export const BaseGameSettingsSchema = z.object({
  allowedBets: z.array(z.number()),
  autoSpinSettings: z.object({
    availableAutoSpinCounts: z.array(z.number()),
  }),
});

// Base schema for session data (common to all games)
export const BaseSessionSchema = z.object({
  securityHash: z.string(),
  id: z.string(),
  gameId: z.string(),
  currency: z.string(),
  round: BaseRoundSchema,
  gameSettings: BaseGameSettingsSchema,
  freeRoundCampaign: BaseFreeRoundCampaignSchema,
  startGameMode: z.number(),
  isDemo: z.boolean(),
});

// Base schema for spin request
export const BaseSpinRequestSchema = z.object({
  bet: z.number(),
});

// Export types
export type BasePayline = z.infer<typeof BasePaylineSchema>;
export type BaseStickyWildFeature = z.infer<typeof BaseStickyWildFeatureSchema>;
export type BaseFreeRoundCampaign = z.infer<typeof BaseFreeRoundCampaignSchema>;
export type BaseRound = z.infer<typeof BaseRoundSchema>;
export type BaseGameSettings = z.infer<typeof BaseGameSettingsSchema>;
export type BaseSession = z.infer<typeof BaseSessionSchema>;
export type BaseSpinRequest = z.infer<typeof BaseSpinRequestSchema>;
```

---

Path: common\types\signalr.types.ts
```
// src/common/types/signalr.types.ts
import { z } from 'zod';

/**
 * SignalR Message Types
 * 1: Invocation - Client invoking a hub method
 * 2: StreamItem - Server sending stream item(s) to client
 * 3: Completion - Server sending the result of a hub method
 * 4: StreamInvocation - Client invoking a streaming hub method
 * 5: CancelInvocation - Client canceling a streaming hub method
 * 6: Ping - Ping message
 * 7: Close - Connection close message
 */
export enum SignalRMessageType {
  Invocation = 1,
  StreamItem = 2,
  Completion = 3,
  StreamInvocation = 4,
  CancelInvocation = 5,
  Ping = 6,
  Close = 7,
}

// SignalR Protocol Schema Definitions
export const SignalRInvocationSchema = z.object({
  type: z.literal(SignalRMessageType.Invocation),
  invocationId: z.string(),
  target: z.string(),
  arguments: z.array(z.any()),
});

export const SignalRCompletionSchema = z.object({
  type: z.literal(SignalRMessageType.Completion),
  invocationId: z.string(),
  result: z.any().optional(),
  error: z.string().optional(),
});

export type SignalRInvocation = z.infer<typeof SignalRInvocationSchema>;
export type SignalRCompletion = z.infer<typeof SignalRCompletionSchema>;

// Handshake protocol
export const SignalRHandshakeRequestSchema = z.object({
  protocol: z.string(),
  version: z.number(),
});

export type SignalRHandshakeRequest = z.infer<typeof SignalRHandshakeRequestSchema>;

export const SignalRHandshakeResponseSchema = z.object({
  error: z.string().optional(),
});

export type SignalRHandshakeResponse = z.infer<typeof SignalRHandshakeResponseSchema>;

// src/common/utils/mock-loader.util.ts
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MockLoader {
  private readonly logger = new Logger(MockLoader.name);

  /**
   * Load a mock file from the mocks directory
   * @param gameId - The game ID
   * @param method - The method name (spin, session, etc.)
   * @param mockId - The mock ID (optional, defaults to '001')
   * @returns The mock data as an object
   */
  loadMock(gameId: string, method: string, mockId: string = '001'): any {
    try {
      const mockPath = path.join(process.cwd(), 'mocks', gameId, method, `${mockId}.json`);
      this.logger.debug(`Loading mock from ${mockPath}`);
      
      if (!fs.existsSync(mockPath)) {
        this.logger.warn(`Mock file not found: ${mockPath}`);
        return null;
      }
      
      const mockContent = fs.readFileSync(mockPath, 'utf8');
      return JSON.parse(mockContent);
    } catch (error) {
      this.logger.error(`Failed to load mock for ${gameId}/${method}/${mockId}: ${(error as any).message}`);
      return null;
    }
  }

  /**
   * Get a list of available mocks for a specific game and method
   * @param gameId - The game ID
   * @param method - The method name
   * @returns An array of mock IDs
   */
  listMocks(gameId: string, method: string): string[] {
    try {
      const mockDir = path.join(process.cwd(), 'mocks', gameId, method);
      if (!fs.existsSync(mockDir)) {
        return [];
      }
      
      return fs.readdirSync(mockDir)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      this.logger.error(`Failed to list mocks for ${gameId}/${method}: ${(error as any).message}`);
      return [];
    }
  }

  /**
   * Validate a mock against a Zod schema
   * @param mock - The mock data
   * @param schema - The Zod schema to validate against
   * @returns True if valid, false otherwise
   */
  validateMock(mock: any, schema: any): boolean {
    try {
      schema.parse(mock);
      return true;
    } catch (error) {
      this.logger.error(`Mock validation failed: ${(error as any).message}`);
      return false;
    }
  }
}

// src/common/guards/session.guard.ts
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToWs().getClient();
    const sessionId = request.handshake.query.sessionId;

    if (!sessionId) {
      return false;
    }

    // Validate session ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return false;
    }

    return true;
  }
}

// src/common/interceptors/websocket.interceptor.ts
import { CallHandler, NestInterceptor } from '@nestjs/common';
import { tap } from 'rxjs/operators';

@Injectable()
export class WebSocketInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WebSocketInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();
    
    const now = Date.now();
    const sessionId = client.handshake.query.sessionId;
    
    this.logger.debug(`Request [${sessionId}]: ${JSON.stringify(data)}`);
    
    return next.handle().pipe(
      tap(response => {
        const delay = Date.now() - now;
        this.logger.debug(`Response [${sessionId}] (${delay}ms): ${JSON.stringify(response)}`);
      }),
    );
  }
}
```

---

Path: common\utils\mock-loader.util.ts
```
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MockLoader {
  private readonly logger = new Logger(MockLoader.name);

  /**
   * Load a mock file from the mocks directory
   * @param gameId - The game ID
   * @param method - The method name (spin, session, etc.)
   * @param mockId - The mock ID (optional, defaults to '001')
   * @returns The mock data as an object
   */
  loadMock(gameId: string, method: string, mockId: string = '001'): any {
    try {
      const mockPath = path.join(process.cwd(), 'mocks', gameId, method, `${mockId}.json`);
      this.logger.debug(`Loading mock from ${mockPath}`);
      
      if (!fs.existsSync(mockPath)) {
        this.logger.warn(`Mock file not found: ${mockPath}`);
        return null;
      }
      
      const mockContent = fs.readFileSync(mockPath, 'utf8');
      return JSON.parse(mockContent);
    } catch (error: any) {
      this.logger.error(`Failed to load mock for ${gameId}/${method}/${mockId}: ${error?.message || String(error)}`);
      return null;
    }
  }

  /**
   * Get a list of available mocks for a specific game and method
   * @param gameId - The game ID
   * @param method - The method name
   * @returns An array of mock IDs
   */
  listMocks(gameId: string, method: string): string[] {
    try {
      const mockDir = path.join(process.cwd(), 'mocks', gameId, method);
      if (!fs.existsSync(mockDir)) {
        return [];
      }
      
      return fs.readdirSync(mockDir)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error: any) {
      this.logger.error(`Failed to list mocks for ${gameId}/${method}: ${error?.message || String(error)}`);
      return [];
    }
  }

  /**
   * Validate a mock against a Zod schema
   * @param mock - The mock data
   * @param schema - The Zod schema to validate against
   * @returns True if valid, false otherwise
   */
  validateMock(mock: any, schema: any): boolean {
    try {
      schema.parse(mock);
      return true;
    } catch (error: any) {
      this.logger.error(`Mock validation failed: ${error?.message || String(error)}`);
      return false;
    }
  }
}
```

---

Path: common\utils\mock-validator.util.ts
```
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

@Injectable()
export class MockValidator {
  private readonly logger = new Logger(MockValidator.name);
  
  /**
   * Validate all mocks for a specific game against the given schema
   * @param gameId - The game ID
   * @param method - The method name (spin, session, etc.)
   * @param schema - The Zod schema to validate against
   * @returns An object containing validation results and error messages
   */
  validateAllMocks(gameId: string, method: string, schema: z.ZodSchema<any>): {
    valid: boolean;
    validCount: number;
    invalidCount: number;
    errors: Record<string, string[]>;
  } {
    try {
      const mockDir = path.join(process.cwd(), 'mocks', gameId, method);
      if (!fs.existsSync(mockDir)) {
        this.logger.warn(`Mock directory not found: ${mockDir}`);
        return {
          valid: false,
          validCount: 0,
          invalidCount: 0,
          errors: { directory: [`Mock directory not found: ${mockDir}`] },
        };
      }
      
      const mockFiles = fs.readdirSync(mockDir)
        .filter(file => file.endsWith('.json'));
      
      const errors: Record<string, string[]> = {};
      let validCount = 0;
      let invalidCount = 0;
      
      for (const file of mockFiles) {
        const mockPath = path.join(mockDir, file);
        try {
          const mockContent = fs.readFileSync(mockPath, 'utf8');
          const mockData = JSON.parse(mockContent);
          
          const validationResult = schema.safeParse(mockData);
          if (!validationResult.success) {
            invalidCount++;
            errors[file] = validationResult.error.errors.map(err => 
              `${err.path.join('.')} ${err.message}`
            );
          } else {
            validCount++;
          }
        } catch (error: any) {
          invalidCount++;
          errors[file] = [`Error reading or parsing mock: ${error?.message || String(error)}`];
        }
      }
      
      return {
        valid: invalidCount === 0 && validCount > 0,
        validCount,
        invalidCount,
        errors,
      };
    } catch (error: any) {
      this.logger.error(`Error validating mocks: ${error?.message || String(error)}`);
      return {
        valid: false,
        validCount: 0,
        invalidCount: 0,
        errors: { general: [error?.message || String(error)] },
      };
    }
  }
  
  /**
   * Validate a single mock against a schema
   * @param mockPath - The full path to the mock file
   * @param schema - The Zod schema to validate against
   * @returns Validation result and error messages
   */
  validateMock(mockPath: string, schema: z.ZodSchema<any>): {
    valid: boolean;
    errors: string[];
  } {
    try {
      if (!fs.existsSync(mockPath)) {
        return {
          valid: false,
          errors: [`Mock file not found: ${mockPath}`],
        };
      }
      
      const mockContent = fs.readFileSync(mockPath, 'utf8');
      const mockData = JSON.parse(mockContent);
      
      const validationResult = schema.safeParse(mockData);
      if (!validationResult.success) {
        return {
          valid: false,
          errors: validationResult.error.errors.map(err => 
            `${err.path.join('.')} ${err.message}`
          ),
        };
      }
      
      return {
        valid: true,
        errors: [],
      };
    } catch (error: any) {
      return {
        valid: false,
        errors: [`Error reading or parsing mock: ${error?.message || String(error)}`],
      };
    }
  }
}

```

---

Path: games\moonlight-burst\moonlight-burst.controller.ts
```
import { Controller, Get, Logger, Param } from '@nestjs/common';
import { MockLoader } from '../../common/utils/mock-loader.util';
import { MoonlightBurstService } from './moonlight-burst.service';
import { MOONLIGHT_BURST_GAME_ID } from './moonlight-burst.types';

@Controller('moonlight-burst')
export class MoonlightBurstController {
  private readonly logger = new Logger(MoonlightBurstController.name);
  
  constructor(
    private readonly moonlightBurstService: MoonlightBurstService,
    private readonly mockLoader: MockLoader,
  ) {}
  
  /**
   * Get a list of available mocks for the "spin" method
   * @returns An array of mock IDs
   */
  @Get('mocks/spin')
  getSpinMocks() {
    this.logger.debug('Listing spin mocks');
    return {
      mocks: this.mockLoader.listMocks(MOONLIGHT_BURST_GAME_ID, 'spin'),
    };
  }
  
  /**
   * Get a list of available mocks for the "session" method
   * @returns An array of mock IDs
   */
  @Get('mocks/session')
  getSessionMocks() {
    this.logger.debug('Listing session mocks');
    return {
      mocks: this.mockLoader.listMocks(MOONLIGHT_BURST_GAME_ID, 'session'),
    };
  }
  
  /**
   * Get a specific mock for the "spin" method
   * @param id - The mock ID
   * @returns The mock data
   */
  @Get('mocks/spin/:id')
  getSpinMock(@Param('id') id: string) {
    this.logger.debug(`Getting spin mock with ID: ${id}`);
    
    const mock = this.mockLoader.loadMock(MOONLIGHT_BURST_GAME_ID, 'spin', id);
    if (!mock) {
      return { error: 'Mock not found' };
    }
    
    return mock;
  }
  
  /**
   * Get a specific mock for the "session" method
   * @param id - The mock ID
   * @returns The mock data
   */
  @Get('mocks/session/:id')
  getSessionMock(@Param('id') id: string) {
    this.logger.debug(`Getting session mock with ID: ${id}`);
    
    const mock = this.mockLoader.loadMock(MOONLIGHT_BURST_GAME_ID, 'session', id);
    if (!mock) {
      return { error: 'Mock not found' };
    }
    
    return mock;
  }
}

```

---

Path: games\moonlight-burst\moonlight-burst.gateway.ts
```
// src/games/moonlight-burst/moonlight-burst.gateway.ts
import { Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as WebSocket from 'ws';
import { SessionGuard } from '../../common/guards/session.guard';
import { WebSocketInterceptor } from '../../common/interceptors/websocket.interceptor';
import { SignalRMessageType } from '../../common/types/signalr.types';
import { MoonlightBurstService } from './moonlight-burst.service';
  
  @WebSocketGateway({
    path: 'moonlight-burst/slot',
  })
  @UseInterceptors(WebSocketInterceptor)
  @UseGuards(SessionGuard)
  export class MoonlightBurstGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(MoonlightBurstGateway.name);
    
    @WebSocketServer()
    server!: WebSocket.Server;
    
    constructor(private readonly moonlightBurstService: MoonlightBurstService) {}
    
    // Modified to use a single parameter as required by the interface
    async handleConnection(client: WebSocket) {
      // Make sure the client has the upgradeReq property
      const req = (client as any).upgradeReq;
      const sessionId = '00000000-0000-0000-0000-000000000000';
      // Store the sessionId on the client object
      (client as any).sessionId = sessionId;
      
      client.on('message', async (data: WebSocket.Data) => {
        try {
          // Convert to string and remove the Information Separator Two (U+001E) character
          let message = data.toString();
          message = message.replace(/\u001E/g, '');
          
          // Also trim any whitespace and backticks to be thorough
          message = message.trim().replace(/^`+|`+$/g, '');
          
          // Parse the cleaned message
          const parsedData = JSON.parse(message);
          
          // Rest of the code remains the same...
          if (parsedData.protocol && parsedData.version) {
            if (parsedData.protocol === 'json' && parsedData.version === 1) {
              client.send(this.formatSignalRResponse({}));;
              this.logger.debug(`Handshake successful for session ${sessionId}`);
            } else {
              client.send(JSON.stringify({ error: 'Unsupported protocol or version' }));
              client.close();
            }
          } else if (parsedData.type === SignalRMessageType.Invocation) {
            await this.processInvocation(client, parsedData, sessionId);
          }
        } catch (error: any) {
          this.logger.error(`Error processing message: ${error?.message || String(error)}`);
          this.logger.debug(`Raw message content (hex): ${Buffer.from(data.toString()).toString('hex')}`);
          client.close();
        }
      });
    }

    /**
 * Formats a response according to SignalR protocol standards
 * by appending the Information Separator Two character
 */
private formatSignalRResponse(data: any): string {
    return JSON.stringify(data) + '\u001E';
  }
  
    
    // Rest of the gateway implementation remains the same
    handleDisconnect(client: WebSocket) {
      const sessionId = (client as any).sessionId || 'unknown';
      this.logger.log(`Client disconnected with sessionId: ${sessionId}`);
    }
    
    private async processInvocation(client: WebSocket, invocation: any, sessionId: string) {
      this.logger.debug(`Processing invocation target=${invocation.target}, id=${invocation.invocationId}`);
      
      try {
        let response;
        
        switch (invocation.target) {
          case 'session':
            response = await this.moonlightBurstService.handleSession(
              invocation.invocationId,
              sessionId
            );
            break;
            
          case 'spin':
            const spinRequest = invocation.arguments[0];
            response = await this.moonlightBurstService.handleSpin(
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
      } catch (error: any) {
        this.logger.error(`Error processing invocation: ${error?.message || String(error)}`);
        
        const errorResponse = {
          type: SignalRMessageType.Completion,
          invocationId: invocation.invocationId,
          error: error?.message || String(error),
        };
        
        client.send(this.formatSignalRResponse(errorResponse));
      }
    }
  }
```

---

Path: games\moonlight-burst\moonlight-burst.module.ts
```
import { Module } from '@nestjs/common';
import { MockLoader } from '../../common/utils/mock-loader.util';
import { MoonlightBurstController } from './moonlight-burst.controller';
import { MoonlightBurstGateway } from './moonlight-burst.gateway';
import { MoonlightBurstService } from './moonlight-burst.service';

@Module({
  controllers: [MoonlightBurstController],
  providers: [MoonlightBurstService, MoonlightBurstGateway, MockLoader],
})
export class MoonlightBurstModule {}
```

---

Path: games\moonlight-burst\moonlight-burst.service.ts
```
// src/games/moonlight-burst/moonlight-burst.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SignalRMessageType } from '../../common/types/signalr.types';
import { MockLoader } from '../../common/utils/mock-loader.util';
import {
  MOONLIGHT_BURST_GAME_ID,
  MoonlightBurstSessionResponse,
  MoonlightBurstSessionResponseSchema,
  MoonlightBurstSpinRequest,
  MoonlightBurstSpinResponse,
  MoonlightBurstSpinResponseSchema
} from './moonlight-burst.types';

@Injectable()
export class MoonlightBurstService {
  private readonly logger = new Logger(MoonlightBurstService.name);
  private readonly gameId = MOONLIGHT_BURST_GAME_ID;
  
  // Store active sessions
  private readonly sessions: Map<string, any> = new Map();

  constructor(private readonly mockLoader: MockLoader) {}

  /**
   * Process a session request and return session data
   * @param invocationId - The SignalR invocation ID
   * @param sessionId - The session ID from the connection
   * @returns A SignalR completion message with session data
   */
  async handleSession(invocationId: string, sessionId: string): Promise<MoonlightBurstSessionResponse> {
    this.logger.debug(`Processing session request for ${sessionId}`);
    
    // Load session mock or generate new one
    let sessionData = this.mockLoader.loadMock(this.gameId, 'session');
    
    // If no mock found, use default template
    if (!sessionData) {
      sessionData = this.createDefaultSessionResponse();
    }
    
    // Ensure the session ID matches the request
    const response: MoonlightBurstSessionResponse = {
      type: SignalRMessageType.Completion,
      invocationId,
      result: {
        ...sessionData.result,
        id: sessionId,
      },
    };
    
    // Validate against schema
    try {
      MoonlightBurstSessionResponseSchema.parse(response);
      
      // Store session for later use
      this.sessions.set(sessionId, response.result);
      
      return response;
    } catch (error: any) {
      this.logger.error(`Session response validation failed: ${error?.message || String(error)}`);
      throw new Error(`Invalid session data: ${error?.message || String(error)}`);
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
    request: MoonlightBurstSpinRequest,
  ): Promise<MoonlightBurstSpinResponse> {
    this.logger.debug(`Processing spin request for ${sessionId} with bet ${request.bet}`);
    
    // Load spin mock
    let spinData = this.mockLoader.loadMock(this.gameId, 'spin');
    
    // If no mock found, use default template
    if (!spinData) {
      spinData = this.createDefaultSpinResponse();
    }
    
    // Apply request-specific modifications
    const response: MoonlightBurstSpinResponse = {
      type: SignalRMessageType.Completion,
      invocationId,
      result: {
        ...spinData.result,
        bet: request.bet,
        roundId: uuidv4(),
      },
    };
    
    // Validate against schema
    try {
      MoonlightBurstSpinResponseSchema.parse(response);
      
      // Update session with latest round
      if (this.sessions.has(sessionId)) {
        const session = this.sessions.get(sessionId);
        session.round = response.result;
        this.sessions.set(sessionId, session);
      }
      
      return response;
    } catch (error: any) {
      this.logger.error(`Spin response validation failed: ${error?.message || String(error)}`);
      throw new Error(`Invalid spin data: ${error?.message || String(error)}`);
    }
  }
  
  /**
   * Create a default session response when no mock is available
   * @returns A default session response
   */
  private createDefaultSessionResponse(): MoonlightBurstSessionResponse {
    return {
      type: SignalRMessageType.Completion,
      invocationId: '0',
      result: {
        securityHash: this.generateSecurityHash(),
        id: uuidv4(),
        gameId: 'fe418252-3db9-4ab9-8151-e848da2dd83e',
        currency: 'eur',
        round: {
          roundId: uuidv4(),
          bet: 1.0,
          totalFreespins: 0,
          newFreespins: 0,
          nextGameMode: 1,
          balance: 10000.0,
          totalWin:.0,
          frame: [[7,7,7],[7,3,3],[3,3,3],[7,7,5],[5,7,6]],
          paylines: [],
          stickyWildFeatures: [],
          endedUtc: new Date().toISOString(),
          freeRoundCampaign: null
        },
        gameSettings: {
          allowedBets: [0.1, 0.2, 0.5, 1.0, 1.5, 2.0, 3.0, 5.0, 8.0, 10.0, 20.0, 50.0, 75.0, 100.0],
          autoSpinSettings: {
            availableAutoSpinCounts: [5, 10, 15, 20, 25, 50, 75, 100, 999]
          }
        },
        freeRoundCampaign: null,
        startGameMode: 1,
        isDemo: false
      }
    };
  }
  
  /**
   * Create a default spin response when no mock is available
   * @returns A default spin response
   */
  private createDefaultSpinResponse(): MoonlightBurstSpinResponse {
    return {
      type: SignalRMessageType.Completion,
      invocationId: '1',
      result: {
        roundId: uuidv4(),
        bet: 1.0,
        totalFreespins: 0,
        newFreespins: 0,
        balance: 10000.0,
        totalWin: 0,
        currentGameMode: 1,
        nextGameMode: 1,
        frame: [[7,7,3],[1,1,6],[1,8,1],[6,4,7],[6,7,6]],
        paylines: [],
        stickyWildFeatures: [],
        freeRoundCampaign: null
      }
    };
  }
  
  /**
   * Generate a random security hash
   * @returns A hexadecimal security hash
   */
  private generateSecurityHash(): string {
    return Array.from({ length: 64 })
      .map(() => Math.floor(Math.random() * 16).toString(16).toUpperCase())
      .join('');
  }

  /**
 * Get all active sessions for this game
 * @returns Array of active session information
 */
getActiveSessions() {
  const result = [];
  
  for (const [sessionId, session] of this.sessions.entries()) {
    const sessionInfo = {
      sessionId,
      gameId: this.gameId,
      currency: session.currency || 'Unknown',
      balance: session.round?.balance || 0,
      lastActive: new Date(),
      bet: session.round?.bet,
      totalWin: session.round?.totalWin,
    };
    
    result.push(sessionInfo);
  }
  
  return result;
}

/**
 * Get details for a specific session
 * @param sessionId - The session ID to retrieve
 * @returns Session information or null if not found
 */
getSession(sessionId: string) {
  if (!this.sessions.has(sessionId)) {
    return null;
  }
  
  const session = this.sessions.get(sessionId);
  return {
    sessionId,
    gameId: this.gameId,
    currency: session.currency || 'Unknown',
    balance: session.round?.balance || 0,
    lastActive: new Date(),
    bet: session.round?.bet,
    totalWin: session.round?.totalWin,
    round: session.round,
    gameSettings: session.gameSettings,
    isDemo: session.isDemo,
  };
}
}
```

---

Path: games\moonlight-burst\moonlight-burst.types.ts
```
import { z } from 'zod';
import {
    BaseRoundSchema,
    BaseSessionSchema,
    BaseSpinRequestSchema,
} from '../../common/types/base-game.types';

// Game constants - make sure this is exported
export const MOONLIGHT_BURST_GAME_ID = 'moonlight-burst';

// Moonlight Burst specific schemas
// Extend the base schemas with game-specific fields

// Moonlight Burst Round Schema (extends BaseRoundSchema)
export const MoonlightBurstRoundSchema = BaseRoundSchema.extend({
  // Add any game-specific fields here
});

// Moonlight Burst Session Schema (extends BaseSessionSchema)
export const MoonlightBurstSessionSchema = BaseSessionSchema.extend({
  // Add any game-specific fields here
});

// Moonlight Burst Spin Request Schema
export const MoonlightBurstSpinRequestSchema = BaseSpinRequestSchema.extend({
  // Add any game-specific fields here
});

// Moonlight Burst Spin Response Schema
export const MoonlightBurstSpinResponseSchema = z.object({
  type: z.number(),
  invocationId: z.string(),
  result: MoonlightBurstRoundSchema,
});

// Moonlight Burst Session Response Schema
export const MoonlightBurstSessionResponseSchema = z.object({
  type: z.number(),
  invocationId: z.string(),
  result: MoonlightBurstSessionSchema,
});

// Export types
export type MoonlightBurstRound = z.infer<typeof MoonlightBurstRoundSchema>;
export type MoonlightBurstSession = z.infer<typeof MoonlightBurstSessionSchema>;
export type MoonlightBurstSpinRequest = z.infer<typeof MoonlightBurstSpinRequestSchema>;
export type MoonlightBurstSpinResponse = z.infer<typeof MoonlightBurstSpinResponseSchema>;
export type MoonlightBurstSessionResponse = z.infer<typeof MoonlightBurstSessionResponseSchema>;

```

---

Path: games\sirens-fortune\sirens-fortune.controller.ts
```
import { Controller, Get, Logger, Param } from '@nestjs/common';
import { MockLoader } from '../../common/utils/mock-loader.util';
import { SirensFortuneService } from './sirens-fortune.service';
import { SIRENS_FORTUNE_GAME_ID } from './sirens-fortune.types';

@Controller('sirens-fortune')
export class SirensFortuneController {
  private readonly logger = new Logger(SirensFortuneController.name);
  
  constructor(
    private readonly sirensFortuneService: SirensFortuneService,
    private readonly mockLoader: MockLoader,
  ) {}
  
  /**
   * Get a list of available mocks for the "spin" method
   * @returns An array of mock IDs
   */
  @Get('mocks/spin')
  getSpinMocks() {
    this.logger.debug('Listing spin mocks');
    return {
      mocks: this.mockLoader.listMocks(SIRENS_FORTUNE_GAME_ID, 'spin'),
    };
  }
  
  /**
   * Get a list of available mocks for the "session" method
   * @returns An array of mock IDs
   */
  @Get('mocks/session')
  getSessionMocks() {
    this.logger.debug('Listing session mocks');
    return {
      mocks: this.mockLoader.listMocks(SIRENS_FORTUNE_GAME_ID, 'session'),
    };
  }
  
  /**
   * Get a specific mock for the "spin" method
   * @param id - The mock ID
   * @returns The mock data
   */
  @Get('mocks/spin/:id')
  getSpinMock(@Param('id') id: string) {
    this.logger.debug(`Getting spin mock with ID: ${id}`);
    
    const mock = this.mockLoader.loadMock(SIRENS_FORTUNE_GAME_ID, 'spin', id);
    if (!mock) {
      return { error: 'Mock not found' };
    }
    
    return mock;
  }
  
  /**
   * Get a specific mock for the "session" method
   * @param id - The mock ID
   * @returns The mock data
   */
  @Get('mocks/session/:id')
  getSessionMock(@Param('id') id: string) {
    this.logger.debug(`Getting session mock with ID: ${id}`);
    
    const mock = this.mockLoader.loadMock(SIRENS_FORTUNE_GAME_ID, 'session', id);
    if (!mock) {
      return { error: 'Mock not found' };
    }
    
    return mock;
  }
  
  /**
   * Get a list of all active sessions
   * @returns An array of active sessions
   */
  @Get('sessions')
  getActiveSessions() {
    this.logger.debug('Getting all active sessions');
    return this.sirensFortuneService.getActiveSessions();
  }
  
  /**
   * Get details for a specific session
   * @param id - The session ID
   * @returns Session details or error
   */
  @Get('sessions/:id')
  getSessionDetails(@Param('id') id: string) {
    this.logger.debug(`Getting session details for ID: ${id}`);
    
    const session = this.sirensFortuneService.getSession(id);
    if (!session) {
      return { error: 'Session not found' };
    }
    
    return session;
  }
}
```

---

Path: games\sirens-fortune\sirens-fortune.gateway.ts
```
// src/games/sirens-fortune/sirens-fortune.gateway.ts
import { Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as WebSocket from 'ws';
import { SessionGuard } from '../../common/guards/session.guard';
import { WebSocketInterceptor } from '../../common/interceptors/websocket.interceptor';
import { SignalRMessageType } from '../../common/types/signalr.types';
import { SirensFortuneService } from './sirens-fortune.service';
  
@WebSocketGateway({
  path: 'sirens-fortune/slot',
})
@UseInterceptors(WebSocketInterceptor)
@UseGuards(SessionGuard)
export class SirensFortuneGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SirensFortuneGateway.name);
  
  @WebSocketServer()
  server!: WebSocket.Server;
  
  constructor(private readonly sirensFortuneService: SirensFortuneService) {}
  
  // Modified to use a single parameter as required by the interface
  async handleConnection(client: WebSocket) {
    // Make sure the client has the upgradeReq property
    const req = (client as any).upgradeReq;
    const sessionId = '00000000-0000-0000-0000-000000000000';
    // Store the sessionId on the client object
    (client as any).sessionId = sessionId;
    
    client.on('message', async (data: WebSocket.Data) => {
      try {
        // Convert to string and remove the Information Separator Two (U+001E) character
        let message = data.toString();
        message = message.replace(/\u001E/g, '');
        
        // Also trim any whitespace and backticks to be thorough
        message = message.trim().replace(/^`+|`+$/g, '');
        
        // Parse the cleaned message
        const parsedData = JSON.parse(message);
        
        if (parsedData.protocol && parsedData.version) {
          if (parsedData.protocol === 'json' && parsedData.version === 1) {
            client.send(this.formatSignalRResponse({}));;
            this.logger.debug(`Handshake successful for session ${sessionId}`);
          } else {
            client.send(JSON.stringify({ error: 'Unsupported protocol or version' }));
            client.close();
          }
        } else if (parsedData.type === SignalRMessageType.Invocation) {
          await this.processInvocation(client, parsedData, sessionId);
        }
      } catch (error: any) {
        this.logger.error(`Error processing message: ${error?.message || String(error)}`);
        this.logger.debug(`Raw message content (hex): ${Buffer.from(data.toString()).toString('hex')}`);
        client.close();
      }
    });
  }

  /**
   * Formats a response according to SignalR protocol standards
   * by appending the Information Separator Two character
   */
  private formatSignalRResponse(data: any): string {
    return JSON.stringify(data) + '\u001E';
  }
  
  handleDisconnect(client: WebSocket) {
    const sessionId = (client as any).sessionId || 'unknown';
    this.logger.log(`Client disconnected with sessionId: ${sessionId}`);
  }
  
  private async processInvocation(client: WebSocket, invocation: any, sessionId: string) {
    this.logger.debug(`Processing invocation target=${invocation.target}, id=${invocation.invocationId}`);
    
    try {
      let response;
      
      switch (invocation.target) {
        case 'session':
          response = await this.sirensFortuneService.handleSession(
            invocation.invocationId,
            sessionId
          );
          break;
          
        case 'spin':
          const spinRequest = invocation.arguments[0];
          response = await this.sirensFortuneService.handleSpin(
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
    } catch (error: any) {
      this.logger.error(`Error processing invocation: ${error?.message || String(error)}`);
      
      const errorResponse = {
        type: SignalRMessageType.Completion,
        invocationId: invocation.invocationId,
        error: error?.message || String(error),
      };
      
      client.send(this.formatSignalRResponse(errorResponse));
    }
  }
}
```

---

Path: games\sirens-fortune\sirens-fortune.module.ts
```
import { Module } from '@nestjs/common';
import { MockLoader } from '../../common/utils/mock-loader.util';
import { SirensFortuneController } from './sirens-fortune.controller';
import { SirensFortuneGateway } from './sirens-fortune.gateway';
import { SirensFortuneService } from './sirens-fortune.service';

@Module({
  controllers: [SirensFortuneController],
  providers: [SirensFortuneService, SirensFortuneGateway, MockLoader],
})
export class SirensFortuneModule {}
```

---

Path: games\sirens-fortune\sirens-fortune.service.ts
```
// src/games/sirens-fortune/sirens-fortune.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SignalRMessageType } from '../../common/types/signalr.types';
import { MockLoader } from '../../common/utils/mock-loader.util';
import {
  SIRENS_FORTUNE_GAME_ID,
  SirensFortuneSessionResponse,
  SirensFortuneSessionResponseSchema,
  SirensFortuneSpinRequest,
  SirensFortuneSpinResponse,
  SirensFortuneSpinResponseSchema,
  Position,
  GameMode,
  TransformationType
} from './sirens-fortune.types';

@Injectable()
export class SirensFortuneService {
  private readonly logger = new Logger(SirensFortuneService.name);
  private readonly gameId = SIRENS_FORTUNE_GAME_ID;
  
  // Store active sessions
  private readonly sessions: Map<string, any> = new Map();

  constructor(private readonly mockLoader: MockLoader) {}

  /**
   * Process a session request and return session data
   * @param invocationId - The SignalR invocation ID
   * @param sessionId - The session ID from the connection
   * @returns A SignalR completion message with session data
   */
  async handleSession(invocationId: string, sessionId: string): Promise<SirensFortuneSessionResponse> {
    this.logger.debug(`Processing session request for ${sessionId}`);
    
    // Load session mock or generate new one
    let sessionData = this.mockLoader.loadMock(this.gameId, 'session');
    
    // If no mock found, use default template
    if (!sessionData) {
      sessionData = this.createDefaultSessionResponse();
    }
    
    // Ensure the session ID matches the request
    const response: SirensFortuneSessionResponse = {
      type: SignalRMessageType.Completion,
      invocationId,
      result: {
        ...sessionData.result,
        id: sessionId,
      },
    };
    
    // Validate against schema
    try {
      SirensFortuneSessionResponseSchema.parse(response);
      
      // Store session for later use
      this.sessions.set(sessionId, response.result);
      
      return response;
    } catch (error: any) {
      this.logger.error(`Session response validation failed: ${error?.message || String(error)}`);
      throw new Error(`Invalid session data: ${error?.message || String(error)}`);
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
    request: SirensFortuneSpinRequest,
  ): Promise<SirensFortuneSpinResponse> {
    this.logger.debug(`Processing spin request for ${sessionId} with bet ${request.bet}`);
    
    // Load spin mock
    let spinData = this.mockLoader.loadMock(this.gameId, 'spin');
    
    // If no mock found, use default template
    if (!spinData) {
      spinData = this.createDefaultSpinResponse();
    }
    
    // Apply request-specific modifications
    const response: SirensFortuneSpinResponse = {
      type: SignalRMessageType.Completion,
      invocationId,
      result: {
        ...spinData.result,
        bet: request.bet,
        roundId: uuidv4(),
        luckyBetMode: request.luckyBetMode || 0
      },
    };
    
    // Validate against schema
    try {
      SirensFortuneSpinResponseSchema.parse(response);
      
      // Update session with latest round
      if (this.sessions.has(sessionId)) {
        const session = this.sessions.get(sessionId);
        session.round = response.result;
        this.sessions.set(sessionId, session);
      }
      
      return response;
    } catch (error: any) {
      this.logger.error(`Spin response validation failed: ${error?.message || String(error)}`);
      throw new Error(`Invalid spin data: ${error?.message || String(error)}`);
    }
  }
  
  /**
   * Convert a 1D position to 2D coordinates
   * @param pos - 1D position
   * @param width - Board width (default 5)
   * @returns 2D coordinates
   */
  private positionTo2D(pos: number, width: number = 5): Position {
    return {
      reel: pos % width,
      row: Math.floor(pos / width)
    };
  }

  /**
   * Convert 1D board to 2D board
   * @param board - 1D board array
   * @param width - Board width (default 5)
   * @returns 2D board array
   */
  private boardTo2D(board: string[], width: number = 5): string[][] {
    const result: string[][] = [];
    const height = board.length / width;
    
    for (let row = 0; row < height; row++) {
      const rowArray: string[] = [];
      for (let col = 0; col < width; col++) {
        rowArray.push(board[row * width + col]);
      }
      result.push(rowArray);
    }
    
    return result;
  }
  
  /**
   * Create a default session response when no mock is available
   * @returns A default session response
   */
  private createDefaultSessionResponse(): SirensFortuneSessionResponse {
    // Sample frame for a 5x5 board
    const frame = [
      ["5", "5", "6", "7", "9"],
      ["1", "1", "7", "6", "9"],
      ["7", "8", "1", "1", "1"],
      ["7", "8", "5", "5", "5"],
      ["4", "4", "4", "6", "6"]
    ];
    
    return {
      type: SignalRMessageType.Completion,
      invocationId: '0',
      result: {
        securityHash: this.generateSecurityHash(),
        id: uuidv4(),
        gameId: 'fd518252-5db9-8ab9-9151-f848da2dd83f',
        currency: 'eur',
        round: {
          roundId: uuidv4(),
          bet: 1.0,
          freespins: 0,
          totalFreespins: 0,
          totalWin: 0.0,
          balance: 10000.0,
          nextGameMode: GameMode.REGULAR,
          isBuyFeatureAvailable: true,
          isLuckyBetAvailable: true,
          luckyBetMode: 0,
          endedUtc: new Date().toISOString(),
          spinResult: {
            win: 0,
            newFreespins: 0,
            counterSymbols: [
              { symbol: "5", multiplier: 1 },
              { symbol: "7", multiplier: 1 },
              { symbol: "1", multiplier: 1 }
            ],
            cascadeFrames: [
              {
                frame: frame,
                win: 0,
                transformations: null
              }
            ]
          },
          freeRoundCampaign: null
        },
        gameSettings: {
          allowedBets: [0.1, 0.2, 0.5, 1.0, 1.5, 2.0, 3.0, 5.0, 8.0, 10.0, 20.0, 50.0, 75.0, 100.0],
          allowedLuckyBets: [0.12, 0.24, 0.6, 1.2, 1.8, 2.4, 3.6, 6.0, 9.6, 12.0, 24.0, 60.0, 90.0, 120.0],
          availableAutoSpinCounts: [5, 10, 15, 20, 25, 50, 75, 100, 999],
          luckyBetCoefficient: 1.2,
          rtpOptions: {
            rtp: 96.5,
            gameMode: "main",
            volatility: null
          },
          payTable: {
            "5": {
              "5-7": 2.5,
              "8-10": 5.0,
              "11-13": 7.0
            },
            "7": {
              "5-7": 2.0,
              "8-10": 4.0,
              "11-13": 5.5
            },
            "1": {
              "5-7": 1.5,
              "8-10": 3.0,
              "11-13": 4.5
            }
          }
        },
        freeRoundCampaign: null,
        startGameMode: GameMode.REGULAR,
        isDemo: false
      }
    };
  }
  
  /**
   * Create a default spin response when no mock is available
   * @returns A default spin response
   */
  private createDefaultSpinResponse(): SirensFortuneSpinResponse {
    // Sample frame data for a 5x5 board
    const frame = [
      ["5", "5", "6", "7", "9"],
      ["1", "1", "7", "6", "9"],
      ["7", "8", "1", "1", "1"],
      ["7", "8", "5", "5", "5"],
      ["4", "4", "4", "6", "6"]
    ];
    
    // Sample transformations
    const transformations = [
      {
        id: null,
        type: TransformationType.CASCADE_WIN,
        positions: [
          { reel: 2, row: 2 },
          { reel: 2, row: 3 },
          { reel: 3, row: 2 },
          { reel: 3, row: 3 },
          { reel: 4, row: 2 }
        ],
        symbol: "5"
      }
    ];
    
    return {
      type: SignalRMessageType.Completion,
      invocationId: '1',
      result: {
        roundId: uuidv4(),
        bet: 1.0,
        freespins: 0,
        totalFreespins: 0,
        balance: 10000.0,
        totalWin: 2.5,
        nextGameMode: GameMode.REGULAR,
        isBuyFeatureAvailable: true,
        isLuckyBetAvailable: true,
        luckyBetMode: 0,
        endedUtc: new Date().toISOString(),
        spinResult: {
          win: 2.5,
          newFreespins: 0,
          counterSymbols: [
            { symbol: "5", multiplier: 2 },
            { symbol: "7", multiplier: 1 },
            { symbol: "1", multiplier: 1 }
          ],
          cascadeFrames: [
            {
              frame: frame,
              win: 2.5,
              transformations: transformations
            }
          ]
        },
        freeRoundCampaign: null
      }
    };
  }
  
  /**
   * Generate a random security hash
   * @returns A hexadecimal security hash
   */
  private generateSecurityHash(): string {
    return Array.from({ length: 64 })
      .map(() => Math.floor(Math.random() * 16).toString(16).toUpperCase())
      .join('');
  }

  /**
   * Get all active sessions for this game
   * @returns Array of active session information
   */
  getActiveSessions() {
    const result = [];
    
    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionInfo = {
        sessionId,
        gameId: this.gameId,
        currency: session.currency || 'Unknown',
        balance: session.round?.balance || 0,
        lastActive: new Date(),
        bet: session.round?.bet,
        totalWin: session.round?.totalWin,
      };
      
      result.push(sessionInfo);
    }
    
    return result;
  }

  /**
   * Get details for a specific session
   * @param sessionId - The session ID to retrieve
   * @returns Session information or null if not found
   */
  getSession(sessionId: string) {
    if (!this.sessions.has(sessionId)) {
      return null;
    }
    
    const session = this.sessions.get(sessionId);
    return {
      sessionId,
      gameId: this.gameId,
      currency: session.currency || 'Unknown',
      balance: session.round?.balance || 0,
      lastActive: new Date(),
      bet: session.round?.bet,
      totalWin: session.round?.totalWin,
      round: session.round,
      gameSettings: session.gameSettings,
      isDemo: session.isDemo,
    };
  }
}
```

---

Path: games\sirens-fortune\sirens-fortune.types.ts
```
import { z } from 'zod';
import {
    BaseRoundSchema,
    BaseSessionSchema,
    BaseSpinRequestSchema,
} from '../../common/types/base-game.types';

// Game constants
export const SIRENS_FORTUNE_GAME_ID = 'sirens-fortune';

// Position schema (2D coordinates)
export const PositionSchema = z.object({
  reel: z.number(),
  row: z.number()
});

export type Position = z.infer<typeof PositionSchema>;

// Counter Symbol schema
export const CounterSymbolSchema = z.object({
  symbol: z.string(),
  multiplier: z.number()
});

export type CounterSymbol = z.infer<typeof CounterSymbolSchema>;

// Transformation Type enum
export enum TransformationType {
  CASCADE_WIN = "CascadeWin",
  BUBBLE_POP = "BubblePop",
  WILD_PLACEMENT = "WildPlacement",
  SCATTER_WIN = "ScatterWin"
}

// Transformation schema
export const TransformationSchema = z.object({
  id: z.string().nullable(),
  type: z.nativeEnum(TransformationType),
  positions: z.array(PositionSchema),
  symbol: z.string()
});

export type Transformation = z.infer<typeof TransformationSchema>;

// Cascade Frame schema
export const CascadeFrameSchema = z.object({
  frame: z.array(z.array(z.string())),
  win: z.number(),
  transformations: z.array(TransformationSchema).nullable()
});

export type CascadeFrame = z.infer<typeof CascadeFrameSchema>;

// Spin Result schema
export const SirensFortuneSpinResultSchema = z.object({
  win: z.number(),
  newFreespins: z.number(),
  counterSymbols: z.array(CounterSymbolSchema),
  cascadeFrames: z.array(CascadeFrameSchema)
});

export type SirensFortuneSpinResult = z.infer<typeof SirensFortuneSpinResultSchema>;

// Game Mode enum
export enum GameMode {
  NONE = 0,
  REGULAR = 1,
  FREESPIN = 2
}

// Sirens Fortune Round Schema (extends BaseRoundSchema)
export const SirensFortuneRoundSchema = z.object({
  roundId: z.string(),
  bet: z.number(),
  balance: z.number(),
  totalWin: z.number(),
  freespins: z.number().default(0),
  totalFreespins: z.number().default(0),
  isBuyFeatureAvailable: z.boolean().default(true),
  isLuckyBetAvailable: z.boolean().default(true),
  luckyBetMode: z.number().default(0),
  endedUtc: z.string(),
  nextGameMode: z.nativeEnum(GameMode),
  spinResult: SirensFortuneSpinResultSchema,
  freeRoundCampaign: z.any().nullable()
});

// Game Settings Schema
export const GameSettingsSchema = z.object({
  allowedBets: z.array(z.number()),
  allowedLuckyBets: z.array(z.number()).optional(),
  availableAutoSpinCounts: z.array(z.number()),
  luckyBetCoefficient: z.number().optional(),
  rtpOptions: z.object({
    rtp: z.number(),
    gameMode: z.string(),
    volatility: z.number().nullable()
  }).optional(),
  payTable: z.record(z.string(), z.record(z.string(), z.number())).optional()
});

// Sirens Fortune Session Schema
export const SirensFortuneSessionSchema = z.object({
  securityHash: z.string(),
  id: z.string().optional(),
  gameId: z.string().optional(),
  currency: z.string().nullable(),
  round: SirensFortuneRoundSchema,
  gameSettings: GameSettingsSchema,
  freeRoundCampaign: z.any().nullable(),
  startGameMode: z.nativeEnum(GameMode),
  isDemo: z.boolean()
});

// Sirens Fortune Spin Request Schema
export const SirensFortuneSpinRequestSchema = BaseSpinRequestSchema.extend({
  luckyBetMode: z.number().optional()
});

// Sirens Fortune Spin Response Schema
export const SirensFortuneSpinResponseSchema = z.object({
  type: z.number(),
  invocationId: z.string(),
  result: SirensFortuneRoundSchema,
});

// Sirens Fortune Session Response Schema
export const SirensFortuneSessionResponseSchema = z.object({
  type: z.number(),
  invocationId: z.string(),
  result: SirensFortuneSessionSchema,
});

// Server Round Response for the full endpoint
export const ServerRoundResponseSchema = z.object({
  sessionId: z.string(),
  currency: z.string(),
  startBalance: z.number(),
  endBalance: z.number(),
  totalBet: z.number(),
  totalWin: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  roundResponses: z.array(SirensFortuneRoundSchema),
  serviceTag: z.string(),
  luckyBet: z.string(),
  buyFeature: z.unknown().nullable(),
  externalPlayerId: z.string(),
  integrationId: z.string()
});

export type ServerRoundResponse = z.infer<typeof ServerRoundResponseSchema>;

// Export types
export type SirensFortuneRound = z.infer<typeof SirensFortuneRoundSchema>;
export type SirensFortuneSession = z.infer<typeof SirensFortuneSessionSchema>;
export type SirensFortuneSpinRequest = z.infer<typeof SirensFortuneSpinRequestSchema>;
export type SirensFortuneSpinResponse = z.infer<typeof SirensFortuneSpinResponseSchema>;
export type SirensFortuneSessionResponse = z.infer<typeof SirensFortuneSessionResponseSchema>;
export type GameSettings = z.infer<typeof GameSettingsSchema>;
```

---

Path: health\health.controller.ts
```
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024),
    ]);
  }
}
```

---

Path: health\health.module.ts
```
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}

```

---

Path: logger\logger.module.ts
```
// src/logger/logger.module.ts
import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
```

---

Path: logger\logger.service.ts
```
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        }),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ level, message, timestamp }) => {
              return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            }),
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(this.formatMessage(message, context));
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(this.formatMessage(message, context), { trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(this.formatMessage(message, context));
  }

  debug(message: string, context?: string) {
    this.logger.debug(this.formatMessage(message, context));
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(this.formatMessage(message, context));
  }

  private formatMessage(message: string, context?: string): string {
    return context ? `[${context}] ${message}` : message;
  }
}
```

---

Path: main.ts
```
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const globalPrefix = 'api';
  
  // Set up template engine
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, 'views'));
  app.setGlobalPrefix(globalPrefix)
  
  // Use WebSocket adapter
  app.useWebSocketAdapter(new WsAdapter(app));
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
```

---

Path: views\admin\dashboard.hbs
```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
  <link rel="stylesheet" href="/admin/styles.css">
  <meta http-equiv="refresh" content="30">
</head>
<body>
  <header>
    <h1>Game Mock Server Admin</h1>
    <button class="refresh-button" onclick="window.location.reload()">Refresh</button>
  </header>

  <div class="summary">
    <div class="summary-item">
      <h3>Total Active Sessions</h3>
      <p>{{ totalSessions }}</p>
    </div>
    <div class="summary-item">
      <h3>Game Types</h3>
      <p>{{ sessionGroups.length }}</p>
    </div>
    <div class="summary-item">
      <h3>Last Updated</h3>
      <p>{{ timestamp }}</p>
    </div>
  </div>

  {{#each sessionGroups}}
    <div class="game-container">
      <div class="game-header">
        <h2>{{ displayName }}</h2>
        <div>
          <span>{{ activeCount }} active sessions</span>
        </div>
      </div>

      {{#if sessions.length}}
        <table>
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Currency</th>
              <th>Balance</th>
              <th>Last Bet</th>
              <th>Last Win</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {{#each sessions}}
              <tr>
                <td><a href="/admin/sessions/{{ gameId }}/{{ sessionId }}" class="session-link">{{ sessionId }}</a></td>
                <td>{{ currency }}</td>
                <td class="currency">{{ balance }}</td>
                <td class="currency">{{ bet }}</td>
                <td class="currency">{{ totalWin }}</td>
                <td>{{ lastActive }}</td>
              </tr>
            {{/each}}
          </tbody>
        </table>
      {{else}}
        <div class="empty-message">No active sessions for this game</div>
      {{/if}}
    </div>
  {{/each}}

  <footer>
    <p>Game Mock Server Admin Panel &copy; {{ currentYear }}</p>
  </footer>
</body>
</html>
```

---

Path: views\admin\session-details.hbs
```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
  <link rel="stylesheet" href="/admin/styles.css">
</head>
<body>
  <header>
    <h1>Session Details</h1>
    <a href="/admin" class="refresh-button">Back to Dashboard</a>
  </header>

  {{#if session}}
    <div class="summary">
      <div class="summary-item">
        <h3>Game</h3>
        <p>{{ session.gameId }}</p>
      </div>
      <div class="summary-item">
        <h3>Session ID</h3>
        <p>{{ session.sessionId }}</p>
      </div>
      <div class="summary-item">
        <h3>Balance</h3>
        <p>{{ session.balance }} {{ session.currency }}</p>
      </div>
      <div class="summary-item">
        <h3>Demo Mode</h3>
        <p>{{ session.isDemo }}</p>
      </div>
    </div>

    <div class="game-container">
      <div class="game-header">
        <h2>Current Round</h2>
      </div>
      
      {{#if session.round}}
        <table>
          <tbody>
            <tr>
              <th>Round ID</th>
              <td>{{ session.round.roundId }}</td>
            </tr>
            <tr>
              <th>Bet</th>
              <td>{{ session.round.bet }}</td>
            </tr>
            <tr>
              <th>Total Win</th>
              <td>{{ session.round.totalWin }}</td>
            </tr>
            <tr>
              <th>Free Spins</th>
              <td>Total: {{ session.round.totalFreespins }}, New: {{ session.round.newFreespins }}</td>
            </tr>
            <tr>
              <th>Game Mode</th>
              <td>Current: {{ session.round.currentGameMode }}, Next: {{ session.round.nextGameMode }}</td>
            </tr>
            <tr>
              <th>Frame</th>
              <td>
                <pre>{{ json session.round.frame }}</pre>
              </td>
            </tr>
            <tr>
              <th>Paylines</th>
              <td>
                <pre>{{ json session.round.paylines }}</pre>
              </td>
            </tr>
          </tbody>
        </table>
      {{else}}
        <div class="empty-message">No round data available</div>
      {{/if}}
    </div>

    <div class="game-container">
      <div class="game-header">
        <h2>Game Settings</h2>
      </div>
      
      {{#if session.gameSettings}}
        <table>
          <tbody>
            <tr>
              <th>Allowed Bets</th>
              <td>{{ session.gameSettings.allowedBets }}</td>
            </tr>
            <tr>
              <th>Auto Spin Settings</th>
              <td>
                <pre>{{ json session.gameSettings.autoSpinSettings }}</pre>
              </td>
            </tr>
          </tbody>
        </table>
      {{else}}
        <div class="empty-message">No game settings available</div>
      {{/if}}
    </div>
  {{else}}
    <div class="empty-message">Session not found</div>
  {{/if}}

  <footer>
    <p>Game Mock Server Admin Panel &copy; {{ currentYear }}</p>
  </footer>
</body>
</html>
```

---

