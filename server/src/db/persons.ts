import { eq, inArray } from 'drizzle-orm';

import { db } from './db';
import { PersonsTable, PersonsToRoles, RolesTable } from './schema';

export const find = async () => {
	const user = await db.query.PersonsTable.findMany({
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
			manager: {
				columns: {
					id: true,
					name: true,
				},
			},
		},
	});

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
			manager: {
				columns: {
					id: true,
					name: true,
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
			manager: {
				columns: {
					id: true,
					name: true,
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
			manager: {
				columns: {
					id: true,
					name: true,
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
		.set({ reportStatus: status, location, updatedAt: new Date() })
		.where(eq(PersonsTable.id, id))
		.returning({ id: PersonsTable.id });

	return user;
};

export const updatePersonManager = async (id: string, manager: string) => {
	const user = await db
		.update(PersonsTable)
		.set({ manager, updatedAt: new Date() })
		.where(eq(PersonsTable.id, id))
		.returning({ id: PersonsTable.id });

	return user;
};

export const updatePersonSite = async (id: string, site: string) => {
	const user = await db
		.update(PersonsTable)
		.set({ site, updatedAt: new Date() })
		.where(eq(PersonsTable.id, id))
		.returning({ id: PersonsTable.id });

	return user;
};

export const updatePersonAlertStatus = async (
	id: string,
	alertStatus: 'pending' | 'good' | 'bad'
) => {
	const user = await db
		.update(PersonsTable)
		.set({ alertStatus, updatedAt: new Date() })
		.where(eq(PersonsTable.id, id))
		.returning({ id: PersonsTable.id });

	return user;
};

export const updateAlertStatus = async () => {
	const user = await db
		.update(PersonsTable)
		.set({ alertStatus: 'pending', updatedAt: new Date() });

	return user;
};

export const deletePerson = async (id: string) => {
	const user = await db
		.delete(PersonsTable)
		.where(eq(PersonsTable.id, id))
		.returning({ id: PersonsTable.id });

	return user;
};

export const updatePersonDetails = async (
	id: string,
	updates: {
		name?: string;
		manager?: string;
		site?: string;
	}
) => {
	const updateData: any = { updatedAt: new Date() };
	
	if (updates.name !== undefined) updateData.name = updates.name;
	if (updates.manager !== undefined) updateData.manager = updates.manager;
	if (updates.site !== undefined) updateData.site = updates.site;

	const user = await db
		.update(PersonsTable)
		.set(updateData)
		.where(eq(PersonsTable.id, id))
		.returning({ id: PersonsTable.id });

	return user;
};
