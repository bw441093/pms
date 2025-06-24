import { db } from './db';
import {
  UsersTable,
  PersonsTable,
  RolesTable,
  PersonsToRoles,
  TransactionsTable,
} from './schema';
import { sql } from 'drizzle-orm';

async function resetSchema() {
  console.log('🧹 Dropping all tables...');
  
  // Drop all tables
  await db.execute(sql`DROP TABLE IF EXISTS persons_to_roles CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS transactions CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS roles CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS persons CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);

  console.log('🌱 Creating tables...');

  // Create tables
  await db.execute(sql`
    CREATE TABLE users (
      user_id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      email text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE persons (
      user_id uuid PRIMARY KEY NOT NULL,
      name text NOT NULL,
      site text NOT NULL,
      manager_id uuid REFERENCES persons(user_id),
      "alertStatus" text DEFAULT 'good' NOT NULL,
      "reportStatus" text DEFAULT 'present' NOT NULL,
      location text DEFAULT 'home' NOT NULL,
      "serviceType" text NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE roles (
      role_id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      opts json
    );
  `);

  await db.execute(sql`
    CREATE TABLE persons_to_roles (
      user_id uuid NOT NULL REFERENCES persons(user_id) ON DELETE CASCADE,
      role_id uuid NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
    );
  `);

  await db.execute(sql`
    CREATE TABLE transactions (
      transaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      origin text NOT NULL,
      target text NOT NULL,
      "originConfirmation" boolean DEFAULT false NOT NULL,
      "targetConfirmation" boolean DEFAULT false NOT NULL,
      field text DEFAULT 'site' NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      status text DEFAULT 'pending' NOT NULL,
      user_id uuid NOT NULL REFERENCES persons(user_id) ON DELETE CASCADE,
      CONSTRAINT transactions_user_id_unique UNIQUE(user_id)
    );
  `);

  console.log('✅ Schema reset complete!');
}

resetSchema().catch(console.error); 