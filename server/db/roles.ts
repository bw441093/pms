import { eq } from 'drizzle-orm';

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

export const deleteRoles = async (id: string) => {
	const results = await db
		.delete(RolesTable)
		.where(eq(RolesTable.id, id))
		.returning({ deletedId: RolesTable.id });
	return results[0];
};
