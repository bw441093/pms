import { relations } from 'drizzle-orm';
import {
	type AnyPgColumn,
	boolean,
	json,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
	unique,
} from 'drizzle-orm/pg-core';

export const UsersTable = pgTable('users', {
	id: uuid('user_id').primaryKey().defaultRandom().notNull(),
	email: text().notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const PersonsTable = pgTable('persons', {
	id: uuid('user_id').notNull().primaryKey(),
	name: text().notNull(),
	site: text().notNull(),
	alertStatus: text({ enum: ['pending', 'good', 'bad'] })
		.default('good')
		.notNull(),
	reportStatus: text().default('present').notNull(),
	location: text().default('home').notNull(),
	serviceType: text({ enum: ['hova', 'keva', 'miluim', 'aatz', 'ps'] })
		.notNull()
		.default('hova'),
	updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
	approvedBy: text('approvedBy'),
});

export const TransactionsTable = pgTable(
	'transactions',
	{
		id: uuid('transaction_id') // Change this to transaction_id to better represent a transaction.
			.primaryKey()
			.defaultRandom()
			.notNull(),
		origin: text().notNull(),
		target: text().notNull(),
		originConfirmation: boolean().default(false).notNull(),
		targetConfirmation: boolean().default(false).notNull(),
		field: text({ enum: ['site'] })
			.default('site')
			.notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		status: text({ enum: ['pending', 'resolved'] })
			.default('pending')
			.notNull(),
		userId: uuid('user_id') // Add the correct person reference
			.references(() => PersonsTable.id, { onDelete: 'cascade' })
			.notNull(),
	},
	(t) => ({
		userUnique: unique('transactions_user_id_unique').on(t.userId),
	})
);

export const SystemRolesTable = pgTable('system_roles', {
	id: uuid('role_id').defaultRandom().notNull().primaryKey(),
	name: text().notNull(),
	opts: json(),
});

export const PersonsToSystemRoles = pgTable(
	'persons_to_system_roles',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => PersonsTable.id, { onDelete: 'cascade' }),
		roleId: uuid('role_id')
			.notNull()
			.references(() => SystemRolesTable.id, { onDelete: 'cascade' }),
	},
	(t) => [primaryKey({ columns: [t.userId, t.roleId] })]
);

export const GroupsTable = pgTable('groups', {
	groupId: uuid('group_id').defaultRandom().notNull().primaryKey(),
	name: text().notNull(),
	command: boolean().default(false).notNull(),
	site: boolean().default(false).notNull(),
});

export const PersonsToGroups = pgTable(
	'persons_to_groups',
	{
		personId: uuid('person_id')
			.notNull()
			.references(() => PersonsTable.id, { onDelete: 'cascade' }),
		groupId: uuid('group_id')
			.notNull()
			.references(() => GroupsTable.groupId, { onDelete: 'cascade' }),
		groupRole: text({ enum: ['admin', 'member'] }).notNull(),
	},
	(t) => [primaryKey({ columns: [t.personId, t.groupId] })]
);

export const EventsTable = pgTable('events', {
	eventId: uuid('event_id').defaultRandom().notNull(),
	entityId: uuid('entity_id')
		.notNull(),
	entityType: text({ enum: ['person', 'group'] }).notNull(),
	startTime: timestamp('start_time').notNull(),
	endTime: timestamp('end_time').notNull(),
	title: text().notNull(),
	description: text().notNull(),
	location: text().notNull(),
	mandatory: boolean().notNull(),
	insider: boolean().notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
},
	(t) => [primaryKey({ columns: [t.entityId, t.eventId] })]
);


// Relations
export const PersonsRelations = relations(PersonsTable, ({ one, many }) => ({
	personSystemRoles: many(PersonsToSystemRoles),
	transaction: one(TransactionsTable),
}));

export const SystemRolesRelations = relations(SystemRolesTable, ({ many }) => ({
	PersonsToSystemRoles: many(PersonsToSystemRoles),
}));

export const TransactionRelations = relations(TransactionsTable, ({ one }) => ({
	person: one(PersonsTable, {
		fields: [TransactionsTable.userId],
		references: [PersonsTable.id],
	}),
}));

export const PersonsToSystemRolesRelations = relations(PersonsToSystemRoles, ({ one }) => ({
	role: one(SystemRolesTable, {
		fields: [PersonsToSystemRoles.roleId],
		references: [SystemRolesTable.id],
	}),
	person: one(PersonsTable, {
		fields: [PersonsToSystemRoles.userId],
		references: [PersonsTable.id],
	}),
}));

export const GroupsRelations = relations(GroupsTable, ({ many }) => ({
	personsToGroups: many(PersonsToGroups),
}));

export const PersonsToGroupsRelations = relations(PersonsToGroups, ({ one }) => ({
	person: one(PersonsTable, {
		fields: [PersonsToGroups.personId],
		references: [PersonsTable.id],
	}),
	group: one(GroupsTable, {
		fields: [PersonsToGroups.groupId],
		references: [GroupsTable.groupId],
	}),
}));
