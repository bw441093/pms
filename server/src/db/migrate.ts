import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function main() {
	await migrate(drizzle('postgres://postgres:secret@localhost:5432/pms?sslmode=disable'), {
		migrationsFolder: './src/db/migrations',
	});
}

main();
