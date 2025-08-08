import { db } from './db';
import { EventsTable, EventsToGroups, GroupsTable, PersonsTable } from './schema';
import { eq, inArray } from 'drizzle-orm';

export async function getEventsByEntityId(entityId: string, entityType: 'group' | 'person') {
  return await db.query.EventsTable.findMany({
    where: (event) => eq(event.entityId, entityId) && eq(event.entityType, entityType),
    with: {
      eventsToGroups: {
        with: {
          group: true
        }
      }
    }
  });
}

export async function getEventsByGroupIds(groupIds: string[]) {
  if (groupIds.length === 0) return [];
  
  return await db.query.EventsTable.findMany({
    where: (event) => inArray(event.eventId, 
      db.select({ eventId: EventsToGroups.eventId })
        .from(EventsToGroups)
        .where(inArray(EventsToGroups.groupId, groupIds))
    ),
    with: {
      eventsToGroups: {
        with: {
          group: true
        }
      }
    }
  });
}

export async function createEvent(event: any) {
  const { groupIds, ...eventData } = event;
  
  // Validate that the entity exists in the appropriate table
  if (eventData.entityType === 'group') {
    const group = await db.select().from(GroupsTable).where(eq(GroupsTable.groupId, eventData.entityId)).limit(1);
    if (group.length === 0) {
      throw new Error(`Group with ID ${eventData.entityId} does not exist`);
    }
  } else if (eventData.entityType === 'person') {
    const person = await db.select().from(PersonsTable).where(eq(PersonsTable.id, eventData.entityId)).limit(1);
    if (person.length === 0) {
      throw new Error(`Person with ID ${eventData.entityId} does not exist`);
    }
  }
  
  const [created] = await db.insert(EventsTable).values(eventData).returning();
  
  if (!created) {
    throw new Error('Failed to create event');
  }
  
  // Add group relationships if groupIds are provided
  if (groupIds && groupIds.length > 0) {
    const groupRelations = groupIds.map((groupId: string) => ({
      eventId: created.eventId,
      groupId
    }));
    
    await db.insert(EventsToGroups).values(groupRelations);
  }
  
  // Return the created event with relationships
  return await db.query.EventsTable.findFirst({
    where: eq(EventsTable.eventId, created.eventId),
    with: {
      eventsToGroups: {
        with: {
          group: true
        }
      }
    }
  });
}

export async function updateEvent(eventId: string, event: any) {
  const { groupIds, ...eventData } = event;
  
  const [updated] = await db.update(EventsTable)
    .set(eventData)
    .where(eq(EventsTable.eventId, eventId))
    .returning();
  
  if (!updated) return null;
  
  // Update group relationships
  if (groupIds !== undefined) {
    // Remove existing group relationships
    await db.delete(EventsToGroups).where(eq(EventsToGroups.eventId, eventId));
    
    // Add new group relationships
    if (groupIds.length > 0) {
      const groupRelations = groupIds.map((groupId: string) => ({
        eventId,
        groupId
      }));
      
      await db.insert(EventsToGroups).values(groupRelations);
    }
  }
  
  // Return the updated event with relationships
  return await db.query.EventsTable.findFirst({
    where: eq(EventsTable.eventId, eventId),
    with: {
      eventsToGroups: {
        with: {
          group: true
        }
      }
    }
  });
}

export async function deleteEvent(eventId: string) {
  const [deleted] = await db.delete(EventsTable)
    .where(eq(EventsTable.eventId, eventId))
    .returning();
  return deleted;
} 