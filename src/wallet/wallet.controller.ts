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