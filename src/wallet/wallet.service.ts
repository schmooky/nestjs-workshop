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