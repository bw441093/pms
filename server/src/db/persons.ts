import { and, eq, inArray } from 'drizzle-orm';

import { db } from './db';
import { PersonsTable, PersonsToSystemRoles, SystemRolesTable, PersonsToGroups, GroupsTable } from './schema';

export const find = async () => {
	const user = await db.query.PersonsTable.findMany({
		with: {
			transaction: {
				columns: {
					userId: false,
				},
			},
			personSystemRoles: {
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
			personSystemRoles: {
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
	user?.personSystemRoles;
	return user;
};

export const findManagers = async () => {
	const users = await db
		.select({
			userId: PersonsTable.id,
			name: PersonsTable.name,
			site: PersonsTable.site,
			groupId: GroupsTable.groupId,
			groupName: GroupsTable.name,
		})
		.from(PersonsTable)
		.innerJoin(PersonsToGroups, eq(PersonsTable.id, PersonsToGroups.personId))
		.innerJoin(GroupsTable, eq(PersonsToGroups.groupId, GroupsTable.groupId))
		.where(and(eq(PersonsToGroups.groupRole, 'admin'), eq(GroupsTable.command, true)));

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

export const findSiteMembers = async (sites: string[] = [], userId: string | undefined) => {
	const query = userId ? and(inArray(PersonsTable.site, sites), eq(PersonsTable.manager, userId)) : inArray(PersonsTable.site, sites);
	const users = await db.query.PersonsTable.findMany({
		where: query,
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
	manager?: string,
	serviceType?: string
) => {
	const updateData: any = { id, name, site, serviceType };
	if (manager) updateData.manager = manager;
	const user = await db
		.insert(PersonsTable)
		.values(updateData)
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
		serviceType?: string;
	}
) => {
	const updateData: any = { updatedAt: new Date() };
	
	if (updates.name !== undefined) updateData.name = updates.name;
	if (updates.manager !== undefined) updateData.manager = updates.manager;
	if (updates.site !== undefined) updateData.site = updates.site;
	if (updates.serviceType !== undefined) updateData.serviceType = updates.serviceType;
	const user = await db
		.update(PersonsTable)
		.set(updateData)
		.where(eq(PersonsTable.id, id))
		.returning({ id: PersonsTable.id });

	return user;
};

export const findSitePersons = async (userId: string) => {
	// Get the user's siteManager roles and their opts (site names)
	const roles = await db.query.PersonsToSystemRoles.findMany({
		where: (ptsr) => eq(ptsr.userId, userId),
		with: { role: true }
	});
	
	// Collect all sites from all siteManager roles (in case of multiple)
	const sites: string[] = roles
		.filter(r => r.role.name === 'siteManager' && Array.isArray(r.role.opts))
		.flatMap(r => r.role.opts as string[]);
	
	if (!sites.length) return [];

	// Find all persons whose site is in the managed sites
	return await db.query.PersonsTable.findMany({
		where: (fields) => inArray(fields.site, sites)
	});
};
