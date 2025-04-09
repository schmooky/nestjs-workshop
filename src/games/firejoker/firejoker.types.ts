import { z } from 'zod';

// Game constants
export const FIREJOKER_GAME_ID = 'fc78a6b9-3e72-4a8c-b184-e3d888823a55';

// Enum for SignalR message types (same as Burst game)
export enum SignalRMessageType {
  Invocation = 1,
  StreamItem = 2,
  Completion = 3,
  StreamInvocation = 4,
  CancelInvocation = 5,
  Ping = 6,
  Close = 7,
}

// Symbol definitions
export enum FirejokerSymbol {
  Seven = 1,
  Bell = 2,
  Melon = 3,
  Plum = 4,
  Orange = 5,
  Lemon = 6,
  Cherry = 7,
  Bonus = 8,
  Joker = 9
}

// Game modes
export enum GameMode {
  Regular = 1,
  FreeSpins = 2,
}

// Schemas for Firejoker API structures
export const PaylineSchema = z.object({
  lineId: z.number(),
  line: z.array(z.number().nullable()),
  winType: z.number(),
  value: z.number(),
});

export const FreeRoundCampaignSchema = z.object({
  id: z.string(),
  spinsLeft: z.number(),
  validUntil: z.string(),
}).nullable();

export const FirejokerRoundSchema = z.object({
  roundId: z.string(),
  bet: z.number(),
  totalFreespins: z.number(),
  freeSpinsRemaining: z.number().optional(),
  newFreespins: z.number(),
  balance: z.number(),
  totalWin: z.number(),
  currentGameMode: z.number().optional(),
  nextGameMode: z.number(),
  frame: z.array(z.array(z.number())),
  paylines: z.array(PaylineSchema),
  freeRoundCampaign: FreeRoundCampaignSchema,
  endedUtc: z.string().optional(),
});

export const GameSettingsSchema = z.object({
  allowedBets: z.array(z.number()),
  autoSpinSettings: z.object({
    availableAutoSpinCounts: z.array(z.number()),
  }),
});

export const FirejokerSessionSchema = z.object({
  securityHash: z.string(),
  id: z.string(),
  gameId: z.string(),
  currency: z.string(),
  round: FirejokerRoundSchema,
  gameSettings: GameSettingsSchema,
  freeRoundCampaign: FreeRoundCampaignSchema,
  startGameMode: z.number(),
  isDemo: z.boolean(),
});

export const FirejokerSpinRequestSchema = z.object({
  bet: z.number(),
});

export const FirejokerSpinResponseSchema = z.object({
  type: z.number(),
  invocationId: z.string(),
  result: FirejokerRoundSchema,
});

export const FirejokerSessionResponseSchema = z.object({
  type: z.number(),
  invocationId: z.string(),
  result: FirejokerSessionSchema,
});

// Export types
export type Payline = z.infer<typeof PaylineSchema>;
export type FreeRoundCampaign = z.infer<typeof FreeRoundCampaignSchema>;
export type FirejokerRound = z.infer<typeof FirejokerRoundSchema>;
export type GameSettings = z.infer<typeof GameSettingsSchema>;
export type FirejokerSession = z.infer<typeof FirejokerSessionSchema>;
export type FirejokerSpinRequest = z.infer<typeof FirejokerSpinRequestSchema>;
export type FirejokerSpinResponse = z.infer<typeof FirejokerSpinResponseSchema>;
export type FirejokerSessionResponse = z.infer<typeof FirejokerSessionResponseSchema>;

// SessionInfo for admin panel (same as Burst game)
export interface SessionInfo {
  sessionId: string;
  gameId: string;
  currency: string;
  balance: number;
  lastActive: Date;
  bet?: number;
  totalWin?: number;
}