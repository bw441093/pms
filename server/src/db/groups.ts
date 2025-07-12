import { eq, inArray, and } from 'drizzle-orm';

import { db } from './db';
import { GroupsTable, PersonsToGroups } from './schema';

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
			groupedPersons[groupId].persons.push(person);
		}
	}
	
	return groupedPersons;
};
