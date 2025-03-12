import { db } from './db';
import { sql } from 'drizzle-orm';

// This script will add the missing columns to the games table
async function migrateGamesTable() {
  console.log('Starting games table migration...');
  
  try {
    // Check if columns already exist to avoid errors
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'games' AND column_name = 'description'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Adding description, pricePerSession, pricePerHour, and popularity columns...');
      
      // Add description column
      await db.execute(sql`
        ALTER TABLE games ADD COLUMN description TEXT
      `);
      
      // Add pricePerSession column with default
      await db.execute(sql`
        ALTER TABLE games ADD COLUMN price_per_session INTEGER DEFAULT 40
      `);
      
      // Add pricePerHour column with default
      await db.execute(sql`
        ALTER TABLE games ADD COLUMN price_per_hour INTEGER DEFAULT 200
      `);
      
      // Add popularity column with default
      await db.execute(sql`
        ALTER TABLE games ADD COLUMN popularity INTEGER DEFAULT 0
      `);
      
      console.log('Migration completed successfully!');
    } else {
      console.log('Columns already exist, no migration needed.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Execute the migration
migrateGamesTable()
  .then(() => {
    console.log('Migration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });