#!/usr/bin/env node

import { spawn } from 'child_process';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './shared/schema.js';

/**
 * This script handles database migration safely with column existence checks
 * 
 * It performs the following:
 * 1. Runs a pre-flight check to determine what columns exist in the transactions table
 * 2. Creates any missing columns using ALTER TABLE statements
 * 3. Uses drizzle-kit push for the remaining schema changes
 */

async function ensureColumns() {
  // Connect to the database
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    // Use migrator
    console.log('Running schema migrations...');
    const migrationClient = postgres(connectionString, { max: 1 });
    const db = drizzle(migrationClient);

    // Check for transaction table columns that might be missing
    const results = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
    `);
    
    const existingColumns = results.rows.map(row => row.column_name);
    console.log('Existing columns in transactions table:', existingColumns);

    // Define columns that should exist
    const requiredColumns = [
      { name: 'mpesa_checkout_id', definition: 'TEXT' },
      { name: 'airtel_ref', definition: 'TEXT' }
    ];

    // Add missing columns
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`Adding missing column: ${column.name}`);
        try {
          await db.execute(`
            ALTER TABLE transactions 
            ADD COLUMN ${column.name} ${column.definition}
          `);
          console.log(`Added column ${column.name} successfully`);
        } catch (error) {
          console.error(`Error adding column ${column.name}:`, error.message);
          // Continue with other columns
        }
      }
    }

    console.log('Column check and addition complete');
    await migrationClient.end();
  } catch (error) {
    console.error('Error during migration pre-check:', error);
  }
}

async function runMigration() {
  // First check and add any missing columns
  await ensureColumns();

  // Then run drizzle-kit push for the rest of the schema
  const process = spawn('npx', ['drizzle-kit', 'push'], { 
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
  
  process.on('close', (code) => {
    console.log(`Migration process exited with code ${code}`);
  });
}

runMigration();