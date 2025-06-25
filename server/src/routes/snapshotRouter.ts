import { Router } from 'express';
import authorize from '../middleware/authorization';
import { getSnapshotDatesHandler, getSnapshotByDateHandler } from '../handlers/snapshot';

const router = Router();

router.get('/dates', authorize(['hrManager', 'admin']), async (req, res) => {
	try {
		await getSnapshotDatesHandler(req, res);
	} catch (error) {
		console.error('Error in snapshot dates route:', error);
		res.status(500).json({ error: 'Failed to get snapshot dates' });
	}
});

router.get('/:dateStr', authorize(['hrManager', 'admin']), async (req, res) => {
	try {
		await getSnapshotByDateHandler(req, res);
	} catch (error) {
		console.error('Error in snapshot route:', error);
		res.status(500).json({ error: 'Failed to get snapshot' });
	}
});

export default router;
