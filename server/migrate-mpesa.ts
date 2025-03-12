/**
 * Migration script to add M-Pesa API specific columns to the payments table
 */

import { db } from './db';
import { payments } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function migrateMPesaColumns() {
  console.log('Starting M-Pesa API migration...');

  try {
    // Add merchant_request_id column
    console.log('Adding merchant_request_id column...');
    await db.execute(
      sql`ALTER TABLE ${payments} ADD COLUMN IF NOT EXISTS merchant_request_id TEXT`
    );

    // Add checkout_request_id column
    console.log('Adding checkout_request_id column...');
    await db.execute(
      sql`ALTER TABLE ${payments} ADD COLUMN IF NOT EXISTS checkout_request_id TEXT`
    );

    // Add mpesa_ref column if it doesn't exist
    console.log('Adding mpesa_ref column...');
    await db.execute(
      sql`ALTER TABLE ${payments} ADD COLUMN IF NOT EXISTS mpesa_ref TEXT`
    );

    // Add user_id column
    console.log('Adding user_id column...');
    await db.execute(
      sql`ALTER TABLE ${payments} ADD COLUMN IF NOT EXISTS user_id INTEGER`
    );

    // Add split_payment column
    console.log('Adding split_payment column...');
    await db.execute(
      sql`ALTER TABLE ${payments} ADD COLUMN IF NOT EXISTS split_payment BOOLEAN DEFAULT FALSE`
    );

    // Add split_index column
    console.log('Adding split_index column...');
    await db.execute(
      sql`ALTER TABLE ${payments} ADD COLUMN IF NOT EXISTS split_index INTEGER`
    );

    // Add split_total column
    console.log('Adding split_total column...');
    await db.execute(
      sql`ALTER TABLE ${payments} ADD COLUMN IF NOT EXISTS split_total INTEGER`
    );

    console.log('M-Pesa API migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run migration
migrateMPesaColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });