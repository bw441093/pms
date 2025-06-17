import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';

import * as schema from './schema';

export const db: NodePgDatabase<typeof schema> = drizzle(
	process.env.DB_URI || 'postgres://postgres:secret@localhost:5432/pms',
	{
		schema,
	}
);
