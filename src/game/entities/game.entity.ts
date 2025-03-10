export class Game {
    id: string;
    name: string;
    description?: string;
    config?: any;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  
    constructor(partial: Partial<Game>) {
      Object.assign(this, partial);
      this.createdAt = this.createdAt || new Date();
      this.updatedAt = this.updatedAt || new Date();
      this.enabled = this.enabled !== undefined ? this.enabled : true;
    }
  }