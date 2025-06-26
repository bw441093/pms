import { eq } from 'drizzle-orm';

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
