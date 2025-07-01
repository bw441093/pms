import { Request, Response } from 'express';
import { findGroupsByPersonId, findGroupById, findPersonsByGroupId, findPersonRoleInGroups } from '../db/groups';

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


