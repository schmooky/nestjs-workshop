import { FirejokerRound, FirejokerSymbol, GameMode } from '../firejoker.types';
import { DEFAULT_RTP, FirejokerReels, ScatterFreeSpinsTable, ScatterPayTable } from '../models/reels.config';
import { BetLines, getWinningPaylines } from '../models/paylines.config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Core game engine for Firejoker slot game
 * This handles the game logic, spinning reels, and calculating wins
 */
export class FirejokerGameEngine {
  private rtp: string = DEFAULT_RTP;
  
  constructor(rtp: string = DEFAULT_RTP) {
    this.rtp = rtp;
  }
  
  /**
   * Creates a random frame by spinning all reels
   * @returns A 5x3 frame of symbols
   */
  generateFrame(): number[][] {
    const reelSet = FirejokerReels[this.rtp]?.reels;
    if (!reelSet) {
      throw new Error(`Invalid RTP value: ${this.rtp}`);
    }
    
    const frame: number[][] = [];
    
    // For each reel
    for (let i = 0; i < 5; i++) {
      const reel = reelSet[i];
      const reelLength = reel.length;
      
      // Pick a random position in the reel
      const startPosition = Math.floor(Math.random() * reelLength);
      
      // Create a column with 3 consecutive symbols
      const column: number[] = [];
      for (let j = 0; j < 3; j++) {
        const position = (startPosition + j) % reelLength;
        column.push(reel[position]);
      }
      
      frame.push(column);
    }
    
    return frame;
  }
  
  /**
   * Generate a frame specifically for free spins mode
   * @returns A 5x3 frame for free spins with big symbol in the center
   */
  generateFreeSpinsFrame(): number[][] {
    const reelSet = FirejokerReels[this.rtp]?.reels;
    const bonusReel = FirejokerReels[this.rtp]?.bonusReel;
    
    if (!reelSet || !bonusReel) {
      throw new Error(`Invalid RTP value: ${this.rtp}`);
    }
    
    const frame: number[][] = [];
    
    // First column
    const reel1 = reelSet[0];
    const startPos1 = Math.floor(Math.random() * reel1.length);
    frame.push([
      reel1[(startPos1) % reel1.length],
      reel1[(startPos1 + 1) % reel1.length],
      reel1[(startPos1 + 2) % reel1.length]
    ]);
    
    // Center big symbol (appears on reels 2, 3, 4)
    const bigSymbolIndex = Math.floor(Math.random() * bonusReel.length);
    const bigSymbol = bonusReel[bigSymbolIndex];
    
    // Fill center columns with the big symbol
    frame.push([bigSymbol, bigSymbol, bigSymbol]);
    frame.push([bigSymbol, bigSymbol, bigSymbol]);
    frame.push([bigSymbol, bigSymbol, bigSymbol]);
    
    // Last column
    const reel5 = reelSet[4];
    const startPos5 = Math.floor(Math.random() * reel5.length);
    frame.push([
      reel5[(startPos5) % reel5.length],
      reel5[(startPos5 + 1) % reel5.length],
      reel5[(startPos5 + 2) % reel5.length]
    ]);
    
    return frame;
  }
  
  /**
   * Counts the number of scatter symbols on the frame
   * @param frame Current game frame
   * @param scatterSymbol Symbol to count (usually Bonus = 8)
   * @returns Number of scatter symbols found
   */
  countScatters(frame: number[][], scatterSymbol: number = FirejokerSymbol.Bonus): number {
    let count = 0;
    
    // Count scatter symbols in each column
    for (let col = 0; col < frame.length; col++) {
      for (let row = 0; row < frame[col].length; row++) {
        if (frame[col][row] === scatterSymbol) {
          count++;
        }
      }
    }
    
    return count;
  }
  
  /**
   * Calculate scatter wins for the current frame
   * @param frame Current game frame
   * @param bet Current bet amount
   * @returns Object with scatter wins and free spins
   */
  calculateScatterWins(frame: number[][], bet: number): { 
    scatterWin: number,
    freeSpins: number 
  } {
    const scatterCount = this.countScatters(frame);
    
    // No scatter win with less than 2 scatter symbols
    if (scatterCount < 2) {
      return { scatterWin: 0, freeSpins: 0 };
    }
    
    // Look up win multiplier and free spins from tables
    const index = Math.min(scatterCount - 1, ScatterPayTable.length - 1);
    const multiplier = ScatterPayTable[index];
    const freeSpins = ScatterFreeSpinsTable[index];
    
    // Calculate scatter win
    const scatterWin = bet * multiplier * BetLines.length;
    
    return { scatterWin, freeSpins };
  }
  
  /**
   * Process a spin for the Firejoker game
   * @param bet Current bet amount
   * @param balance Current balance
   * @param gameMode Current game mode
   * @param freeSpinsRemaining Remaining free spins, if any
   * @returns Complete round data
   */
  spin(
    bet: number,
    balance: number,
    gameMode: GameMode = GameMode.Regular,
    freeSpinsRemaining: number = 0
  ): FirejokerRound {
    // Generate frame based on game mode
    const frame = gameMode === GameMode.Regular 
      ? this.generateFrame() 
      : this.generateFreeSpinsFrame();
    
    // Get winning paylines
    const paylines = getWinningPaylines(frame, bet);
    
    // Calculate total line wins
    let lineWin = 0;
    paylines.forEach(line => {
      lineWin += line.value;
    });
    
    // Calculate scatter wins and free spins
    const { scatterWin, freeSpins } = this.calculateScatterWins(frame, bet);
    
    // Calculate total win
    const totalWin = lineWin + scatterWin;
    
    // Determine if we should switch to free spins mode
    let nextGameMode = gameMode;
    let newFreeSpins = 0;
    let remainingFreeSpins = freeSpinsRemaining;
    
    if (gameMode === GameMode.Regular && freeSpins > 0) {
      // Switch to free spins mode
      nextGameMode = GameMode.FreeSpins;
      newFreeSpins = freeSpins;
      remainingFreeSpins = freeSpins;
    } else if (gameMode === GameMode.FreeSpins) {
      // Decrement free spins
      remainingFreeSpins--;
      
      // Check if we need to switch back
      if (remainingFreeSpins <= 0) {
        nextGameMode = GameMode.Regular;
      }
    }
    
    // Calculate new balance
    // Only deduct bet in regular mode; free spins are free
    const betCost = gameMode === GameMode.Regular ? bet : 0;
    const newBalance = balance - betCost + totalWin;
    
    // Return round data
    return {
      roundId: uuidv4(),
      bet,
      totalFreespins: gameMode === GameMode.FreeSpins ? remainingFreeSpins : 0,
      freeSpinsRemaining: remainingFreeSpins,
      newFreespins: newFreeSpins,
      balance: newBalance,
      totalWin,
      currentGameMode: gameMode,
      nextGameMode,
      frame,
      paylines,
      freeRoundCampaign: null,
      endedUtc: new Date().toISOString()
    };
  }
}