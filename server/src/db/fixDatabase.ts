#!/usr/bin/env tsx

import { db } from './db';
import { sql } from 'drizzle-orm';

async function fixDatabase() {
	console.log('🔧 Fixing database tables...');
	
	try {
		// Create users table (from migration 0000)
		console.log('Creating users table...');
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS "users" (
				"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
				"email" text NOT NULL,
				"created_at" timestamp DEFAULT now() NOT NULL
			);
		`);

		// Create persons table (from migration 0000)
		console.log('Creating persons table...');
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS "persons" (
				"user_id" uuid PRIMARY KEY NOT NULL,
				"name" text NOT NULL,
				"site" text NOT NULL,
				"manager_id" uuid,
				"alertStatus" text DEFAULT 'good' NOT NULL,
				"reportStatus" text DEFAULT 'present' NOT NULL,
				"location" text DEFAULT 'home' NOT NULL,
				"serviceType" text,
				"updated_at" timestamp DEFAULT now() NOT NULL
			);
		`);

		// Add persons foreign key constraint
		try {
			await db.execute(sql`
				ALTER TABLE "persons" 
				ADD CONSTRAINT "persons_manager_id_persons_user_id_fk" 
				FOREIGN KEY ("manager_id") REFERENCES "public"."persons"("user_id") 
				ON DELETE no action ON UPDATE no action;
			`);
		} catch (e) {
			console.log('Persons self-reference foreign key already exists');
		}

		// Create transactions table (from migration 0000)
		console.log('Creating transactions table...');
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS "transactions" (
				"transaction_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
				"origin" text NOT NULL,
				"target" text NOT NULL,
				"originConfirmation" boolean DEFAULT false NOT NULL,
				"targetConfirmation" boolean DEFAULT false NOT NULL,
				"field" text DEFAULT 'site' NOT NULL,
				"created_at" timestamp DEFAULT now() NOT NULL,
				"status" text DEFAULT 'pending' NOT NULL,
				"user_id" uuid NOT NULL
			);
		`);

		// Create system_roles table if it doesn't exist (from migration 0003)
		console.log('Creating system_roles table...');
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS "system_roles" (
				"role_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
				"name" text NOT NULL,
				"opts" json
			);
		`);

		// Create persons_to_system_roles table (from migration 0003)
		console.log('Creating persons_to_system_roles table...');
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS "persons_to_system_roles" (
				"user_id" uuid NOT NULL,
				"role_id" uuid NOT NULL,
				CONSTRAINT "persons_to_system_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
			);
		`);

		// Add foreign key constraints
		console.log('Adding foreign key constraints...');
		try {
			await db.execute(sql`
				ALTER TABLE "persons_to_system_roles" 
				ADD CONSTRAINT "persons_to_system_roles_user_id_persons_user_id_fk" 
				FOREIGN KEY ("user_id") REFERENCES "public"."persons"("user_id") 
				ON DELETE cascade ON UPDATE no action;
			`);
		} catch (e) {
			console.log('Foreign key constraint for persons already exists or persons table missing');
		}

		try {
			await db.execute(sql`
				ALTER TABLE "persons_to_system_roles" 
				ADD CONSTRAINT "persons_to_system_roles_role_id_system_roles_role_id_fk" 
				FOREIGN KEY ("role_id") REFERENCES "public"."system_roles"("role_id") 
				ON DELETE cascade ON UPDATE no action;
			`);
		} catch (e) {
			console.log('Foreign key constraint for system_roles already exists');
		}

		// Create groups table if missing
		console.log('Creating groups table...');
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS "groups" (
				"group_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
				"name" text NOT NULL,
				"command" boolean DEFAULT false NOT NULL,
				"site" boolean DEFAULT false NOT NULL
			);
		`);

		// Create persons_to_groups table if missing
		console.log('Creating persons_to_groups table...');
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS "persons_to_groups" (
				"person_id" uuid NOT NULL,
				"group_id" uuid NOT NULL,
				"groupRole" text NOT NULL,
				CONSTRAINT "persons_to_groups_person_id_group_id_pk" PRIMARY KEY("person_id","group_id")
			);
		`);

		// Add foreign key constraints for groups
		try {
			await db.execute(sql`
				ALTER TABLE "persons_to_groups" 
				ADD CONSTRAINT "persons_to_groups_person_id_persons_user_id_fk" 
				FOREIGN KEY ("person_id") REFERENCES "public"."persons"("user_id") 
				ON DELETE cascade ON UPDATE no action;
			`);
		} catch (e) {
			console.log('Foreign key constraint for persons_to_groups already exists');
		}

		try {
			await db.execute(sql`
				ALTER TABLE "persons_to_groups" 
				ADD CONSTRAINT "persons_to_groups_group_id_groups_group_id_fk" 
				FOREIGN KEY ("group_id") REFERENCES "public"."groups"("group_id") 
				ON DELETE cascade ON UPDATE no action;
			`);
		} catch (e) {
			console.log('Foreign key constraint for groups already exists');
		}

		console.log('✅ Database fix completed successfully!');
		
		// Verify tables exist
		const tables = await db.execute(sql`
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_schema = 'public'
			ORDER BY table_name;
		`);

		console.log('📋 Current tables:');
		tables.rows.forEach((row: any) => {
			console.log(`  - ${row.table_name}`);
		});

	} catch (error) {
		console.error('❌ Database fix failed:', error);
		throw error;
	}
}

fixDatabase()
	.then(() => {
		console.log('🎉 Database fix completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Database fix failed:', error);
		process.exit(1);
	}); 