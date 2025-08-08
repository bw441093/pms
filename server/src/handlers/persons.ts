import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { eq, and } from 'drizzle-orm';

import {
	find,
	findPersonById,
	findManagers,
	createPerson,
	updatePersonStatusLocation,
	updatePersonAlertStatus,
	updateAlertStatus,
	deletePerson,
	updatePersonDetails,
	findSitePersons,
	findDirectReports,
	movePersonToSiteGroup,
	updatePersonSiteManagerSites,
} from '../db/persons';
import { createSystemRole, deleteUserSystemRoles } from '../db/systemRoles';
import { createUser } from '../db/users';
import { createTransaction, deleteTransaction, updateTransaction } from '../db/transactions';
import { logger } from '../logger';
import { createGroup, findCommandGroupsByAdmin, addPersonToGroup, findGroupByName, removePersonFromGroup } from '../db/groups';
import { db } from '../db/db';

interface PostPerson {
	email?: string;
	name: string;
	site: string;
	serviceType?: string;
	systemRoles: { name: string; opts: string[] }[];
	selectedGroupId?: string;
	newGroupName?: string;
	commander?: string;
}

interface UpdatePersonDetails {
	name?: string;
	site?: string;
	serviceType?: string;
	email?: string;
	commander?: string;
	systemRoles?: { name: string; opts: string[] }[];
	newSiteManagerSites?: string[];
	selectedGroupId?: string;
	newGroupName?: string;
	replacementAdmins?: Record<string, string>; // groupId -> personId
}

export const postPersonHandler = async (req: Request, res: Response) => {
	logger.info('Add user to table');
	try {
		const { email, name, site, systemRoles, serviceType, selectedGroupId, newGroupName, commander } = req.body as PostPerson;

		// Create User first (returns the generated ID)
		const userId = await createUser(email || `${uuidv4()}@temp.com`);

		// Create Person
		await createPerson(userId, name, site, serviceType);

		// Automatically assign person to their permanent site group
		try {
			await movePersonToSiteGroup(userId, site);
			logger.info(`Assigned person ${userId} to their permanent site group: ${site}`);
		} catch (error) {
			logger.error(`Failed to assign person ${userId} to site group ${site}:`, error);
			// Don't fail the whole operation, just log the error
		}

		// Add system roles to the person if provided
		for (const roleData of systemRoles) {
			if (['hrManager', 'admin'].includes(roleData.name)) {
				await createSystemRole([roleData.name], userId);
			}
		}
		

		// Handle group assignment for personnelManager role
		const hasPersonnelManagerRole = systemRoles.some((role: any) => role.name === 'personnelManager');
		if (hasPersonnelManagerRole) {
			logger.info(`Handling group assignment for personnelManager: ${userId}`);
			
			// Normalize inputs - convert empty strings to undefined
			const normalizedSelectedGroupId = selectedGroupId?.trim() || undefined;
			const normalizedNewGroupName = newGroupName?.trim() || undefined;
			
			let groupId: string;
			
			if (normalizedSelectedGroupId) {
				// Use existing group
				groupId = normalizedSelectedGroupId;
				logger.info(`Setting personnelManager ${userId} as admin of existing group: ${groupId}`);
			} else if (normalizedNewGroupName) {
				// Create new group
				logger.info(`Creating new command group: ${normalizedNewGroupName} for personnelManager: ${userId}`);
				// Check if group name already exists
				const existingGroup = await findGroupByName(normalizedNewGroupName);
				if (existingGroup) {
					logger.error(`Group name already exists: ${normalizedNewGroupName}`);
					res.status(400).send(`שם הקבוצה "${normalizedNewGroupName}" כבר קיים במערכת. אנא בחר שם אחר.`);
					return;
				}
				const newGroup = await createGroup(normalizedNewGroupName, true); // true for command group
				if (!newGroup?.groupId) {
					logger.error(`Failed to create group: ${normalizedNewGroupName}`);
					res.status(500).send('Failed to create group');
					return;
				}
				groupId = newGroup.groupId;
			} else {
				logger.error(`PersonnelManager ${userId} has no group selection or new group name`);
				res.status(400).send('PersonnelManager must either select an existing group or provide a new group name');
				return;
			}
			
			try {
				// For new persons, just add them as admin (no need to remove from old groups)
				await addPersonToGroup(userId, groupId, 'admin');
				logger.info(`Added personnelManager ${userId} as admin to group: ${groupId}`);
			} catch (err) {
				logger.error(`Error handling group assignment for personnelManager: ${err}`);
				res.status(500).send('Error assigning group to personnelManager');
				return;
			}
		}

		// Handle commander assignment if provided
		if (commander && commander.trim()) {
			logger.info(`Handling commander assignment for user ${userId} to commander: ${commander}`);
			
			try {
				// Find the commander's command groups where they are admin
				const commanderCommandGroups = await findCommandGroupsByAdmin(commander);
				
				if (commanderCommandGroups.length === 0) {
					logger.warn(`Commander ${commander} has no command groups where they are admin`);
				} else {
					// Add the new user as a member to all of the commander's command groups
					for (const group of commanderCommandGroups) {
						await addPersonToGroup(userId, group.groupId, 'member');
						logger.info(`Added user ${userId} as member to commander's command group: ${group.name} (${group.groupId})`);
					}
					logger.info(`Successfully assigned user ${userId} to ${commanderCommandGroups.length} commander groups`);
				}
			} catch (err) {
				logger.error(`Error handling commander assignment for user ${userId}: ${err}`);
				// Don't fail the whole operation, just log the error
			}
		}

		logger.info('Done add user to table');
		res.status(200).send('User added successfully');
	} catch (err) {
		logger.error(`Error adding user, error: ${err}`);
		res.status(500).send('Error adding user');
	}
};

export const getPersonsHandler = async (req: Request, res: Response) => {
	try {
		logger.info('Fetch users');
		const users = await find();

		logger.info('Done fetch users');
		res.status(200).send(users);
	} catch (err) {
		logger.error(`Error getting users, error: ${err}`);
		res.status(500).send('Error getting users');
	}
};

export const getPersonByIdHandler = async (req: Request, res: Response) => {
	const { id } = req.params;

	if (!id) {
		res.status(400).send('User ID is required');
		return;
	}

	try {
		logger.info(`Fetch user with id: ${id}`);
		const user = await findPersonById(id);

		if (!user) {
			logger.error(`User with id: ${id} not found`);
			res.status(404).send('User not found');
			return;
		}

		logger.info(`Done fetch user with id: ${id}`);
		res.status(200).send(user);
	} catch (err) {
		logger.error(`Error getting user with id: ${id}, error: ${err}`);
		res.status(500).send('Error getting user');
	}
};

export const getDirectReportsHandler = async (req: Request, res: Response) => {
	const { userId } = req.params;

	if (!userId) {
		res.status(400).send('User ID is required');
		return;
	}

	try {
		logger.info(`Fetch direct reports for user: ${userId}`);
		const directReports = await findDirectReports(userId);

		logger.info(`Done fetch direct reports for user: ${userId}`);
		res.status(200).send(directReports);
	} catch (err) {
		logger.error(`Error getting direct reports for user ${userId}, error: ${err}`);
		res.status(500).send('Error getting direct reports');
	}
};

export const getSitePersonsHandler = async (req: Request, res: Response) => {
	const { userId } = req.params;

	if (!userId) {
		res.status(400).send('User ID is required');
		return;
	}

	try {
		logger.info(`Fetch site persons for user: ${userId}`);
		const sitePersons = await findSitePersons(userId);

		logger.info(`Done fetch site persons for user: ${userId}`);
		res.status(200).send(sitePersons);
	} catch (err) {
		logger.error(`Error getting site persons for user ${userId}, error: ${err}`);
		res.status(500).send('Error getting site persons');
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

export const updatePersonStatusHandler = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { status, location, reporterId } = req.body;

	if (!id) {
		res.status(400).send('User ID is required');
		return;
	}

	try {
		logger.info(`Update status for user with id: ${id}`);
		await updatePersonStatusLocation(id, status, location, reporterId);

		logger.info(`Done update status for user with id: ${id}`);
		res.status(200).send('Status updated');
	} catch (err) {
		logger.error(`Error updating status for user ${id}, error: ${err}`);
		res.status(500).send('Error updating status');
	}
};

export const updatePersonAlertHandler = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { status } = req.body;

	if (!id) {
		res.status(400).send('User ID is required');
		return;
	}

	try {
		logger.info(`Update alert status for user with id: ${id}`);
		await updatePersonAlertStatus(id, status);

		logger.info(`Done update alert status for user with id: ${id}`);
		res.status(200).send('Alert status updated');
	} catch (err) {
		logger.error(`Error updating alert status for user ${id}, error: ${err}`);
		res.status(500).send('Error updating alert status');
	}
};

export const createTransactionHandler = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { origin, target, field } = req.body;

	if (!id) {
		res.status(400).send('User ID is required');
		return;
	}

	try {
		logger.info(`Create transaction for user with id: ${id}`);
		await createTransaction(origin, target, field, id);

		logger.info(`Done create transaction for user with id: ${id}`);
		res.status(200).send('Transaction created');
	} catch (err) {
		logger.error(`Error creating transaction for user ${id}, error: ${err}`);
		res.status(500).send('Error creating transaction');
	}
};

export const confirmTransactionHandler = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { originator, status } = req.body;

	if (!id) {
		res.status(400).send('User ID is required');
		return;
	}

	try {
		logger.info(`confirm move for user with id: ${id}`);
		const user = await findPersonById(id);

		if (!user) {
			logger.error(`User with id: ${id} not found`);
			res.status(404).send('User not found');
			return;
		}

		if (!user.transaction) {
			logger.error(`User with id: ${id} has no pending transaction`);
			res.status(400).send('No pending transaction');
			return;
		}

		// Update confirmation
		await updateTransaction(originator, status, id);

		// Check if both confirmations are true
		const updatedUser = await findPersonById(id);
		if (
			updatedUser?.transaction?.originConfirmation &&
			updatedUser?.transaction?.targetConfirmation
		) {
			logger.info(`Both confirmations received for user ${id}, executing move`);
			
			// Execute the move based on field type
			if (updatedUser.transaction.field === 'site') {
				await movePersonToSiteGroup(id, updatedUser.transaction.target);
			}
			// Note: manager field handling removed since we no longer use manager field
			
			// Delete the transaction
			await deleteTransaction(updatedUser.transaction.id);
		}

		logger.info(`Done confirm move for user with id: ${id}`);
		res.status(200).send('Transaction confirmed');
	} catch (err) {
		logger.error(`Error confirming transaction for user ${id}, error: ${err}`);
		res.status(500).send('Error confirming transaction');
	}
};

export const updatePersonDetailsHandler = async (req: Request, res: Response) => {
	const { id } = req.params;
	
	if (!id) {
		res.status(400).send('User ID is required');
		return;
	}
	
	logger.info(`Update person details for id: ${id}`);
	logger.info(`Full request body:`, JSON.stringify(req.body, null, 2));
	try {
		const { name, site, email, serviceType, commander, systemRoles, selectedGroupId, newGroupName, newSiteManagerSites, replacementAdmins } = req.body as UpdatePersonDetails;
		
		// Log received fields for debugging
		logger.info(`Received update fields - selectedGroupId: "${selectedGroupId}", newGroupName: "${newGroupName}", commander: "${commander}"`);

		// Normalize inputs - convert empty strings to undefined
		const normalizedSelectedGroupId = selectedGroupId?.trim() || undefined;
		const normalizedNewGroupName = newGroupName?.trim() || undefined;
		const normalizedCommander = commander?.trim() || undefined;
		
		logger.info(`Normalized fields - selectedGroupId: "${normalizedSelectedGroupId}", newGroupName: "${normalizedNewGroupName}", commander: "${normalizedCommander}"`);

		// Update basic person details
		await updatePersonDetails(id, { name, site, serviceType });
		
		// Handle commander assignment if provided
		if (normalizedCommander !== undefined) {
			logger.info(`Handling commander assignment for user ${id} to commander: ${normalizedCommander}`);
			
			try {
				// First, remove the person from all existing command groups where they are members
				const existingCommandGroupMemberships = await db.query.PersonsToGroups.findMany({
					where: (ptg: any) => and(eq(ptg.personId, id), eq(ptg.groupRole, 'member')),
					with: { group: true }
				});

				for (const ptg of existingCommandGroupMemberships) {
					if (ptg.group.command) {
						await removePersonFromGroup(id, ptg.groupId, 'member');
						logger.info(`Removed user ${id} from command group ${ptg.group.name} (${ptg.groupId})`);
					}
				}

				// If a new commander is specified, add the person to their command groups
				if (normalizedCommander) {
					const commanderCommandGroups = await findCommandGroupsByAdmin(normalizedCommander);
					
					if (commanderCommandGroups.length === 0) {
						logger.warn(`Commander ${normalizedCommander} has no command groups where they are admin`);
					} else {
						// Add the person as a member to all of the commander's command groups
						for (const group of commanderCommandGroups) {
							await addPersonToGroup(id, group.groupId, 'member');
							logger.info(`Added user ${id} as member to commander's command group: ${group.name} (${group.groupId})`);
						}
						logger.info(`Successfully assigned user ${id} to ${commanderCommandGroups.length} commander groups`);
					}
				}
			} catch (err) {
				logger.error(`Error handling commander assignment for user ${id}: ${err}`);
				// Don't fail the whole operation, just log the error
			}
		}
		
		// Handle system roles update if provided
		if (systemRoles) {
			// Delete existing system roles for this person
			await deleteUserSystemRoles(id);

			// Add new system roles
			for (const roleData of systemRoles) {
				await createSystemRole([roleData.name], id);
			}
		}

		// Handle newSiteManagerSites update if provided
		if (newSiteManagerSites && newSiteManagerSites.length > 0) {
			await updatePersonSiteManagerSites(id, newSiteManagerSites);
		}

		// Handle replacement admins if provided (do this BEFORE command group updates)
		if (replacementAdmins && Object.keys(replacementAdmins).length > 0) {
			logger.info(`Handling replacement admins for user ${id}:`, replacementAdmins);
			for (const [groupId, personId] of Object.entries(replacementAdmins)) {
				try {
					// Remove the original admin from the group
					await removePersonFromGroup(id, groupId, 'admin');
					logger.info(`Removed original admin ${id} from group ${groupId}`);
					
					// Add the replacement as admin to the group
					await addPersonToGroup(personId, groupId, 'admin');
					logger.info(`Added replacement admin ${personId} to group ${groupId}`);
				} catch (err) {
					logger.error(`Error replacing admin ${personId} in group ${groupId}:`, err);
					res.status(500).send(`Error replacing admin ${personId} in group ${groupId}`);
					return;
				}
			}
		}

		// Handle group assignment for personnelManager role
		const hasPersonnelManagerRole = systemRoles?.some((role: any) => role.name === 'personnelManager');
		if (hasPersonnelManagerRole) {
			logger.info(`Handling group assignment for personnelManager in update: ${id}`);
			
			let groupId: string;
			
			if (normalizedSelectedGroupId) {
				// Use existing group
				groupId = normalizedSelectedGroupId;
				logger.info(`Setting personnelManager ${id} as admin of existing group: ${groupId}`);
			} else if (normalizedNewGroupName) {
				// Create new group
				logger.info(`Creating new command group: ${normalizedNewGroupName} for personnelManager: ${id}`);
				// Check if group name already exists
				const existingGroup = await findGroupByName(normalizedNewGroupName);
				if (existingGroup) {
					logger.error(`Group name already exists: ${normalizedNewGroupName}`);
					res.status(400).send(`שם הקבוצה "${normalizedNewGroupName}" כבר קיים במערכת. אנא בחר שם אחר.`);
					return;
				}
				const newGroup = await createGroup(normalizedNewGroupName, true); // true for command group
				if (!newGroup?.groupId) {
					logger.error(`Failed to create group: ${normalizedNewGroupName}`);
					res.status(500).send('Failed to create group');
					return;
				}
				groupId = newGroup.groupId;
			} else {
				logger.error(`PersonnelManager ${id} has no group selection or new group name in update`);
				res.status(400).send('PersonnelManager must either select an existing group or provide a new group name');
				return;
			}
			
			try {
				// Remove from any remaining command groups that didn't have replacements
				const remainingCommandGroups = await db.query.PersonsToGroups.findMany({
					where: (ptg: any) => and(eq(ptg.personId, id), eq(ptg.groupRole, 'admin')),
					with: { group: true }
				});

				for (const ptg of remainingCommandGroups) {
					if (ptg.group.command) {
						await removePersonFromGroup(id, ptg.groupId, 'admin');
						logger.info(`Removed ${id} from remaining command group ${ptg.groupId}`);
					}
				}
				
				// Add to new group
				await addPersonToGroup(id, groupId, 'admin');
				logger.info(`Added personnelManager ${id} as admin to new command group: ${groupId}`);
			} catch (err) {
				logger.error(`Error updating personnelManager command group: ${err}`);
				res.status(500).send('Error updating personnelManager command group');
				return;
			}
		}

		logger.info(`Done update person details for id: ${id}`);
		res.status(200).send('Person details updated successfully');
	} catch (err) {
		logger.error(`Error updating person details for id ${id}, error: ${err}`);
		res.status(500).send('Error updating person details');
	}
};

export const deletePersonHandler = async (req: Request, res: Response) => {
	const { id } = req.params;

	if (!id) {
		res.status(400).send('User ID is required');
		return;
	}

	try {
		logger.info(`Delete user with id: ${id}`);
		await deletePerson(id);

		logger.info(`Done delete user with id: ${id}`);
		res.status(200).send('User deleted');
	} catch (err) {
		logger.error(`Error deleting user with id ${id}, error: ${err}`);
		res.status(500).send('Error deleting user');
	}
};

export const updateGlobalAlertHandler = async (req: Request, res: Response) => {
	try {
		logger.info('Update global alert status');
		await updateAlertStatus();

		logger.info('Done update global alert status');
		res.status(200).send('Global alert status updated');
	} catch (err) {
		logger.error(`Error updating global alert status, error: ${err}`);
		res.status(500).send('Error updating global alert status');
	}
};