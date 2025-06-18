import { eq, inArray } from 'drizzle-orm';

import { db } from './db';
import { PersonsTable, PersonsToRoles, RolesTable } from './schema';
import type { Person } from '../types/person';

export const find = async (): Promise<Person[]> => {
	const user = await db.query.PersonsTable.findMany();

	return user;
};

export const findPersonById = async (id: string) => {
	const user = await db.query.PersonsTable.findFirst({
		where: eq(PersonsTable.id, id),
		with: {
			transaction: {
				columns: {
					userId: false,
				},
			},
			personRoles: {
				columns: { userId: false, roleId: false },
				with: {
					role: true,
				},
			},
		},
	});
	user?.personRoles;
	return user;
};

export const findManagers = async () => {
	const users = await db
		.select({
			userId: PersonsTable.id,
			name: PersonsTable.name,
			site: PersonsTable.site,
		})
		.from(PersonsTable)
		.innerJoin(PersonsToRoles, eq(PersonsTable.id, PersonsToRoles.userId))
		.innerJoin(RolesTable, eq(PersonsToRoles.roleId, RolesTable.id))
		.where(eq(RolesTable.name, 'personnelManager'));

	return users;
};

export const findDirectReports = async (id: string) => {
	const users = await db.query.PersonsTable.findMany({
		where: eq(PersonsTable.manager, id),
		with: {
			transaction: {
				columns: {
					userId: false,
				},
			},
		},
	});

	return users;
};

export const findSiteMembers = async (sites: string[] = []) => {
	const users = await db.query.PersonsTable.findMany({
		where: inArray(PersonsTable.site, sites),
		with: {
			transaction: {
				columns: {
					userId: false,
				},
			},
		},
	});

	return users;
};

export const createPerson = async (
	id: string,
	name: string,
	site: string,
	manager?: string
) => {
	const user = await db
		.insert(PersonsTable)
		.values({ id, name, site, manager })
		.returning({ id: PersonsTable.id });

	return user;
};

export const updatePersonStatusLocation = async (
	id: string,
	status: string,
	location: string
) => {
	const user = await db
		.update(PersonsTable)
		.set({ reportStatus: status, location })
		.where(eq(PersonsTable.id, id))
		.returning({ id: PersonsTable.id });

	return user;
};

export const updatePersonManager = async (id: string, manager: string) => {
	const user = await db
		.update(PersonsTable)
		.set({ manager })
		.where(eq(PersonsTable.id, id))
		.returning({ id: PersonsTable.id });

	return user;
};

export const updatePersonSite = async (id: string, site: string) => {
	const user = await db
		.update(PersonsTable)
		.set({ site })
		.where(eq(PersonsTable.id, id))
		.returning({ id: PersonsTable.id });

	return user;
};

export const deletePerson = async (id: string) => {
	const user = await db
		.delete(PersonsTable)
		.where(eq(PersonsTable.id, id))
		.returning({ id: PersonsTable.id });

	return user;
};
