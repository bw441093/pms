import { eq } from 'drizzle-orm';
import { db } from './db';
import { SystemRolesTable, GroupsTable } from './schema';
import { logger } from '../logger';

// Predefined system roles that should exist in the database
const PREDEFINED_SYSTEM_ROLES = [
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
		site: false,
	},
	{
		name: 'ענף טכנולוגי',
		command: true,
		site: false,
	},
    {
        name: ' מנהל משאבי אנוש',
        command: true,
		site: false,
    },
	{
		name: 'מדור כחול לבן',
		command: true,
		site: false,
	},
	{
		name: 'צוות תכנון',
		command: true,
		site: false,
	},
	// Site groups (non-command) - All sites from SITE_OPTIONS
	{
		name: 'איילת השחר', // mbt
		command: false,
		site: true,
	},
	{
		name: 'בראשית', // mfs
		command: false,
		site: true,
	},
	{
		name: 'ביה״ב', // kir
		command: false,
		site: true,
	},
	{
		name: 'רקיע', // mdt
		command: false,
		site: true,
	},
	{
		name: 'אחר', // other
		command: false,
		site: true,
	},
	// Additional non-command groups
    {
        name: 'משמרת עיבוד',
        command: false,
		site: false,
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
					site: groupData.site,
				});
				logger.info(`  ✅ Created group: ${groupData.name} (${groupData.site ? 'site' : 'non-site'} group)`);
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