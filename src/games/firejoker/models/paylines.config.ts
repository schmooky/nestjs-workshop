/**
 * Paylines for Firejoker slot game
 * Based on the original Go implementation
 * 
 * Paylines follow the Hot5 pattern from the original code:
 * - First value is the line ID
 * - Array represents the row positions for each reel (1-based, where 1 is top row)
 */
export const BetLines = [
    { id: 1, positions: [2, 2, 2, 2, 2] }, // Middle horizontal line
    { id: 2, positions: [1, 1, 1, 1, 1] }, // Top horizontal line
    { id: 3, positions: [3, 3, 3, 3, 3] }, // Bottom horizontal line
    { id: 4, positions: [1, 2, 3, 2, 1] }, // V-shape
    { id: 5, positions: [3, 2, 1, 2, 3] }  // Inverted V-shape
  ];
  
  /**
   * Converts payline format to match API expectations
   * Subtracts 1 from positions to make them 0-based for frontend
   */
  export const getAPIPaylines = () => {
    return BetLines.map(line => ({
      id: line.id,
      positions: line.positions.map(pos => pos - 1)
    }));
  };
  
  /**
   * Get a single payline by ID
   */
  export const getPayline = (id: number) => {
    return BetLines.find(line => line.id === id);
  };
  
  /**
   * Gets indexes for a specific symbol along a payline on a frame
   * Used for determining winning combinations
   * 
   * @param frame - The current game frame
   * @param paylineId - The payline ID to check
   * @param symbolId - The symbol to look for
   * @returns Array of indexes where the symbol was found in sequence from left, or empty array
   */
  export const getSymbolSequence = (
    frame: number[][],
    paylineId: number,
    symbolId: number
  ): number[] => {
    const payline = getPayline(paylineId);
    if (!payline) return [];
  
    const sequence: number[] = [];
    
    // Check for symbols from left to right
    for (let i = 0; i < frame.length; i++) {
      const rowIndex = payline.positions[i] - 1; // Convert to 0-based
      const symbol = frame[i][rowIndex];
      
      // Is the symbol we're looking for or a wild symbol (Joker = 9)
      if (symbol === symbolId || symbol === 9) {
        sequence.push(i);
      } else {
        break; // Stop on first non-matching symbol
      }
    }
    
    return sequence;
  };
  
  /**
   * Get all winning paylines for a frame
   * 
   * @param frame The current game frame
   * @param bet The current bet amount
   * @returns Array of winning paylines with their values
   */
  export const getWinningPaylines = (frame: number[][], bet: number) => {
    const winningPaylines: Array<{
        lineId: number,
        line: Array<any>,
        winType: 2, // Normal win
        value: number
      }> = [];
    
    for (const payline of BetLines) {
      // Check each possible symbol
      for (let symbolId = 1; symbolId <= 7; symbolId++) {
        const sequence = getSymbolSequence(frame, payline.id, symbolId);
        
        // Need at least 3 symbols to win
        if (sequence.length >= 3) {
          const payoutMultiplier = getPayoutMultiplier(symbolId, sequence.length);
          if (payoutMultiplier > 0) {
            winningPaylines.push({
              lineId: payline.id,
              line: payline.positions.map((pos, idx) => 
                sequence.includes(idx) ? pos - 1 : null
              ),
              winType: 2, // Normal win
              value: bet * payoutMultiplier
            });
          }
        }
      }
    }
    
    return winningPaylines;
  };
  
  /**
   * Get the payout multiplier for a symbol and number of appearances
   * 
   * @param symbolId The symbol ID
   * @param count Number of symbols in a row
   * @returns Payout multiplier
   */
  export function getPayoutMultiplier(symbolId: number, count: number): number {
    if (symbolId < 1 || symbolId > 9 || count < 3) return 0;
    
    // From the LinePayTable in reels.config.ts
    switch (symbolId) {
      case 1: // Seven
        return count === 3 ? 20 : count === 4 ? 50 : count === 5 ? 100 : 0;
      case 2: // Bell
      case 3: // Melon
        return count === 3 ? 10 : count === 4 ? 25 : count === 5 ? 50 : 0;
      case 4: // Plum
      case 5: // Orange
      case 6: // Lemon
      case 7: // Cherry
        return count === 3 ? 4 : count === 4 ? 10 : count === 5 ? 20 : 0;
      default:
        return 0;
    }
  }