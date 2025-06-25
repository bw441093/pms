import { Request, Response } from 'express';
import { db } from '../db/db';
import { desc, sql } from 'drizzle-orm';

export const getSnapshotDatesHandler = async (req: Request, res: Response) => {
	try {
		const snapshots = await db.execute<{ table_name: string }>(sql`
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_name LIKE 'persons_%'
				AND table_name ~ '^persons_[0-9]{8}$'
			ORDER BY table_name DESC`);

		const dates = snapshots.rows.map((s: { table_name: string }) => s.table_name.split('_')[1]);
		return res.json(dates);
	} catch (error) {
		console.error('Error getting snapshot dates:', error);
		return res.status(500).json({ error: 'Failed to get snapshot dates' });
	}
};

export const getSnapshotByDateHandler = async (req: Request, res: Response) => {
	try {
		const { dateStr } = req.params as { dateStr: string };
		if (!dateStr) {
			return res.status(400).json({ error: 'Date is required' });
		}

		const snapshot = await db.execute(sql`
			SELECT * FROM persons_${sql.raw(dateStr)}
		`);

		if (!snapshot) {
			return res.status(404).json({ error: 'Snapshot not found' });
		}

		return res.json(snapshot.rows);
	} catch (error) {
		console.error('Error getting snapshot:', error);
		return res.status(500).json({ error: 'Failed to get snapshot' });
	}
};
