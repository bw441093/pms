import { and, eq, inArray } from 'drizzle-orm';

import { db } from './db';
import { PersonsTable, PersonsToSystemRoles, SystemRolesTable, PersonsToGroups, GroupsTable, UsersTable } from './schema';
import { logger } from '../logger';

// Site code to Hebrew name mapping (same as in client)
const hebrewSiteNames: Record<string, string> = {
	mbt: 'איילת השחר',
	mfs: 'בראשית', 
	kir: 'בית הבחירה',
	mdt: 'רקיע',
	other: 'אחר',
};

// Reverse mapping from Hebrew name to site code
const siteCodeFromHebrew: Record<string, string> = {
	'איילת השחר': 'mbt',
	'בראשית': 'mfs',
	'ביה״ב': 'kir', 
	'רקיע': 'mdt',
	'אחר': 'other',
};

// Helper function to find the current/reported site based on site group membership
const findCurrentSite = async (personId: string) => {
	// Find site groups where this person is a member
	const siteGroups = await db.query.PersonsToGroups.findMany({
		where: (ptg) => eq(ptg.personId, personId),
		with: { 
			group: true
		}
	});

	// Filter for site groups only
	const currentSiteGroup = siteGroups.find(ptg => ptg.group.site);
	
	if (currentSiteGroup) {
		// Convert Hebrew group name to site code
		const siteCode = siteCodeFromHebrew[currentSiteGroup.group.name];
		return siteCode || 'other'; // fallback to 'other' if not found
	}

	return null; // No current site group membership
};

// Helper function to find the actual manager based on group hierarchy
export const findActualManager = async (personId: string) => {
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

	// Add actual managers and current sites based on group hierarchy
	const usersWithActualManagersAndSites = await Promise.all(
		users.map(async (user) => {
			const actualManager = await findActualManager(user.id);
			const currentSite = await findCurrentSite(user.id);
			
			// Get the user's email from the UsersTable
			const userEmail = await db.query.UsersTable.findFirst({
				where: eq(UsersTable.id, user.id),
				columns: {
					email: true,
				},
			});
			
			return {
				...user,
				email: userEmail?.email || '',
				manager: actualManager,
				currentSite,
			};
		})
	);

	return usersWithActualManagersAndSites;
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

	// Get the user's email from the UsersTable
	const userEmail = await db.query.UsersTable.findFirst({
		where: eq(UsersTable.id, id),
		columns: {
			email: true,
		},
	});

	// Add actual manager and current site based on group hierarchy
	const actualManager = await findActualManager(user.id);
	const currentSite = await findCurrentSite(user.id);
	
	const result = {
		...user,
		email: userEmail?.email || '',
		manager: actualManager,
		currentSite,
	};
	
	return result;
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

	// Step 4: Extract unique persons and add actual managers, current sites, and emails
	const uniquePersonsMap = new Map();
	const personsWithActualManagersAndSites = await Promise.all(
		groupMembers.map(async (ptg) => {
			if (!uniquePersonsMap.has(ptg.person.id)) {
				const actualManager = await findActualManager(ptg.person.id);
				const currentSite = await findCurrentSite(ptg.person.id);
				
				// Get the user's email from the UsersTable
				const userEmail = await db.query.UsersTable.findFirst({
					where: eq(UsersTable.id, ptg.person.id),
					columns: {
						email: true,
					},
				});
				
				const personWithManagerAndSite = {
					...ptg.person,
					email: userEmail?.email || '',
					manager: actualManager,
					currentSite,
				};
				uniquePersonsMap.set(ptg.person.id, personWithManagerAndSite);
				return personWithManagerAndSite;
			}
			return null;
		})
	);

	return personsWithActualManagersAndSites.filter(person => person !== null);
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

	// Add actual managers, current sites, and emails based on group hierarchy
	const usersWithActualManagersAndSites = await Promise.all(
		users.map(async (user) => {
			const actualManager = await findActualManager(user.id);
			const currentSite = await findCurrentSite(user.id);
			
			// Get the user's email from the UsersTable
			const userEmail = await db.query.UsersTable.findFirst({
				where: eq(UsersTable.id, user.id),
				columns: {
					email: true,
				},
			});
			
			return {
				...user,
				email: userEmail?.email || '',
				manager: actualManager,
				currentSite,
			};
		})
	);

	return usersWithActualManagersAndSites;
};

export const createPerson = async (
	id: string,
	name: string,
	site: string,
	serviceType?: string
) => {
	const updateData: any = { id, name, site, serviceType };
	const user = await db
		.insert(PersonsTable)
		.values(updateData)
		.returning({ id: PersonsTable.id });

	return user;
};

export const updatePersonStatusLocation = async (
	id: string,
	status: string,
	location: string,
	reporterId: string // new argument for the reporter's id
) => {
	const user = await db
		.update(PersonsTable)
		.set({ reportStatus: status, location, updatedAt: new Date(), approvedBy: reporterId })
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
		site?: string;
		serviceType?: string;
	}
) => {
	const updateData: any = { updatedAt: new Date() };
	
	if (updates.name !== undefined) updateData.name = updates.name;
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
	// Find site groups where this user is admin
	const adminSiteGroups = await db.query.PersonsToGroups.findMany({
		where: (ptg) => and(eq(ptg.personId, userId), eq(ptg.groupRole, 'admin')),
		with: { 
			group: true
		}
	});

	// Filter for site groups only
	const siteGroupIds = adminSiteGroups
		.filter(ptg => ptg.group.site)
		.map(ptg => ptg.groupId);

	if (siteGroupIds.length === 0) {
		return [];
	}

	// Find all members of those site groups
	const siteGroupMembers = await db.query.PersonsToGroups.findMany({
		where: (ptg) => and(
			inArray(ptg.groupId, siteGroupIds),
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
					personSystemRoles: {
						columns: { userId: false, roleId: false },
						with: {
							role: true,
						},
					},
				}
			}
		}
	});

	// Extract unique persons and add actual managers, current sites, and emails
	const uniquePersonsMap = new Map();
	const personsWithActualManagersAndSites = await Promise.all(
		siteGroupMembers.map(async (ptg) => {
			if (!uniquePersonsMap.has(ptg.person.id)) {
				const actualManager = await findActualManager(ptg.person.id);
				const currentSite = await findCurrentSite(ptg.person.id);
				
				// Get the user's email from the UsersTable
				const userEmail = await db.query.UsersTable.findFirst({
					where: eq(UsersTable.id, ptg.person.id),
					columns: {
						email: true,
					},
				});
				
				const personWithManagerAndSite = {
					...ptg.person,
					email: userEmail?.email || '',
					manager: actualManager,
					currentSite,
				};
				uniquePersonsMap.set(ptg.person.id, personWithManagerAndSite);
				return personWithManagerAndSite;
			}
			return null;
		})
	);

	return personsWithActualManagersAndSites.filter(person => person !== null);
};

export const movePersonToSiteGroup = async (personId: string, targetSiteCode: string) => {
	// Get the Hebrew name for the target site
	const targetSiteGroupName = hebrewSiteNames[targetSiteCode];
	if (!targetSiteGroupName) {
		throw new Error(`Invalid site code: ${targetSiteCode}`);
	}

	// Find the target site group
	const targetSiteGroup = await db.query.GroupsTable.findFirst({
		where: (groups) => and(eq(groups.name, targetSiteGroupName), eq(groups.site, true)),
	});

	if (!targetSiteGroup) {
		throw new Error(`Site group not found for site: ${targetSiteCode}`);
	}

	// Remove person from any existing site groups
	const existingSiteGroups = await db.query.PersonsToGroups.findMany({
		where: (ptg) => eq(ptg.personId, personId),
		with: { group: true }
	});

	for (const ptg of existingSiteGroups) {
		if (ptg.group.site) {
			await db.delete(PersonsToGroups)
				.where(and(
					eq(PersonsToGroups.personId, personId),
					eq(PersonsToGroups.groupId, ptg.groupId)
				));
		}
	}

	// Add person to the new site group as a member
	await db.insert(PersonsToGroups).values({
		personId,
		groupId: targetSiteGroup.groupId,
		groupRole: 'member',
	});

	return { success: true, targetSiteGroup: targetSiteGroupName };
};

export const updatePersonSiteManagerSites = async (personId: string, newSiteCodes: string[]) => {
	logger.info(`Updating site manager sites for person ${personId}. New sites: ${JSON.stringify(newSiteCodes)}`);
	
	// Remove person from all existing site groups where they are admin
	const existingSiteGroups = await db.query.PersonsToGroups.findMany({
		where: (ptg) => and(eq(ptg.personId, personId), eq(ptg.groupRole, 'admin')),
		with: { group: true }
	});

	logger.info(`Found existing admin groups: ${JSON.stringify(existingSiteGroups)}`);

	for (const ptg of existingSiteGroups) {
		if (ptg.group.site) {
			logger.info(`Removing person ${personId} from site group ${ptg.group.name} (${ptg.groupId})`);
			await db.delete(PersonsToGroups)
				.where(and(
					eq(PersonsToGroups.personId, personId),
					eq(PersonsToGroups.groupId, ptg.groupId),
					eq(PersonsToGroups.groupRole, 'admin')
				));
		}
	}

	// Add person as admin to new site groups
	for (const siteCode of newSiteCodes) {
		const siteGroupName = hebrewSiteNames[siteCode];
		if (!siteGroupName) {
			logger.error(`Invalid site code: ${siteCode}`);
			continue;
		}

		// Find the site group
		const siteGroup = await db.query.GroupsTable.findFirst({
			where: (groups) => and(eq(groups.name, siteGroupName), eq(groups.site, true)),
		});

		if (!siteGroup) {
			logger.error(`Site group not found for site: ${siteCode}`);
			continue;
		}

		logger.info(`Adding person ${personId} as admin to site group ${siteGroupName} (${siteGroup.groupId})`);
		await db.insert(PersonsToGroups).values({
			personId,
			groupId: siteGroup.groupId,
			groupRole: 'admin',
		});
	}

	logger.info(`Site manager update completed for person ${personId}`);
	return { success: true };
};

export const updatePersonCommandGroup = async (personId: string, newGroupId: string) => {
	logger.info(`Updating command group for person ${personId}. New group: ${newGroupId}`);
	
	// Remove person from all existing command groups where they are admin
	const existingCommandGroups = await db.query.PersonsToGroups.findMany({
		where: (ptg) => and(eq(ptg.personId, personId), eq(ptg.groupRole, 'admin')),
		with: { group: true }
	});

	logger.info(`Found existing admin groups: ${JSON.stringify(existingCommandGroups)}`);

	for (const ptg of existingCommandGroups) {
		if (ptg.group.command) {
			logger.info(`Removing person ${personId} from command group ${ptg.group.name} (${ptg.groupId})`);
			await db.delete(PersonsToGroups)
				.where(and(
					eq(PersonsToGroups.personId, personId),
					eq(PersonsToGroups.groupId, ptg.groupId),
					eq(PersonsToGroups.groupRole, 'admin')
				));
		}
	}

	// Add person as admin to new command group
	logger.info(`Adding person ${personId} as admin to command group: ${newGroupId}`);
	await db.insert(PersonsToGroups).values({
		personId,
		groupId: newGroupId,
		groupRole: 'admin',
	});

	logger.info(`Command group update completed for person ${personId}`);
	return { success: true };
};

export const getCurrentSiteCode = async (personId: string) => {
	return await findCurrentSite(personId);
};
