export class Player {
  id: string;
  name: string;
  email: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Player>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }
}