import { db } from './db';
import { EventsTable } from './schema';
import { eq } from 'drizzle-orm';

export async function getEventsByEntityId(entityId: string, entityType: 'group' | 'person') {
  return await db.query.EventsTable.findMany({
    where: (event) => eq(event.entityId, entityId) && eq(event.entityType, entityType),
  });
}

export async function createEvent(event: any) {
  const [created] = await db.insert(EventsTable).values(event).returning();
  return created;
}

export async function updateEvent(eventId: string, event: any) {
  const [updated] = await db.update(EventsTable)
    .set(event)
    .where(eq(EventsTable.eventId, eventId))
    .returning();
  return updated;
}

export async function deleteEvent(eventId: string) {
  const [deleted] = await db.delete(EventsTable)
    .where(eq(EventsTable.eventId, eventId))
    .returning();
  return deleted;
} 