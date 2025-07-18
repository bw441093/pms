import { eq, inArray } from 'drizzle-orm';

import { db } from './db';
import { PersonsToSystemRoles, SystemRolesTable } from './schema';
import { logger } from 'src/logger';

export const createSystemRole = async (roleNames: string[], userId: string) => {
	// Find existing roles by name
	const roles = await db
		.select({ id: SystemRolesTable.id, name: SystemRolesTable.name })
		.from(SystemRolesTable)
		.where(inArray(SystemRolesTable.name, roleNames));
	
	if (roles.length === 0) {
		throw new Error(`No roles found with names: ${roleNames.join(', ')}`);
	}
	
	// Check if any requested roles were not found
	const foundRoleNames = roles.map(role => role.name);
	const missingRoles = roleNames.filter(name => !foundRoleNames.includes(name));
	if (missingRoles.length > 0) {
		throw new Error(`Roles not found: ${missingRoles.join(', ')}`);
	}
	
	// Assign roles to user
	const roleAssignments = roles.map(role => ({
		roleId: role.id,
		userId: userId
	}));

	await db.insert(PersonsToSystemRoles).values(roleAssignments);
	
	return roles;
};

export const deleteUserSystemRoles = async (userId: string) => {
	const roleIds = await db
		.select({ id: PersonsToSystemRoles.roleId })
		.from(PersonsToSystemRoles)
		.where(eq(PersonsToSystemRoles.userId, userId));

	await db.delete(SystemRolesTable).where(
		inArray(SystemRolesTable.id, roleIds.map((r) => r.id))
	);
	
	await db.delete(PersonsToSystemRoles).where(eq(PersonsToSystemRoles.userId, userId));
	return;
};
