import type { Request, Response } from 'express';

import {
	findGroupsByPersonId,
	findGroupById,
	findPersonsByGroupId,
	findPersonRoleInGroups,
	findAllSubordinatePersons,
	findAllSubordinateCommandGroups,
	findGroupByName,
} from '../db/groups';
import type { Id } from '../types';
import { logger } from '../logger';

export const getGroupsByPersonIdHandler = async (req: Request, res: Response) => {
	try {
		const { personId } = req.params;
		if (!personId) {
			return res.status(400).json({ error: 'Person ID is required' });
		}

		const groups = await findGroupsByPersonId(personId);
		return res.json(groups);
	} catch (error) {
		console.error('Error getting groups by person ID:', error);
		return res.status(500).json({ error: 'Failed to get groups' });
	}
};

export const getGroupByIdHandler = async (req: Request, res: Response) => {
	try {
		const { groupId } = req.params;
		if (!groupId) {
			return res.status(400).json({ error: 'Group ID is required' });
		}

		const group = await findGroupById(groupId);
		if (!group) {
			return res.status(404).json({ error: 'Group not found' });
		}

		return res.json(group);
	} catch (error) {
		console.error('Error getting group by ID:', error);
		return res.status(500).json({ error: 'Failed to get group' });
	}
};

export const getPersonsByGroupIdHandler = async (req: Request, res: Response) => {
	try {
		const { groupId } = req.params;
		if (!groupId) {
			return res.status(400).json({ error: 'Group ID is required' });
		}

		const persons = await findPersonsByGroupId(groupId);
		return res.json(persons);
	} catch (error) {
		console.error('Error getting persons by group ID:', error);
		return res.status(500).json({ error: 'Failed to get persons' });
	}
};

export const getPersonRoleInGroupHandler = async (req: Request, res: Response) => {
	try {
		const { personId } = req.params;
		const groupIdsParam = req.query.groupIds as string;
		if (!personId || !groupIdsParam) {
			return res.status(400).json({ error: 'Person ID and group IDs are required' });
		}
		const groupIds = groupIdsParam.split(',');
		const roles = await findPersonRoleInGroups(personId, groupIds);
		return res.json(roles);
	} catch (error) {
		console.error('Error getting person role in group:', error);
		return res.status(500).json({ error: 'Failed to get person role in group' });
	}
};

export const getCommandChainHandler = async (req: Request, res: Response) => {
	try {
		const { personId } = req.params;
		if (!personId) {
			return res.status(400).json({ error: 'Person ID is required' });
		}
		const subordinates = await findAllSubordinatePersons(personId);
		return res.json(subordinates);
	} catch (error) {
		console.error('Error getting command chain:', error);
		return res.status(500).json({ error: 'Failed to get command chain' });
	}
};

export const getSubordinateCommandGroupsHandler = async (req: Request, res: Response) => {
	try {
		const { managerId } = req.params;
		
		if (!managerId) {
			logger.error('Manager ID is required');
			res.status(400).send('Manager ID is required');
			return;
		}

		logger.info(`Fetching subordinate command groups for manager: ${managerId}`);
		const groups = await findAllSubordinateCommandGroups(managerId);
		logger.info(`Found ${groups.length} subordinate command groups`);
		
		res.status(200).json(groups);
	} catch (err) {
		logger.error(`Error fetching subordinate command groups: ${err}`);
		res.status(500).send('Error fetching subordinate command groups');
	}
};

export const checkGroupNameExistsHandler = async (req: Request, res: Response) => {
	try {
		const { name } = req.params;
		
		if (!name) {
			logger.error('Group name is required');
			res.status(400).send('Group name is required');
			return;
		}

		logger.info(`Checking if group name exists: ${name}`);
		const existingGroup = await findGroupByName(name);
		
		res.status(200).json({ exists: !!existingGroup });
	} catch (err) {
		logger.error(`Error checking group name exists: ${err}`);
		res.status(500).send('Error checking group name');
	}
};


