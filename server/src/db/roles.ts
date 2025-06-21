import { eq, inArray } from 'drizzle-orm';

import { db } from './db';
import { PersonsToRoles, RolesTable } from './schema';

export const createRole = async (name: string, opts: any, userId: string) => {
	const roleId = await db
		.insert(RolesTable)
		.values({ name, opts })
		.returning({ id: RolesTable.id });
	if (!roleId[0]?.id)
		throw new Error('Could not insert role, db returned no ID');
	await db.insert(PersonsToRoles).values({ roleId: roleId[0].id, userId });
	return roleId;
};

export const deleteUserRoles = async (userId: string) => {
	const roleIds = await db
		.select({ id: PersonsToRoles.roleId })
		.from(PersonsToRoles)
		.where(eq(PersonsToRoles.userId, userId));

	await db.delete(RolesTable).where(
		inArray(RolesTable.id, roleIds.map((r) => r.id))
	);
	
	await db.delete(PersonsToRoles).where(eq(PersonsToRoles.userId, userId));
	return;
};
