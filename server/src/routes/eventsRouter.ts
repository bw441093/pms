import { Router } from 'express';
import { getEventsByEntityIdHandler, createEventHandler, updateEventHandler, deleteEventHandler } from '../handlers/events';

const router = Router();

router.get('/', async (req, res) => {
  try {
    await getEventsByEntityIdHandler(req, res);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

router.post('/', async (req, res) => {
  try {
    await createEventHandler(req, res);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.put('/:eventId', async (req, res) => {
  try {
    await updateEventHandler(req, res);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/:eventId', async (req, res) => {
  try {
    await deleteEventHandler(req, res);
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Export the router for use in the main app
export default router; 