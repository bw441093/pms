import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';

import * as schema from './schema';

import { Pool } from 'pg';

const connectionOptions =
	process.env.ENV === 'dev'
		? {
				connectionString:
					process.env.DB_URI || 'postgres://postgres:secret@localhost:5432/pms',
		  }
		: {
				host: process.env.DB_HOST,
				user: process.env.DB_USER,
				password: process.env.DB_PASSWORD,
				port: Number(process.env.DB_PORT),
				database: process.env.DB_NAME,
				ssl: { rejectUnauthorized: false },
		  };

const pool = new Pool(connectionOptions);

export const connectDB = async () => await pool.connect();

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
