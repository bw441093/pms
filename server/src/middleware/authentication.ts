import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../logger';
import { findUserByEmail } from '../db/users';

dayjs.extend(utc);

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			user: any;
		}
	}
}

export default function authenticate() {
	return async (req: Request, res: Response, next: NextFunction) => {
		let email = req.headers['x-ms-client-principal-name'] as string;

		if (process.env.NODE_ENV === 'development') {
			email = 'benjaminw@example.com';
		}
		if (!email) {
			logger.error('Error validating authentication - Missing email');
			res.status(401).send('Missing email');
			return;
		}
		const user = await findUserByEmail(email);
		if (!user) {
			logger.error(
				`Error validating authentication - User not found, email: ${email}`
			);
			res.status(401).send(`User with email ${email} not found`);
			return;
		}
		req.user = user.id;

		return next();
	};
}
