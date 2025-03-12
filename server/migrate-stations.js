// @ts-check

import postgres from 'postgres';

/**
 * This script handles the migration of game stations to support the new station management features
 * - Creates the station_maintenance_status enum if it doesn't exist
 * - Creates the station_category_type enum if it doesn't exist
 * - Creates the station_categories table if it doesn't exist
 * - Adds new columns to the game_stations table
 */

async function migrateStationsSchema() {
  // Connect to the database
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log('Starting station management migration...');

    // Check if the maintenance status enum exists
    const maintenanceEnumExists = await sql`
      SELECT true FROM pg_type 
      WHERE typname = 'station_maintenance_status'
    `;

    if (maintenanceEnumExists.length === 0) {
      console.log('Creating station_maintenance_status enum...');
      await sql`
        CREATE TYPE station_maintenance_status AS ENUM (
          'operational', 'maintenance', 'repair', 'offline'
        )
      `;
      console.log('station_maintenance_status enum created successfully');
    } else {
      console.log('station_maintenance_status enum already exists');
    }

    // Check if the category type enum exists
    const categoryTypeEnumExists = await sql`
      SELECT true FROM pg_type 
      WHERE typname = 'station_category_type'
    `;

    if (categoryTypeEnumExists.length === 0) {
      console.log('Creating station_category_type enum...');
      await sql`
        CREATE TYPE station_category_type AS ENUM (
          'console', 'pc', 'vr', 'racing', 'arcade', 'mobile', 'other'
        )
      `;
      console.log('station_category_type enum created successfully');
    } else {
      console.log('station_category_type enum already exists');
    }

    // Check if station_categories table exists
    const categoriesTableExists = await sql`
      SELECT true FROM pg_tables
      WHERE tablename = 'station_categories'
    `;

    if (categoriesTableExists.length === 0) {
      console.log('Creating station_categories table...');
      await sql`
        CREATE TABLE station_categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          type station_category_type NOT NULL,
          description TEXT,
          color TEXT DEFAULT '#6366F1',
          icon TEXT DEFAULT 'gamepad',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      console.log('station_categories table created successfully');

      // Insert default categories
      console.log('Adding default categories...');
      await sql`
        INSERT INTO station_categories (name, type) VALUES
        ('PlayStation', 'console'),
        ('Xbox', 'console'),
        ('Gaming PC', 'pc'),
        ('VR Station', 'vr'),
        ('Racing Simulator', 'racing'),
        ('Arcade', 'arcade')
      `;
      console.log('Default categories added successfully');
    } else {
      console.log('station_categories table already exists');
    }

    // Check and add columns to game_stations table
    console.log('Checking game_stations table columns...');
    
    // Get existing columns
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'game_stations'
    `;
    
    const existingColumns = columns.map(col => col.column_name);
    console.log('Existing columns:', existingColumns);

    // Define new columns to add
    const columnsToAdd = [
      { name: 'category_id', type: 'INTEGER' },
      { name: 'status', type: 'station_maintenance_status DEFAULT \'operational\''  },
      { name: 'specs', type: 'TEXT' },
      { name: 'location', type: 'TEXT' },
      { name: 'peak_hour_rate', type: 'INTEGER' },
      { name: 'off_peak_rate', type: 'INTEGER' },
      { name: 'weekend_rate', type: 'INTEGER' },
      { name: 'last_maintenance', type: 'TIMESTAMP' },
      { name: 'next_maintenance', type: 'TIMESTAMP' },
      { name: 'notes', type: 'TEXT' }
    ];

    // Add missing columns
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`Adding column ${column.name} to game_stations table...`);
        try {
          await sql`
            ALTER TABLE game_stations 
            ADD COLUMN ${sql(column.name)} ${sql.unsafe(column.type)}
          `;
          console.log(`Column ${column.name} added successfully`);
        } catch (error) {
          console.error(`Error adding column ${column.name}:`, error.message);
        }
      } else {
        console.log(`Column ${column.name} already exists`);
      }
    }

    // Update existing game stations with categories if needed
    const stations = await sql`
      SELECT id FROM game_stations
      WHERE category_id IS NULL
    `;

    if (stations.length > 0) {
      console.log(`Updating ${stations.length} stations with default category...`);
      
      // Get the first category (likely "PlayStation")
      const defaultCategory = await sql`
        SELECT id FROM station_categories
        LIMIT 1
      `;
      
      if (defaultCategory.length > 0) {
        const categoryId = defaultCategory[0].id;
        await sql`
          UPDATE game_stations
          SET category_id = ${categoryId}
          WHERE category_id IS NULL
        `;
        console.log(`Updated stations with default category ID: ${categoryId}`);
      }
    }

    console.log('Station management migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await sql.end();
  }
}

migrateStationsSchema();