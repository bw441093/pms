import { eq, inArray } from 'drizzle-orm';

import { db } from './db';
import { PersonsToSystemRoles, SystemRolesTable } from './schema';

export const createSystemRole = async (name: string, opts: any, userId: string) => {
	const roleId = await db
		.insert(SystemRolesTable)
		.values({ name, opts })
		.returning({ id: SystemRolesTable.id });
	if (!roleId[0]?.id)
		throw new Error('Could not insert role, db returned no ID');
	await db.insert(PersonsToSystemRoles).values({ roleId: roleId[0].id, userId });
	return roleId;
};

export const deleteUserSystemRoles = async (userId: string) => {
	const roleIds = await db
		.select({ id: PersonsToSystemRoles.roleId })
		.from(PersonsToSystemRoles)
		.where(eq(PersonsToSystemRoles.userId, userId));

	console.log(roleIds);
	await db.delete(SystemRolesTable).where(
		inArray(SystemRolesTable.id, roleIds.map((r) => r.id))
	);
	
	await db.delete(PersonsToSystemRoles).where(eq(PersonsToSystemRoles.userId, userId));
	return;
};
