import { InferSelectModel } from 'drizzle-orm';
import { PersonsTable } from '../db/schema'

export type Person = InferSelectModel<typeof PersonsTable>;
