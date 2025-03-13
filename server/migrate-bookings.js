// @ts-check
import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Migration script to add 'note' field to the bookings table and update status enum
 */
async function migrateBookingsTable() {
  console.log('Starting migration for bookings table...');

  try {
    // Check if 'note' column exists in bookings table
    const noteColumnExists = await checkColumnExists('bookings', 'note');
    
    if (!noteColumnExists) {
      console.log('Adding note column to bookings table...');
      await drizzleDB.execute(sql`
        ALTER TABLE bookings 
        ADD COLUMN note text;
      `);
      console.log('✅ Successfully added note column');
    } else {
      console.log('Note column already exists in bookings table');
    }

    // Check and modify the status enum to include 'completed'
    console.log('Checking status enum values...');
    await drizzleDB.execute(sql`
      ALTER TABLE bookings 
      ALTER COLUMN status 
      TYPE text 
      USING status::text;
    `);
    
    console.log('Updated status column to accept new values');
    console.log('Migration for bookings table completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

/**
 * Check if a column exists in a table
 * @param {string} tableName 
 * @param {string} columnName 
 */
async function checkColumnExists(tableName, columnName) {
  const result = await drizzleDB.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = ${tableName}
    AND column_name = ${columnName}
  `);
  
  return result.rows.length > 0;
}

migrateBookingsTable();