import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';

import * as schema from './schema';

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DB_URI || 'postgres://postgres:secret@localhost:5432/pms?sslmode=prefer',
  ssl: 	{ rejectUnauthorized: false }  
});

export const connectDB = async () => await pool.connect()

export const db: NodePgDatabase<typeof schema> = drizzle(pool);
