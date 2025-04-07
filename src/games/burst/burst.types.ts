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