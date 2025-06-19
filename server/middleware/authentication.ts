import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { NextFunction, Request, Response } from 'express';
import type { TokenExpiredError } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { z, ZodError } from 'zod';
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

const tokenSchema = z
	.object({
		userId: z.string().uuid(),
		status: z.enum(['2faFulfilled', 'loginFulfilled']),
	})
	.passthrough();

type Payload = z.infer<typeof tokenSchema>;

export default function authenticate(
	status: '2faFulfilled' | 'loginFulfilled' = '2faFulfilled'
) {
	return async (req: Request, res: Response, next: NextFunction) => {
		const email = req.headers['x-ms-client-principal-name'] as string;
		if (!email) {
			logger.error('Error validating authentication - Missing email');
			res.status(401).send('Missing email');
			return;
		}
		const user = await findUserByEmail(email);
		if (!user) {
			logger.error('Error validating authentication - User not found');
			res.status(401).send('User not found');
			return;
		}
		req.user = user.id;
		return next();
	};
}
