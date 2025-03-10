export class Session {
    id: string;
    playerId: string;
    gameId: string;
    isActive: boolean;
    data?: any;
    startTime: Date;
    endTime?: Date;
    createdAt: Date;
    updatedAt: Date;
  
    constructor(partial: Partial<Session>) {
      Object.assign(this, partial);
      this.createdAt = this.createdAt || new Date();
      this.updatedAt = this.updatedAt || new Date();
      this.startTime = this.startTime || new Date();
      this.isActive = this.isActive !== undefined ? this.isActive : true;
    }
  }