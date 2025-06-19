import type { Request, Response } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { findUserByEmail } from '../db/users';

dayjs.extend(utc);
// totp.options = { window: 1 };

export const identifyHandler = async (req: Request, res: Response) => {
	try {
		let email = req.headers['x-ms-client-principal-name'];
		if (process.env.NODE_ENV === 'development') {
			email = 'benjaminw@example.com';
		}
		const user = await findUserByEmail(email as string);
		if (!user) {
			res.sendStatus(404);
			return;
		}

		res.send(user.id);
	} catch (err) {
		res.status(500);
		res.send(err);
		console.log(`Error fetching user, error: ${err}`);
	}
};
