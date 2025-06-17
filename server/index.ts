// src/index.ts
import { Express } from 'express';
import { loadApp } from './server';
import { logger } from './logger';
import {
	UsersTable,
	PersonsTable,
	TransactionsTable,
	RolesTable,
	PersonsToRoles,
} from './db/schema';
import { db } from './db/db';
import { eq } from 'drizzle-orm';

const startServer = async () => {
	const app: Express = await loadApp();
	const port = process.env.PORT || 3000;

	app.listen(port, () => {
		logger.info(`Server is running at http://localhost:${port}`);
	});
};

const injectData = async () => {
	const user: typeof UsersTable.$inferInsert = {
		id: 'feb8bf9c-d2be-4f25-ad79-9d478af482a1',
		username: 'benjaminw',
		password: 'some:md5',
		twoFactorSecret: 'some:token',
	};

	const person: typeof PersonsTable.$inferInsert = {
		id: 'feb8bf9c-d2be-4f25-ad79-9d478af482a1',
		name: 'benjamin weiner',
		site: 'mbt',
		location: 'mbt',
		alertStatus: 'good',
		reportStatus: 'present',
	};

	const transaction: typeof TransactionsTable.$inferInsert = {
		id: 'feb8bf9c-d2be-4f25-ad79-9d478af482a1',
		userId: 'feb8bf9c-d2be-4f25-ad79-9d478af482a1',
		origin: 'mbt',
		originConfirmation: false,
		target: 'kir',
		targetConfirmation: false,
		status: 'pending',
	};

	const role: typeof RolesTable.$inferInsert = {
		id: '6f0757b0-c371-4bb4-bde9-d71dc394d85f',
		name: 'admin',
	};

	const personToRole: typeof PersonsToRoles.$inferInsert = {
		roleId: '6f0757b0-c371-4bb4-bde9-d71dc394d85f',
		userId: 'feb8bf9c-d2be-4f25-ad79-9d478af482a1',
	};

	const dbCheck = await db.query.PersonsTable.findFirst({
		where: eq(PersonsTable.id, 'feb8bf9c-d2be-4f25-ad79-9d478af482a1'),
	});
	if (!dbCheck) {
		await db.insert(UsersTable).values(user);
		await db.insert(PersonsTable).values(person);
		await db.insert(TransactionsTable).values(transaction);
		await db.insert(RolesTable).values(role);
		await db.insert(PersonsToRoles).values(personToRole);
	}
};

injectData(); // TBD - should be removed
startServer();
