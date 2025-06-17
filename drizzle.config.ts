import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './server/db/schema.ts',
	out: './server/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: 'postgres://postgres:secret@localhost:5432/pms',
	},
	strict: true,
});
