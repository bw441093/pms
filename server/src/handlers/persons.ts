import type { Request, Response } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { randomBytes } from 'node:crypto';

import { createUser, findUserByEmail, updateUserEmail } from '../db/users';
import {
	createPerson,
	deletePerson,
	find,
	findDirectReports,
	findManagers,
	findPersonById,
	findSiteMembers,
	updatePersonManager,
	updatePersonSite,
	updatePersonStatusLocation,
	updatePersonAlertStatus,
	updateAlertStatus,
	updatePersonDetails,
	findSitePersons,
} from '../db/persons';
import { createSystemRole, deleteUserSystemRoles } from '../db/systemRoles';
import {
	completeTransaction,
	createTransaction,
	deleteTransaction,
	updateTransaction,
} from '../db/transactions';
import type {
	Id,
	PostMove,
	PostPerson,
	Status,
	Alert,
	UpdateMove,
	UpdatePersonDetails,
} from '../types';
import { logger } from '../logger';
import { broadcast } from '../websocket';

dayjs.extend(utc);

export const postPersonHandler = async (req: Request, res: Response) => {
	try {
		const { email, name, manager, site, roles, serviceType } = req.body as PostPerson;
		logger.info(`Creating user with email: ${email}`, {
			email,
			name,
			manager,
			site,
			roles,
			serviceType,
		});

		const existingUser = await findUserByEmail(email);
		if (existingUser) {
			logger.error(`User with email: ${email} already exists`);
			res.status(400).send('User already exists');
			return;
		}

		const userId = await createUser(email);

		logger.info(`Creating person with id: ${userId}`);
		const promises = [
			createPerson(userId, name, site, manager, serviceType),
			...roles.map((role: any) => createSystemRole(role.name, role.opts, userId)),
		];
		await Promise.all(promises);

		logger.info(`Finished creating person with id: ${userId}`);
		res.status(200).send(userId);
	} catch (err) {
		logger.error(`Error inserting person, error: ${err}`);
		res.status(500).send('Error inserting person');
	}
};

export const deletePersonHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params as Id;
		logger.info(`Deleting person with id: ${id}`);

		await deletePerson(id);

		logger.info(`Done deleting person with id: ${id}`);
		res.status(200).send();
	} catch (err) {
		logger.error(`Error deleting person, error: ${err}`);
		res.status(500).send('Error deleting person');
	}
};

export const getPersonsHandler = async (req: Request, res: Response) => {
	try {
		logger.info(`Fetching relevant persons for user: ${req.user}`);
		const user = await findPersonById(req.user);
		if (!user) {
			logger.error(`User with id: ${req.user} not found`);
			res.status(404).send('Couldnt find user');
			return;
		}

		let users: any[];
		if (
			user.personSystemRoles.some(
				({ role }) => role.name === 'hrManager' || role.name === 'admin'
			)
		) {
			users = await find();
		} else {
			const directReports = await findDirectReports(user.id);
			const sites = user.personSystemRoles.filter(
				({ role }) => role.name === 'siteManager'
			)[0]?.role?.opts;
			const siteMembers = await findSiteMembers(sites as string[], user.id);
			users = [user,...directReports, ...siteMembers];
		}
		logger.info(`Done fetching relevant persons for user: ${req.user}`);

		// Sort users: priority for open alerts/transactions, then by UUID
		const sortedUsers = users.sort((a, b) => {
			// Check if user has open alert (not 'good') or active transaction
			const aHasOpenIssue =
				a.alertStatus !== 'good' || a.transaction?.status === 'pending';
			const bHasOpenIssue =
				b.alertStatus !== 'good' || b.transaction?.status === 'pending';

			// If one has open issue and the other doesn't, prioritize the one with open issue
			if (aHasOpenIssue && !bHasOpenIssue) return -1;
			if (!aHasOpenIssue && bHasOpenIssue) return 1;

			// If both have same priority status, sort by UUID
			return a.id.localeCompare(b.id);
		});

		res.status(200).send(sortedUsers);
		return;
	} catch (err) {
		logger.error(`Error fetching relevant persons, error: ${err}`);
		res.status(500).send('Error getting persons');
	}
};

export const getPersonByIdHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params as Id;
		logger.info(`Fetch user: ${id}`);
		const user = await findPersonById(id);
		logger.info('Done fetching user');
		res.status(200).send(user);
	} catch (err) {
		logger.error(`Error fetching user, error: ${err}`);
		res.status(500).send('Error getting user');
	}
};

export const getManagersHandler = async (req: Request, res: Response) => {
	try {
		logger.info('Fetch managers');
		const managers = await findManagers();

		logger.info('Done fetch managers');
		res.status(200).send(managers);
	} catch (err) {
		logger.error(`Error fetching managers, error: ${err}`);
		res.status(500).send('Error getting managers');
	}
};

export const updateStatusHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params as Id;
		const { status, location } = req.body as Status;
		logger.info(`Update status for user: ${id}`, { status, location });
		await updatePersonStatusLocation(id, status, location);

		logger.info(`Done updating status for user: ${id}`);
		res.status(200).send();
	} catch (err) {
		logger.error(`Error updating status, error: ${err}`);
		res.status(500).send('Error updating status');
	}
};

export const postMoveHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params as Id;
		const { origin, target, field } = req.body as PostMove;
		logger.info(`Create move transaction for user: ${id}`, {
			origin,
			target,
			field,
		});

		await createTransaction(origin, target, field, id);

		logger.info(`Done creating move transaction for user: ${id}`);
		res.status(200).send();
	} catch (err) {
		logger.error(`Error creating move transaction, error: ${err}`);
		res.status(500).send('Error creating transaction');
	}
};

export const updateMoveHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params as Id;
		const { originator, status } = req.body as UpdateMove;
		logger.info(`Updating move transaction for user: ${id}`, {
			originator,
			status,
		});

		const user = await findPersonById(id);
		if (
			(originator === 'origin' &&
				status &&
				user?.transaction?.targetConfirmation) ||
			(originator === 'target' &&
				status &&
				user?.transaction?.originConfirmation)
		) {
			user.transaction.field === 'site'
				? await updatePersonSite(id, user.transaction.target)
				: await updatePersonManager(id, user.transaction.target);
			await completeTransaction(user.transaction.id);
		}
		await updateTransaction(originator, status, id);

		logger.info(`Done updating move transaction for user: ${id}`);
		res.status(200).send();
	} catch (err) {
		logger.error(`Error updating move transaction, error: ${err}`);
		res.status(500).send('Error updating transaction');
	}
};

export const deleteMoveHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params as Id;
		logger.info(`Deleting transaction for user: ${id}`);

		await deleteTransaction(id);
		logger.info(`Done deleting transaction for user: ${id}`);
		res.status(200).send();
	} catch (err) {
		logger.error(`Error deleting transaction, error: ${err}`);
		res.status(500).send('Error deleting transaction');
	}
};

export const updateAlertHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params as Id;
		const { status } = req.body as Alert;
		logger.info(`Update alert status for user: ${id}`, { status });
		await updatePersonAlertStatus(id, status);

		logger.info(`Done updating alert status for user: ${id}`);
		res.status(200).send();
	} catch (err) {
		logger.error(`Error updating alert status, error: ${err}`);
		res.status(500).send('Error updating alert status');
	}
};

export const updatePersonDetailsHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params as Id;
		const { name, manager, site, email, roles, serviceType } = req.body as UpdatePersonDetails;
		logger.info(`Update person details for user: ${id}`);
		await updatePersonDetails(id, { name, manager, site, serviceType });
		if (email) await updateUserEmail(id, email);
		if (roles) {
			await deleteUserSystemRoles(id);

			const promises = roles.map(({ name, opts }: { name: string; opts: string[] }) => createSystemRole(name, opts, id));
			await Promise.all(promises);
		}

		logger.info(`Done updating person details for user: ${id}`);
		res.status(200).send();
	} catch (err) {
		logger.error(`Error updating person details, error: ${err}`);
		res.status(500).send('Error updating person details');
	}
};

export const alertAllUsersHandler = async (req: Request, res: Response) => {
	try {
		logger.info('Alerting all users - setting alert status to pending');

		// Get all users
		const allUsers = await find();

		// Update alert status for all users to 'pending'
		await updateAlertStatus();

		broadcast('alert', { status: 'pending' });
		logger.info(`Successfully alerted ${allUsers.length} users`);
		res.status(200).send({ message: `Alerted ${allUsers.length} users` });
	} catch (err) {
		logger.error(`Error alerting all users, error: ${err}`);
		res.status(500).send('Error alerting all users');
	}
};

export const getSitePersonsHandler = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;
		if (!userId) {
			res.status(400).send('User ID is required');
			return;
		}
		const persons = await findSitePersons(userId);
		res.status(200).send(persons);
	} catch (error) {
		console.error('Error getting site persons:', error);
		res.status(500).send('Failed to get site persons');
	}
};
