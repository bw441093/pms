#!/usr/bin/env tsx

import { seedDatabase } from './seed';

/**
 * Standalone script to run database seeding
 * Usage: npm run seed:predefined
 */
async function main() {
	try {
		await seedDatabase();
		console.log('🎉 Database seeding completed successfully!');
		process.exit(0);
	} catch (error) {
		console.error('💥 Database seeding failed:', error);
		process.exit(1);
	}
}

main(); 