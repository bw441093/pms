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
	manager: uuid('manager_id').references((): AnyPgColumn => PersonsTable.id),
	alertStatus: text({ enum: ['pending', 'good', 'bad'] })
		.default('good')
		.notNull(),
	reportStatus: text().default('present').notNull(),
	location: text().default('home').notNull(),
	serviceType: text({ enum: ['hova', 'keva', 'miluim', 'aatz', 'ps'] })
		.notNull()
		.default('hova'),
	updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
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
		field: text({ enum: ['site', 'manager'] })
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

export const RolesTable = pgTable('roles', {
	id: uuid('role_id').defaultRandom().notNull().primaryKey(),
	name: text().notNull(),
	opts: json(),
});

export const PersonsToRoles = pgTable(
	'persons_to_roles',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => PersonsTable.id, { onDelete: 'cascade' }),
		roleId: uuid('role_id')
			.notNull()
			.references(() => RolesTable.id, { onDelete: 'cascade' }),
	},
	(t) => [primaryKey({ columns: [t.userId, t.roleId] })]
);

// Relations

export const PersonsRelations = relations(PersonsTable, ({ one, many }) => ({
	manager: one(PersonsTable, {
		fields: [PersonsTable.manager],
		references: [PersonsTable.id],
	}),
	personRoles: many(PersonsToRoles),
	transaction: one(TransactionsTable),
}));

export const RolesRelations = relations(RolesTable, ({ many }) => ({
	PersonsToRoles: many(PersonsToRoles),
}));

export const TransactionRelations = relations(TransactionsTable, ({ one }) => ({
	person: one(PersonsTable, {
		fields: [TransactionsTable.userId],
		references: [PersonsTable.id],
	}),
}));

export const PersonsToRolesRelations = relations(PersonsToRoles, ({ one }) => ({
	role: one(RolesTable, {
		fields: [PersonsToRoles.roleId],
		references: [RolesTable.id],
	}),
	person: one(PersonsTable, {
		fields: [PersonsToRoles.userId],
		references: [PersonsTable.id],
	}),
}));
