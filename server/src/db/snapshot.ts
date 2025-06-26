import cron from 'node-cron';
import { logger } from '../logger';
import { db } from './db';
import { sql } from 'drizzle-orm';

async function snapshotTable() {
	logger.info('Snapshotting table');
	const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
	const tableName = `persons_${date}`;
	await db.execute(
		sql`CREATE TABLE IF NOT EXISTS ${sql.identifier(
			tableName
		)} AS TABLE persons;`
	);
	logger.info(`Snapshot created: ${tableName}`);
}

async function deleteOldSnapshots() {
	const weekAgo = new Date();
	weekAgo.setDate(weekAgo.getDate() - 7);
	const weekAgoStr = weekAgo.toISOString().slice(0, 10).replace(/-/g, '');
	const res = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name LIKE 'persons_%' 
    AND table_name < ${`persons_${weekAgoStr}`}
  `);
	for (const row of res.rows) {
		logger.info(`Deleting old snapshot: ${row.table_name}`);
		await db.execute(
			sql`DROP TABLE IF EXISTS ${sql.identifier(row.table_name as string)}`
		);
		logger.info(`Deleted old snapshot: ${row.table_name}`);
	}
}

cron.schedule('0 0 * * *', () => {
	logger.info('Snapshot job triggered');
	deleteOldSnapshots().catch(logger.error);
	snapshotTable().catch(logger.error);
});
