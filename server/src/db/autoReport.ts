import { db } from './db';
import { EventsTable } from './schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { findPersonsByGroupId } from './groups';
import { PersonsTable } from './schema';
import cron from 'node-cron';
import { logger } from '../logger';

function formatDateForSQL(date: Date) {
  const pad = (n: number, z = 2) => ('00' + n).slice(-z);
  return (
    date.getFullYear() + '-' +
    pad(date.getMonth() + 1) + '-' +
    pad(date.getDate()) + ' ' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes()) + ':' +
    pad(date.getSeconds()) + '.' +
    pad(date.getMilliseconds(), 3)
  );
}

export async function autoUpdateLocationsForActiveEvents() {
  const now = new Date();
  const nowStr = formatDateForSQL(now);
  logger.info(`Checking for active events at ${nowStr}`);
  
  const activeEvents = await db.query.EventsTable.findMany({
    where: () => sql`"start_time" <= ${nowStr} AND "end_time" >= ${nowStr} AND "mandatory" = true`
  });

  logger.info(`Found ${activeEvents.length} active events`);

  for (const event of activeEvents) {
    const { entityType, entityId, location } = event;
    let personIds: string[] = [];
    if (entityType === 'person') {
      personIds = [entityId];
    } else if (entityType === 'group') {
      const persons = await findPersonsByGroupId(entityId);
      personIds = persons.map(p => p.id);
    }
    logger.info(`Found ${personIds.length} persons for event ${event.title}`);
    if (personIds.length > 0) {
      await db.update(PersonsTable)
        .set({ location, updatedAt: new Date() })
        .where(inArray(PersonsTable.id, personIds));
    }
  }
  logger.info('Auto report ran!');
}

cron.schedule('0 0 * * *', () => {
  autoUpdateLocationsForActiveEvents().catch(console.error);
});
