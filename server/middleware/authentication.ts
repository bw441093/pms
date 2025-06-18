import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { NextFunction, Request, Response } from 'express';
import type { TokenExpiredError } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { z, ZodError } from 'zod';
import { logger } from '../logger';

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
	return (req: Request, res: Response, next: NextFunction) => {
		req.user = 'feb8bf9c-d2be-4f25-ad79-9d478af482a1';
		return next();
		// const authHeader = req.headers['authorization'];
		// const token = authHeader && authHeader.split(' ')[1];

		// if (token == null) {
		// 	logger.error('Error validating authentication - Missing token');
		// 	res.status(401).send('Missing token');
		// 	return;
		// }

		// try {
		// 	// eslint-disable-next-line @typescript-eslint/no-explicit-any
		// 	const decodedPayload = jwt.verify(
		// 		token,
		// 		process.env.JWT_SECRET || 'secret'
		// 	);
		// 	// validate token
		// 	tokenSchema.parse(decodedPayload);
		// 	if ((decodedPayload as Payload).status !== status) {
		// 		logger.error('Error validating authentication - Token state mismatch');
		// 		res.status(403).send('Token state mismatch');
		// 		return;
		// 	}
		// 	req.user = (decodedPayload as Payload).userId;
		// 	return next();
		// } catch (err) {
		// 	logger.error(`Error decoding token, error: ${err}`);
		// 	if (err instanceof TokenExpiredError) {
		// 		res.status(401).send('Token expired');
		// 		return;
		// 	}
		// 	if (err instanceof ZodError) {
		// 		res.status(401).send('Malformed token');
		// 		return;
		// 	}
		// 	res.status(500).send(err);
		// }
	};
}
