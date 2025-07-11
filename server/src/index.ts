// src/index.ts
import 'dotenv/config';
import type { Express } from 'express';
import { loadApp } from './server';
import { logger } from './logger';
import {
	UsersTable,
	PersonsTable,
	SystemRolesTable,
	PersonsToSystemRoles,
	PersonsToGroups,
	GroupsTable,
	EventsTable,
} from './db/schema';
import './db/snapshot';
import './db/autoReport';
import { db } from './db/db';
import { eq } from 'drizzle-orm';
import http from 'http';
import { WebSocketServer } from 'ws';
import { setWss } from './websocket';
import { uuid } from 'drizzle-orm/gel-core';

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
	const groupId1 = '00bd8fc0-1d07-4f51-835f-79de9fa275e8';
	const groupId2 = '0236e4d0-7403-4288-a03a-7399f67c244d';
	const eventId = '0236e4d0-7403-4288-a03a-7399f67c2ddd';

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

	const role: typeof SystemRolesTable.$inferInsert = {
		id: roleId,
		name: 'admin',
	};

	const personToRole: typeof PersonsToSystemRoles.$inferInsert = {
		roleId: roleId,
		userId: userId,
	};

	const group1: typeof GroupsTable.$inferInsert = {
		groupId: groupId1,
		name: 'group1',
		command: true,
	};

	const group2: typeof GroupsTable.$inferInsert = {
		groupId: groupId2,
		name: 'group2',
		command: false,
	};

	const personToGroup: typeof PersonsToGroups.$inferInsert = {
		groupId: groupId1,
		personId: userId,
		groupRole: 'admin',
	};

	const event: typeof EventsTable.$inferInsert = {
		eventId: eventId,
		entityId: groupId1,
		entityType: 'group',
		location: 'location',
		startTime: new Date(),
		endTime: new Date(),
		title: 'title',
		description: 'description',
		mandatory: true,
		insider: true,
	};

	const dbCheck = await db.query.PersonsTable.findFirst({
		where: eq(PersonsTable.id, person.id),
	});

	if (!dbCheck) {
		await db.insert(UsersTable).values(user);
		await db.insert(PersonsTable).values(person);
		await db.insert(SystemRolesTable).values(role);
		await db.insert(PersonsToSystemRoles).values(personToRole);
		await db.insert(GroupsTable).values(group1);
		await db.insert(GroupsTable).values(group2);
		await db.insert(PersonsToGroups).values(personToGroup);
		await db.insert(EventsTable).values(event);
		logger.info('Injected objects into db');
	}
};

injectData(); // TBD - should be removed
startServer();
