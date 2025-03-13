/**
 * Migration script to add the category column to the games table and update the game category enum
 */
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateGameCategories() {
  const client = await pool.connect();
  
  try {
    console.log('Starting game categories migration...');
    await client.query('BEGIN');
    
    // Check if game_category enum type already exists
    const enumCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'game_category'
      );
    `);
    
    const enumExists = enumCheckResult.rows[0].exists;
    
    if (!enumExists) {
      console.log('Creating game_category enum type...');
      await client.query(`
        CREATE TYPE game_category AS ENUM (
          'action', 'adventure', 'rpg', 'strategy', 'simulation', 
          'sports', 'racing', 'puzzle', 'fighting', 'shooter', 'mmo', 'other'
        );
      `);
    } else {
      console.log('game_category enum type already exists');
    }
    
    // Check if category column exists in games table
    const columnCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'category'
      );
    `);
    
    const columnExists = columnCheckResult.rows[0].exists;
    
    if (!columnExists) {
      console.log('Adding category column to games table...');
      await client.query(`
        ALTER TABLE games 
        ADD COLUMN category game_category DEFAULT 'other';
      `);
    } else {
      console.log('category column already exists in games table');
    }
    
    await client.query('COMMIT');
    console.log('Game categories migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during game categories migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
migrateGameCategories()
  .then(() => {
    console.log('Migration complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });

export { migrateGameCategories };