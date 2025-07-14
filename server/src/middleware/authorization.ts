import type { NextFunction, Request, Response } from 'express';
import { db } from '../db/db';
import { eq } from 'drizzle-orm';
import { PersonsTable } from '../db/schema';
import { logger } from '../logger';
import type { SystemRole } from '../types';

export default function authorize(allowedRoles: SystemRole[] = []) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = req.user;
			logger.debug(`Validating authorization - Fetching user: ${userId}`);
			const user = await db.query.PersonsTable.findFirst({
				where: eq(PersonsTable.id, userId),
				with: {
					personSystemRoles: {
						with: {
							role: {
								columns: {
									name: true,
								},
							},
						},
					},
				},
			});

			if (!user) {
				logger.error(
					`Error validating authorization - Couldnt find user: ${userId}`
				);
				res.status(404).send('Couldnt find user');
				return;
			}

			logger.info(`allowedRoles: ${JSON.stringify(allowedRoles)}`);
			logger.info(`user: ${JSON.stringify(user)}`);
			logger.info(`user?.personSystemRoles: ${JSON.stringify(user?.personSystemRoles)}`);

			if (allowedRoles.length === 0) {
				next();
				return;
			}

			const isUserAuthorized = user?.personSystemRoles.some(({ role }) =>
				allowedRoles.find((allowedRole) => allowedRole === role.name)
			);

			if (!isUserAuthorized) {
				logger.debug(`Validate authorization - User ${userId} not authorized`);
				res.status(403).send('User not authorized');
				return;
			}

			next();
		} catch (err) {
			logger.error(`Error validating authorization`);
			logger.error(err);
			res.status(500).send(err);
		}
	};
}
