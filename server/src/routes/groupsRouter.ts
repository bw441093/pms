import { Router } from 'express';
import authorize from '../middleware/authorization';
import { getGroupsByPersonIdHandler, getGroupByIdHandler, getPersonsByGroupIdHandler } from '../handlers/groups';

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

export default router;
