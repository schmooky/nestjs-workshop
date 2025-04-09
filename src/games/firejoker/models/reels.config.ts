import { FirejokerSymbol, GameSettings } from '../firejoker.types';

/**
 * Reel configurations for different RTP values
 * This is based on the original Go implementation's reel.yaml file
 */
export const FirejokerReels = {
  // RTP: 95.425533%
  '95.4': {
    reels: [
      // First reel
      [
        FirejokerSymbol.Seven, FirejokerSymbol.Bonus, FirejokerSymbol.Seven, 
        FirejokerSymbol.Bell, FirejokerSymbol.Plum, FirejokerSymbol.Seven, 
        FirejokerSymbol.Melon, FirejokerSymbol.Joker, FirejokerSymbol.Plum, 
        FirejokerSymbol.Seven, FirejokerSymbol.Bell, FirejokerSymbol.Plum, 
        FirejokerSymbol.Lemon, FirejokerSymbol.Cherry, FirejokerSymbol.Melon, 
        FirejokerSymbol.Lemon, FirejokerSymbol.Plum, FirejokerSymbol.Bell, 
        FirejokerSymbol.Seven, FirejokerSymbol.Lemon, FirejokerSymbol.Cherry, 
        FirejokerSymbol.Seven, FirejokerSymbol.Plum, FirejokerSymbol.Melon, 
        FirejokerSymbol.Seven, FirejokerSymbol.Bell, FirejokerSymbol.Melon, 
        FirejokerSymbol.Cherry, FirejokerSymbol.Lemon, FirejokerSymbol.Seven, 
        FirejokerSymbol.Cherry, FirejokerSymbol.Lemon, FirejokerSymbol.Seven, 
        FirejokerSymbol.Seven, FirejokerSymbol.Cherry
      ],
      // Second reel
      [
        FirejokerSymbol.Seven, FirejokerSymbol.Plum, FirejokerSymbol.Bell, 
        FirejokerSymbol.Cherry, FirejokerSymbol.Joker, FirejokerSymbol.Lemon, 
        FirejokerSymbol.Seven, FirejokerSymbol.Bell, FirejokerSymbol.Cherry, 
        FirejokerSymbol.Lemon, FirejokerSymbol.Melon, FirejokerSymbol.Plum, 
        FirejokerSymbol.Cherry, FirejokerSymbol.Bell, FirejokerSymbol.Plum, 
        FirejokerSymbol.Seven, FirejokerSymbol.Cherry, FirejokerSymbol.Plum, 
        FirejokerSymbol.Seven, FirejokerSymbol.Melon, FirejokerSymbol.Cherry, 
        FirejokerSymbol.Lemon, FirejokerSymbol.Plum, FirejokerSymbol.Seven, 
        FirejokerSymbol.Bell, FirejokerSymbol.Melon, FirejokerSymbol.Lemon, 
        FirejokerSymbol.Bell, FirejokerSymbol.Seven, FirejokerSymbol.Lemon, 
        FirejokerSymbol.Melon, FirejokerSymbol.Bell, FirejokerSymbol.Melon, 
        FirejokerSymbol.Cherry
      ],
      // Third reel (middle reel)
      [
        FirejokerSymbol.Melon, FirejokerSymbol.Seven, FirejokerSymbol.Plum, 
        FirejokerSymbol.Bell, FirejokerSymbol.Seven, FirejokerSymbol.Plum, 
        FirejokerSymbol.Seven, FirejokerSymbol.Seven, FirejokerSymbol.Lemon, 
        FirejokerSymbol.Cherry, FirejokerSymbol.Seven, FirejokerSymbol.Bell, 
        FirejokerSymbol.Seven, FirejokerSymbol.Melon, FirejokerSymbol.Cherry, 
        FirejokerSymbol.Bell, FirejokerSymbol.Plum, FirejokerSymbol.Lemon, 
        FirejokerSymbol.Plum, FirejokerSymbol.Seven, FirejokerSymbol.Cherry, 
        FirejokerSymbol.Seven, FirejokerSymbol.Melon, FirejokerSymbol.Seven, 
        FirejokerSymbol.Melon, FirejokerSymbol.Joker, FirejokerSymbol.Lemon, 
        FirejokerSymbol.Seven, FirejokerSymbol.Cherry, FirejokerSymbol.Bell
      ],
      // Fourth reel
      [
        FirejokerSymbol.Seven, FirejokerSymbol.Plum, FirejokerSymbol.Melon, 
        FirejokerSymbol.Seven, FirejokerSymbol.Cherry, FirejokerSymbol.Lemon, 
        FirejokerSymbol.Bell, FirejokerSymbol.Plum, FirejokerSymbol.Cherry, 
        FirejokerSymbol.Lemon, FirejokerSymbol.Seven, FirejokerSymbol.Joker, 
        FirejokerSymbol.Plum, FirejokerSymbol.Melon, FirejokerSymbol.Bell, 
        FirejokerSymbol.Lemon, FirejokerSymbol.Cherry, FirejokerSymbol.Seven, 
        FirejokerSymbol.Plum, FirejokerSymbol.Lemon, FirejokerSymbol.Seven, 
        FirejokerSymbol.Bonus, FirejokerSymbol.Lemon, FirejokerSymbol.Seven, 
        FirejokerSymbol.Melon, FirejokerSymbol.Plum, FirejokerSymbol.Seven, 
        FirejokerSymbol.Cherry, FirejokerSymbol.Seven, FirejokerSymbol.Bell, 
        FirejokerSymbol.Seven, FirejokerSymbol.Seven, FirejokerSymbol.Bell, 
        FirejokerSymbol.Cherry, FirejokerSymbol.Melon
      ],
      // Fifth reel
      [
        FirejokerSymbol.Seven, FirejokerSymbol.Bell, FirejokerSymbol.Melon, 
        FirejokerSymbol.Lemon, FirejokerSymbol.Plum, FirejokerSymbol.Melon, 
        FirejokerSymbol.Seven, FirejokerSymbol.Plum, FirejokerSymbol.Melon, 
        FirejokerSymbol.Bell, FirejokerSymbol.Cherry, FirejokerSymbol.Plum, 
        FirejokerSymbol.Seven, FirejokerSymbol.Seven, FirejokerSymbol.Cherry, 
        FirejokerSymbol.Lemon, FirejokerSymbol.Seven, FirejokerSymbol.Seven, 
        FirejokerSymbol.Melon, FirejokerSymbol.Plum, FirejokerSymbol.Bell, 
        FirejokerSymbol.Lemon, FirejokerSymbol.Bonus, FirejokerSymbol.Seven, 
        FirejokerSymbol.Lemon, FirejokerSymbol.Cherry, FirejokerSymbol.Seven, 
        FirejokerSymbol.Bell, FirejokerSymbol.Joker, FirejokerSymbol.Cherry, 
        FirejokerSymbol.Seven, FirejokerSymbol.Lemon, FirejokerSymbol.Cherry, 
        FirejokerSymbol.Seven, FirejokerSymbol.Plum
      ],
    ],
    // Bonus reel - used for free spins feature
    bonusReel: [
      FirejokerSymbol.Seven,
      FirejokerSymbol.Bell,
      FirejokerSymbol.Melon,
      FirejokerSymbol.Plum,
      FirejokerSymbol.Orange,
      FirejokerSymbol.Lemon,
      FirejokerSymbol.Cherry
    ]
  },
};

// Line payment table
export const LinePayTable = [
  [0, 0, 20, 50, 100], // Seven
  [0, 0, 10, 25, 50],  // Bell
  [0, 0, 10, 25, 50],  // Melon
  [0, 0, 4, 10, 20],   // Plum
  [0, 0, 4, 10, 20],   // Orange
  [0, 0, 4, 10, 20],   // Lemon
  [0, 0, 4, 10, 20],   // Cherry
  [0, 0, 0, 0, 0],     // Bonus - paid as scatter
  [0, 0, 0, 0, 0],     // Joker - wild symbol
];

// Scatter payments
export const ScatterPayTable = [0, 0.5, 3]; // Bonus scatter pays

// Scatter free spins table
export const ScatterFreeSpinsTable = [0, 0, 10]; // Bonus gives free spins

// Default RTP setting
export const DEFAULT_RTP = '95.4';

// Default game settings
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  allowedBets: [
    0.1, 0.2, 0.5, 1.0, 1.5, 2.0, 3.0,
    5.0, 8.0, 10.0, 20.0, 50.0, 75.0, 100.0
  ],
  autoSpinSettings: {
    availableAutoSpinCounts: [5, 10, 15, 20, 25, 50, 75, 100, 999]
  }
};