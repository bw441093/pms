import { and, eq, inArray } from 'drizzle-orm';

import { db } from './db';
import { GroupsTable, PersonsToGroups, UsersTable } from './schema';

// Import the findActualManager function from persons.ts
import { findActualManager } from './persons';

export const findGroupsByPersonId = async (personId: string) => {
	const personGroups = await db.query.PersonsToGroups.findMany({
		where: (ptg) => eq(ptg.personId, personId),
		with: {
			group: true,
		},
	});
	const groups = personGroups.map((pg) => pg.group);
	return groups;
};

export const findGroupById = async (groupId: string) => {
	const group = await db.query.GroupsTable.findFirst({
		where: (groups) => {
			return eq(GroupsTable.groupId, groupId);
		},
	});

	return group;
};

export const findPersonsByGroupId = async (groupId: string) => {
	const personsToGroups = await db.query.PersonsToGroups.findMany({
		where: (ptg) => eq(ptg.groupId, groupId),
		with: {
			person: true,
		},
	});
	return personsToGroups.map(ptg => ptg.person);
};

export const findPersonRoleInGroups = async (personId: string, groupIds: string[]) => {
	// Query all relevant PersonsToGroups records in one go
	const records = await db.query.PersonsToGroups.findMany({
		where: (ptg) => and(eq(ptg.personId, personId), inArray(ptg.groupId, groupIds)),
	});
	// Map to { groupId, groupRole }
	return records.map(r => ({ groupId: r.groupId, groupRole: r.groupRole }));
};

export const findCommandGroupsByAdmin = async (personId: string) => {
	// Find all groups where person is admin and group.command = true
	const adminGroups = await db.query.PersonsToGroups.findMany({
		where: (ptg) => and(eq(ptg.personId, personId), eq(ptg.groupRole, 'admin')),
		with: { group: true }
	});
	return adminGroups.filter(g => g.group.command).map(g => g.group);
};

export const findAllSubordinates = async (personId: string, visitedGroups = new Set<string>(), visitedPersons = new Set<string>()) => {
	const result = new Set<string>();
	// Step 1: Find all command groups where this person is admin
	const commandGroups = await findCommandGroupsByAdmin(personId);

	for (const group of commandGroups) {
		if (visitedGroups.has(group.groupId)) continue;
		visitedGroups.add(group.groupId);

		// Step 2: Find all persons in this group
		const persons = await db.query.PersonsToGroups.findMany({
			where: (ptg) => eq(ptg.groupId, group.groupId),
			with: { person: true }
		});

		for (const ptg of persons) {
			const subId = ptg.person.id;
			if (subId === personId) continue; // skip self
			if (!visitedPersons.has(subId)) {
				visitedPersons.add(subId);
				result.add(subId);
				// Step 3: Recursively find subordinates of this subordinate
				const subSubordinates = await findAllSubordinates(subId, visitedGroups, visitedPersons);
				for (const s of subSubordinates) result.add(s);
			}
		}
	}
	return Array.from(result);
};

export const findAllSubordinatePersons = async (personId: string) => {
	const ids = await findAllSubordinates(personId);
	if (ids.length === 0) return {};
	
	// Get all persons with their group memberships and transactions, but only for command groups
	const personsWithGroups = await db.query.PersonsToGroups.findMany({
		where: (ptg) => inArray(ptg.personId, ids),
		with: {
			person: {
				with: {
					transaction: true,
				},
			},
			group: true,
		},
	});

	// Group persons by their command groups only
	const groupedPersons: Record<string, { group: any; persons: any[] }> = {};
	
	for (const ptg of personsWithGroups) {
		const group = ptg.group;
		// Only include groups where command is true
		if (!group.command) continue;
		
		const groupId = ptg.groupId;
		const person = ptg.person;
		
		if (!groupedPersons[groupId]) {
			groupedPersons[groupId] = {
				group: group,
				persons: []
			};
		}
		
		// Avoid duplicate persons in the same group
		const personExists = groupedPersons[groupId].persons.some(p => p.id === person.id);
		if (!personExists) {
			// Get the user's email from the UsersTable
			const userEmail = await db.query.UsersTable.findFirst({
				where: eq(UsersTable.id, person.id),
				columns: {
					email: true,
				},
			});
			
			// Get the person's actual manager
			const actualManager = await findActualManager(person.id);
			
			const personWithEmailAndManager = {
				...person,
				email: userEmail?.email || '',
				manager: actualManager,
			};
			
			groupedPersons[groupId].persons.push(personWithEmailAndManager);
		}
	}
	
	return groupedPersons;
};

export const addPersonToGroup = async (personId: string, groupId: string, groupRole: 'admin' | 'member' = 'member') => {
	const result = await db.insert(PersonsToGroups).values({
		personId,
		groupId,
		groupRole,
	}).returning({ personId: PersonsToGroups.personId, groupId: PersonsToGroups.groupId });
	
	return result[0];
};

export const createGroup = async (name: string, command: boolean = true, site: boolean = false) => {
	// Enforce constraint: if site is true, command must be false
	if (site && command) {
		throw new Error('Site groups cannot be command groups. Please set command to false for site groups.');
	}
	
	const result = await db.insert(GroupsTable).values({
		name,
		command,
		site,
	}).returning({ groupId: GroupsTable.groupId, name: GroupsTable.name });
	
	return result[0];
};

export const findGroupByName = async (name: string) => {
	const result = await db.query.GroupsTable.findFirst({
		where: eq(GroupsTable.name, name),
	});
	
	return result;
};

export const findAllSubordinateCommandGroups = async (managerId: string) => {
	// If no manager or 'none', return all command groups
	if (!managerId || managerId === 'none') {
		const allCommandGroups = await db.query.GroupsTable.findMany({
			where: (groups) => eq(groups.command, true),
		});
		return allCommandGroups;
	}
	
	// Find all subordinates of the manager
	const subordinateIds = await findAllSubordinates(managerId);
	
	// Find all command groups where any subordinate is admin
	if (subordinateIds.length === 0) {
		return [];
	}
	
	const subordinateAdminGroups = await db.query.PersonsToGroups.findMany({
		where: (ptg) => and(
			inArray(ptg.personId, subordinateIds), 
			eq(ptg.groupRole, 'admin')
		),
		with: { group: true }
	});
	
	// Filter for command groups only and return unique groups
	const commandGroups = subordinateAdminGroups
		.filter(ptg => ptg.group.command)
		.map(ptg => ptg.group);
	
	// Remove duplicates by groupId
	const uniqueGroups = commandGroups.filter((group, index, self) => 
		index === self.findIndex(g => g.groupId === group.groupId)
	);
	
	return uniqueGroups;
};

export const findAdminSiteGroups = async (userId: string) => {
	// Get all groups where user is admin
	const adminGroups = await db.query.PersonsToGroups.findMany({
		where: (ptg) => and(
			eq(ptg.personId, userId),
			eq(ptg.groupRole, 'admin')
		),
		with: { group: true }
	});

	// Filter for site groups only
	const siteGroups = adminGroups
		.filter(ptg => ptg.group.site !== null)
		.map(ptg => ptg.group);

	// Remove duplicates by groupId
	const uniqueGroups = siteGroups.filter((group, index, self) =>
		index === self.findIndex(g => g.groupId === group.groupId)
	);

	return uniqueGroups;
};

export const removePersonFromGroup = async (personId: string, groupId: string, groupRole?: 'admin' | 'member') => {
	if (groupRole) {
		// Remove person with specific role
		const result = await db.delete(PersonsToGroups)
			.where(and(
				eq(PersonsToGroups.personId, personId),
				eq(PersonsToGroups.groupId, groupId),
				eq(PersonsToGroups.groupRole, groupRole)
			))
			.returning({ personId: PersonsToGroups.personId, groupId: PersonsToGroups.groupId });
		
		return result[0];
	} else {
		// Remove person regardless of role
		const result = await db.delete(PersonsToGroups)
			.where(and(
				eq(PersonsToGroups.personId, personId),
				eq(PersonsToGroups.groupId, groupId)
			))
			.returning({ personId: PersonsToGroups.personId, groupId: PersonsToGroups.groupId });
		
		return result[0];
	}
};
