import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

async function main() {
	console.log('🚀 Starting database migration...');
	
	// Use the same connection logic as your main app
	const connectionOptions =
		process.env.ENV === 'dev'
			? {
					connectionString: process.env.DB_URI,
			}
			: {
					host: process.env.DB_HOST,
					user: process.env.DB_USER,
					password: process.env.DB_PASSWORD,
					port: Number(process.env.DB_PORT),
					database: process.env.DB_NAME,
					ssl: { rejectUnauthorized: false },
			};

	console.log('📊 Connection options:', {
		...connectionOptions,
		password: connectionOptions.password ? '[HIDDEN]' : undefined,
		connectionString: connectionOptions.connectionString ? '[HIDDEN]' : undefined,
	});

	const pool = new Pool(connectionOptions);
	const db = drizzle(pool);

	try {
		console.log('🔄 Running migrations...');
		await migrate(db, {
			migrationsFolder: './src/db/migrations',
		});
		console.log('✅ Migrations completed successfully!');
	} catch (error) {
		console.error('❌ Migration failed:', error);
		throw error;
	} finally {
		await pool.end();
		console.log('🔌 Database connection closed');
	}
}

main()
	.then(() => {
		console.log('🎉 Migration process completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Migration process failed:', error);
		process.exit(1);
	});
