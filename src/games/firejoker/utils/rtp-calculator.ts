import { FirejokerGameEngine } from './game-engine';
import { GameMode } from '../firejoker.types';

/**
 * RTP Calculator for Firejoker slot game
 * This simulates many spins to verify the expected RTP (Return To Player) percentage
 */
export class RTPCalculator {
  private engine: FirejokerGameEngine;
  private simulations = 0;
  private totalBet = 0;
  private totalWin = 0;
  private regularWins = 0;
  private regularBets = 0;
  private freeSpinWins = 0;
  private freeSpinsTriggered = 0;
  
  constructor(rtp: string) {
    this.engine = new FirejokerGameEngine(rtp);
  }
  
  /**
   * Run a simulation to calculate the RTP
   * @param simulations Number of spins to simulate
   * @param bet Bet amount to use
   * @returns RTP percentage and statistics
   */
  public simulate(simulations: number, bet: number = 1): RTPResult {
    this.simulations = 0;
    this.totalBet = 0;
    this.totalWin = 0;
    this.regularWins = 0;
    this.regularBets = 0;
    this.freeSpinWins = 0;
    this.freeSpinsTriggered = 0;
    
    let balance = 100000; // Starting balance
    let freeSpinsRemaining = 0;
    let gameMode = GameMode.Regular;
    
    for (let i = 0; i < simulations; i++) {
      this.simulations++;
      
      // Spin the reels
      const round = this.engine.spin(bet, balance, gameMode, freeSpinsRemaining);
      
      // Update balance
      balance = round.balance;
      
      // Update game mode and free spins
      gameMode = round.nextGameMode;
      freeSpinsRemaining = round.freeSpinsRemaining || 0;
      
      // Track statistics
      if (round.currentGameMode === GameMode.Regular) {
        this.totalBet += bet;
        this.regularBets += bet;
        this.regularWins += round.totalWin;
        
        if (round.newFreespins > 0) {
          this.freeSpinsTriggered += round.newFreespins;
        }
      } else {
        this.freeSpinWins += round.totalWin;
      }
      
      this.totalWin += round.totalWin;
    }
    
    const rtpPercentage = (this.totalWin / this.totalBet) * 100;
    const regularRTP = (this.regularWins / this.regularBets) * 100;
    const freeGameContribution = (this.freeSpinWins / this.regularBets) * 100;
    
    return {
      rtpPercentage,
      regularRTP,
      freeGameContribution,
      freeSpinsFrequency: this.simulations / this.freeSpinsTriggered,
      simulations: this.simulations,
      totalBet: this.totalBet,
      totalWin: this.totalWin
    };
  }
}

export interface RTPResult {
  rtpPercentage: number;
  regularRTP: number;
  freeGameContribution: number;
  freeSpinsFrequency: number;
  simulations: number;
  totalBet: number;
  totalWin: number;
}