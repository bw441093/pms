#!/usr/bin/env tsx

import { seedSystemRoles, seedGroups } from './seed';

/**
 * Simple test script to validate seeding logic
 */
async function testSeed() {
	console.log('🧪 Testing database seeding logic...');
	
	try {
		console.log('Testing system roles seeding...');
		await seedSystemRoles();
		
		console.log('Testing groups seeding...');
		await seedGroups();
		
		console.log('✅ All seeding tests passed!');
	} catch (error) {
		console.error('❌ Seeding test failed:', error);
		throw error;
	}
}

// Only run if this file is executed directly
if (require.main === module) {
	testSeed()
		.then(() => {
			console.log('🎉 Test completed successfully!');
			process.exit(0);
		})
		.catch((error) => {
			console.error('💥 Test failed:', error);
			process.exit(1);
		});
} 