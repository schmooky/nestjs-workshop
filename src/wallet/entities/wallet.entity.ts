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