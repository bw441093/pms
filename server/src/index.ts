// src/index.ts
import 'dotenv/config';
import type { Express } from 'express';
import { loadApp } from './server';
import { logger } from './logger';
import {
	UsersTable,
	PersonsTable,
	RolesTable,
	PersonsToRoles,
} from './db/schema';
import './db/snapshot';
import { db } from './db/db';
import { eq } from 'drizzle-orm';
import http from 'http';
import { WebSocketServer } from 'ws';
import { setWss } from './websocket';

const startServer = async () => {
	const app: Express = await loadApp();
	const port = process.env.PORT || 3000;
	const server = http.createServer(app);
	const wss = new WebSocketServer({ server });

	setWss(wss);

	server.listen(port, () => {
		logger.info(`Server is running at http://localhost:${port}`);
	});
};

const injectData = async () => {
	const userId = 'feb8bf9c-d2be-4f25-ad79-9d478af482a1';
	const roleId = '6f0757b0-c371-4bb4-bde9-d71dc394d85f';

	const user: typeof UsersTable.$inferInsert = {
		id: userId,
		email: process.env.ADMIN_EMAIL || 'benjaminw@example.com',
	};

	const person: typeof PersonsTable.$inferInsert = {
		id: userId,
		name: 'admin mcadmin',
		site: 'mbt',
		location: 'mbt',
		alertStatus: 'good',
		reportStatus: 'present',
		serviceType: 'keva',
	};

	const role: typeof RolesTable.$inferInsert = {
		id: roleId,
		name: 'admin',
	};

	const personToRole: typeof PersonsToRoles.$inferInsert = {
		roleId: roleId,
		userId: userId,
	};

	const dbCheck = await db.query.PersonsTable.findFirst({
		where: eq(PersonsTable.id, person.id),
	});
	if (!dbCheck) {
		await db.insert(UsersTable).values(user);
		await db.insert(PersonsTable).values(person);
		await db.insert(RolesTable).values(role);
		await db.insert(PersonsToRoles).values(personToRole);
		logger.info('Injected objects into db');
	}
};

injectData(); // TBD - should be removed
startServer();
