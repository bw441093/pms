import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';

import { createUser } from '../db/users';

export const postUser = async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;

		const twoFactorSecret = randomBytes(32).toString('hex');

		await createUser(username, password, twoFactorSecret);

		res.status(200).send(twoFactorSecret);
	} catch (err) {
		res.status(500);
		res.send(err);
		console.log(`Error adding user, error: ${err}`);
	}
};
