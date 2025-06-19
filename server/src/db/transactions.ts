import { eq } from 'drizzle-orm';

import { db } from './db';
import { TransactionsTable } from './schema';

export const createTransaction = async (
	origin: string,
	target: string,
	field: 'site' | 'manager',
	userId: string
) => {
	const transactionId = await db
		.insert(TransactionsTable)
		.values({ origin, target, userId, field, status: 'pending' })
		.onConflictDoUpdate({
			target: TransactionsTable.userId,
			set: {
				origin,
				target,
				field,
				status: 'pending',
				originConfirmation: false,
				targetConfirmation: false,
				// Do not update id or createdAt
			},
		})
		.returning({ id: TransactionsTable.id });
	return transactionId;
};

export const deleteTransaction = async (id: string) => {
	const results = await db
		.delete(TransactionsTable)
		.where(eq(TransactionsTable.id, id))
		.returning({ deletedId: TransactionsTable.id });
	return results[0];
};

export const updateTransaction = async (
	originator: 'origin' | 'target',
	status: boolean,
	id: string
) => {
	const field =
		originator === 'origin' ? 'originConfirmation' : 'targetConfirmation';
	const transactionId = await db
		.update(TransactionsTable)
		.set({ [field]: status })
		.where(eq(TransactionsTable.userId, id))
		.returning({ id: TransactionsTable.id });
	return transactionId;
};

export const completeTransaction = async (id: string) => {
	const transactionId = await db
		.update(TransactionsTable)
		.set({ status: 'resolved' })
		.where(eq(TransactionsTable.id, id))
		.returning({ id: TransactionsTable.id });
	return transactionId;
};
