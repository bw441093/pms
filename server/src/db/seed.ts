import { eq } from 'drizzle-orm';
import { db } from './db';
import { SystemRolesTable, GroupsTable } from './schema';
import { logger } from '../logger';

// Predefined system roles that should exist in the database
const PREDEFINED_SYSTEM_ROLES = [
	{
		name: 'siteManager',
		opts: null, // Site managers will have specific sites assigned when created
	},
	{
		name: 'personnelManager',
		opts: null,
	},
	{
		name: 'hrManager',
		opts: null,
	},
	{
		name: 'admin',
		opts: null,
	},
] as const;

// Predefined groups that should exist in the database
const PREDEFINED_GROUPS = [
	// Command groups
	{
		name: 'לשכת מפקד 9920',
		command: true,
	},
	{
		name: 'ענף טכנולוגי',
		command: true,
	},
    {
        name: ' מנהל משאבי אנוש',
        command: true,
    },
	{
		name: 'מדור כחול לבן',
		command: true,
	},
	{
		name: 'צוות תכנון',
		command: true,
	},
	// Site groups (non-command) - All sites from SITE_OPTIONS
	{
		name: 'איילת השחר', // mbt
		command: false,
	},
	{
		name: 'בראשית', // mfs
		command: false,
	},
	{
		name: 'ביה״ב', // kir
		command: false,
	},
	{
		name: 'רקיע', // mdt
		command: false,
	},
	{
		name: 'אחר', // other
		command: false,
	},
	// Additional non-command groups
    {
        name: 'משמרת עיבוד',
        command: false,
    },
] as const;

/**
 * Seeds predefined system roles into the database if they don't already exist
 */
export const seedSystemRoles = async (): Promise<void> => {
	logger.info('🎭 Seeding system roles...');
	
	for (const roleData of PREDEFINED_SYSTEM_ROLES) {
		try {
			// Check if role already exists
			const existingRole = await db.query.SystemRolesTable.findFirst({
				where: eq(SystemRolesTable.name, roleData.name),
			});

			if (!existingRole) {
				// Insert the role if it doesn't exist
				await db.insert(SystemRolesTable).values({
					name: roleData.name,
					opts: roleData.opts,
				});
				logger.info(`  ✅ Created system role: ${roleData.name}`);
			} else {
				logger.info(`  ℹ️  System role already exists: ${roleData.name}`);
			}
		} catch (error) {
			logger.error(`  ❌ Failed to create system role: ${roleData.name}`, error);
		}
	}
	
	logger.info('✅ System roles seeding completed');
};

/**
 * Seeds predefined groups into the database if they don't already exist
 */
export const seedGroups = async (): Promise<void> => {
	logger.info('👥 Seeding groups...');
	
	for (const groupData of PREDEFINED_GROUPS) {
		try {
			// Check if group already exists
			const existingGroup = await db.query.GroupsTable.findFirst({
				where: eq(GroupsTable.name, groupData.name),
			});

			if (!existingGroup) {
				// Insert the group if it doesn't exist
				await db.insert(GroupsTable).values({
					name: groupData.name,
					command: groupData.command,
				});
				logger.info(`  ✅ Created group: ${groupData.name}`);
			} else {
				logger.info(`  ℹ️  Group already exists: ${groupData.name}`);
			}
		} catch (error) {
			logger.error(`  ❌ Failed to create group: ${groupData.name}`, error);
		}
	}
	
	logger.info('✅ Groups seeding completed');
};

/**
 * Main seeding function that seeds all predefined data
 */
export const seedDatabase = async (): Promise<void> => {
	logger.info('🌱 Starting database seeding...');
	
	try {
		await seedSystemRoles();
		await seedGroups();
		logger.info('🎉 Database seeding completed successfully!');
	} catch (error) {
		logger.error('💥 Database seeding failed:', error);
		throw error;
	}
}; 