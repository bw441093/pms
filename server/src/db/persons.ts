import { and, eq, inArray } from 'drizzle-orm';

import { db } from './db';
import { PersonsTable, PersonsToSystemRoles, SystemRolesTable, PersonsToGroups, GroupsTable } from './schema';

// Helper function to find the actual manager based on group hierarchy
const findActualManager = async (personId: string) => {
	// Find command groups where this person is a member
	const memberGroups = await db.query.PersonsToGroups.findMany({
		where: (ptg) => and(eq(ptg.personId, personId), eq(ptg.groupRole, 'member')),
		with: { 
			group: true
		}
	});

	// Filter for command groups only
	const commandGroupIds = memberGroups
		.filter(ptg => ptg.group.command)
		.map(ptg => ptg.groupId);

	if (commandGroupIds.length === 0) {
		return null;
	}

	// Find admins of those command groups
	const groupAdmins = await db.query.PersonsToGroups.findMany({
		where: (ptg) => and(
			inArray(ptg.groupId, commandGroupIds),
			eq(ptg.groupRole, 'admin')
		),
		with: {
			person: {
				columns: {
					id: true,
					name: true,
				}
			}
		}
	});

	// Return the first admin found (if person is in multiple command groups, take the first one)
	const firstAdmin = groupAdmins[0];
	if (firstAdmin?.person?.id && firstAdmin?.person?.name) {
		return {
			id: firstAdmin.person.id,
			name: firstAdmin.person.name,
		};
	}

	return null;
};

export const find = async () => {
	const users = await db.query.PersonsTable.findMany({
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
		},
	});

	// Add actual managers based on group hierarchy
	const usersWithActualManagers = await Promise.all(
		users.map(async (user) => {
			const actualManager = await findActualManager(user.id);
			return {
				...user,
				manager: actualManager,
			};
		})
	);

	return usersWithActualManagers;
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
		},
	});
	
	if (!user) {
		return null;
	}

	// Add actual manager based on group hierarchy
	const actualManager = await findActualManager(user.id);
	
	return {
		...user,
		manager: actualManager,
	};
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
	// New logic: Find people who are members of command groups where the user is admin
	
	// Step 1: Find all groups where this user is admin
	const adminGroups = await db.query.PersonsToGroups.findMany({
		where: (ptg) => and(eq(ptg.personId, id), eq(ptg.groupRole, 'admin')),
		with: { 
			group: true
		}
	});

	// Step 2: Filter for command groups only
	const commandGroupIds = adminGroups
		.filter(ptg => ptg.group.command)
		.map(ptg => ptg.groupId);

	if (commandGroupIds.length === 0) {
		return [];
	}

	// Step 3: Find all members of those command groups (excluding the admin themselves)
	const groupMembers = await db.query.PersonsToGroups.findMany({
		where: (ptg) => and(
			inArray(ptg.groupId, commandGroupIds),
			eq(ptg.groupRole, 'member')
		),
		with: {
			person: {
				with: {
					transaction: {
						columns: {
							userId: false,
						},
					},
				}
			}
		}
	});

	// Step 4: Extract unique persons and add actual managers
	const uniquePersonsMap = new Map();
	const personsWithActualManagers = await Promise.all(
		groupMembers.map(async (ptg) => {
			if (!uniquePersonsMap.has(ptg.person.id)) {
				const actualManager = await findActualManager(ptg.person.id);
				const personWithManager = {
					...ptg.person,
					manager: actualManager,
				};
				uniquePersonsMap.set(ptg.person.id, personWithManager);
				return personWithManager;
			}
			return null;
		})
	);

	return personsWithActualManagers.filter(person => person !== null);
};

export const findSiteMembers = async (sites: string[] = [], userId: string | undefined) => {
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

	// Add actual managers based on group hierarchy
	const usersWithActualManagers = await Promise.all(
		users.map(async (user) => {
			const actualManager = await findActualManager(user.id);
			return {
				...user,
				manager: actualManager,
			};
		})
	);

	return usersWithActualManagers;
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
