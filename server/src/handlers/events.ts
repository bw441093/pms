import { Request, Response } from 'express';
import { getEventsByEntityId, createEvent, updateEvent, deleteEvent } from '../db/events';

export const getEventsByEntityIdHandler = async (req: Request, res: Response) => {
  try {
    const { entityId, entityType } = req.query;
    if (typeof entityId !== 'string' || (entityType !== 'group' && entityType !== 'person')) {
      res.status(400).json({ error: 'entityId and entityType (group|person) are required' });
      return;
    }
    
    const events = await getEventsByEntityId(entityId, entityType);
    res.json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
};

export const createEventHandler = async (req: Request, res: Response) => {
  try {
    const event = req.body;
    if (event.startTime && typeof event.startTime === 'string') {
      event.startTime = new Date(event.startTime);
    }
    if (event.endTime && typeof event.endTime === 'string') {
      event.endTime = new Date(event.endTime);
    }
    const created = await createEvent(event);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

export const updateEventHandler = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    if (typeof eventId !== 'string') {
      res.status(400).json({ error: 'eventId is required' });
      return;
    }
    const event = req.body;
    if (event.startTime && typeof event.startTime === 'string') {
      event.startTime = new Date(event.startTime);
    }
    if (event.endTime && typeof event.endTime === 'string') {
      event.endTime = new Date(event.endTime);
    }
    const updated = await updateEvent(eventId, event);
    if (!updated) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

export const deleteEventHandler = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    if (typeof eventId !== 'string') {
      res.status(400).json({ error: 'eventId is required' });
      return;
    }
    const deleted = await deleteEvent(eventId);
    if (!deleted) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(deleted);
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
}; 