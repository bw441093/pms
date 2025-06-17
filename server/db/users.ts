import { eq } from 'drizzle-orm';

import { db } from './db';
import { UsersTable } from './schema';

export const findUserById = async (id: string) => {
	const user = await db.query.UsersTable.findFirst({
		where: eq(UsersTable.id, id),
	});

	return user;
};

export const findUserByUsername = async (username: string) => {
	const user = await db.query.UsersTable.findFirst({
		where: eq(UsersTable.username, username),
	});

	return user;
};

export const createUser = async (
	username: string,
	password: string,
	twoFactorSecret: string
) => {
	const user = await db
		.insert(UsersTable)
		.values({ username, password, twoFactorSecret })
		.returning({ id: UsersTable.id });

	if (!user[0]?.id) throw new Error('Could not insert user, db returned no ID');
	return user[0].id;
};
