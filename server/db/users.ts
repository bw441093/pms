import { eq } from 'drizzle-orm';

import { db } from './db';
import { UsersTable } from './schema';

export const findUserById = async (id: string) => {
	const user = await db.query.UsersTable.findFirst({
		where: eq(UsersTable.id, id),
	});

	return user;
};

export const findUserByEmail = async (email: string) => {
	const user = await db.query.UsersTable.findFirst({
		where: eq(UsersTable.email, email),
	});

	return user;
};

export const createUser = async (email: string) => {
	const user = await db
		.insert(UsersTable)
		.values({ email })
		.returning({ id: UsersTable.id });

	if (!user[0]?.id) throw new Error('Could not insert user, db returned no ID');
	return user[0].id;
};
