import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BURST_GAME_ID = 'fe418252-3db9-4ab9-8151-e848da2dd83e';

async function main() {
  try {
    // Create Burst game if it doesn't exist
    const gameExists = await prisma.game.findFirst({
      where: { id: BURST_GAME_ID }
    });
    
    if (!gameExists) {
      console.log('Creating Burst game...');
      await prisma.game.create({
        data: {
          id: BURST_GAME_ID,
          name: 'Burst',
          description: 'A mysterious slot game with features',
          enabled: true,
          config: {
            reels: 5,
            rows: 3,
            paylines: 20,
            volatility: 'medium',
            rtp: 96.5
          }
        }
      });
      console.log('Burst game created successfully');
    } else {
      console.log('Burst game already exists');
    }
    
    // Create demo player if none exist
    const playerCount = await prisma.player.count();
    if (playerCount === 0) {
      console.log('Creating demo player...');
      await prisma.player.create({
        data: {
          name: 'Demo Player',
          email: 'demo@example.com',
          balance: 6987138.25
        }
      });
      console.log('Demo player created successfully');
    } else {
      console.log('Players already exist, skipping demo player creation');
    }
    
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}