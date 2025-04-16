import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;
const connectionString = 'postgresql://neondb_owner:npg_nqC4bJhv8mZs@ep-muddy-star-abprenmt-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'

export const pool = new Pool({ 
  connectionString: connectionString,
   max: 20,  // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection not established
});

// Add error handler to the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle({ client: pool, schema });
