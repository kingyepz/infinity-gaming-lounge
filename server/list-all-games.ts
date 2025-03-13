
import { db } from './db';
import { games } from '../shared/schema';

async function listAllGames() {
  try {
    // Query all games from the database
    const allGames = await db.select().from(games);
    
    console.log('\n===== GAME CATALOG =====');
    console.log(`Total games: ${allGames.length}\n`);
    
    if (allGames.length === 0) {
      console.log('No games found in the database.');
    } else {
      // Display each game with its details
      allGames.forEach((game, index) => {
        console.log(`Game #${index + 1}: ${game.name}`);
        console.log(`ID: ${game.id}`);
        console.log(`Description: ${game.description || 'No description provided'}`);
        console.log(`Price Per Game: KES ${game.pricePerSession || 40}`);
        console.log(`Price Per Hour: KES ${game.pricePerHour || 200}`);
        console.log(`Status: ${game.isActive ? 'Active' : 'Inactive'}`);
        console.log(`Popularity: ${game.popularity || 0}`);
        console.log('------------------------\n');
      });
    }
    
    console.log('===== END OF CATALOG =====\n');
  } catch (error) {
    console.error('Error fetching games:', error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the function
listAllGames();
