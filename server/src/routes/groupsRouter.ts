import { Router } from 'express';
import authorize from '../middleware/authorization';
import { getGroupsByPersonIdHandler, getGroupByIdHandler, getPersonsByGroupIdHandler, getPersonRoleInGroupHandler, getCommandChainHandler, getSubordinateCommandGroupsHandler, checkGroupNameExistsHandler } from '../handlers/groups';

const router = Router();

router.get('/person/:personId', async (req, res) => {
	try {
		await getGroupsByPersonIdHandler(req, res);
	} catch (error) {
		console.error('Error getting groups by person ID:', error);
		res.status(500).json({ error: 'Failed to get groups' });
	}
});

router.get('/:groupId', async (req, res) => {
	try {
		await getGroupByIdHandler(req, res);
	} catch (error) {
		console.error('Error getting group by ID:', error);
		res.status(500).json({ error: 'Failed to get group' });
	}
});

router.get('/:groupId/persons', async (req, res) => {
	try {
		await getPersonsByGroupIdHandler(req, res);
	} catch (error) {
		console.error('Error getting persons by group ID:', error);
		res.status(500).json({ error: 'Failed to get persons' });
	}
});

router.get('/person/:personId/roles', async (req, res) => {
	try {
		await getPersonRoleInGroupHandler(req, res);
	} catch (error) {
		console.error('Error getting person role in group:', error);
		res.status(500).json({ error: 'Failed to get person role in group' });
	}
});

router.get('/person/:personId/command-chain', async (req, res) => {
	try {
		await getCommandChainHandler(req, res);
	} catch (error) {
		console.error('Error getting command chain:', error);
		res.status(500).json({ error: 'Failed to get command chain' });
	}
});

router.get('/subordinate-command-groups/:managerId', async (req, res) => {
	try {
		await getSubordinateCommandGroupsHandler(req, res);
	} catch (error) {
		console.error('Error getting subordinate command groups:', error);
		res.status(500).json({ error: 'Failed to get subordinate command groups' });
	}
});

router.get('/check-name-exists/:name', async (req, res) => {
	try {
		await checkGroupNameExistsHandler(req, res);
	} catch (error) {
		console.error('Error checking group name exists:', error);
		res.status(500).json({ error: 'Failed to check group name' });
	}
});

export default router;
