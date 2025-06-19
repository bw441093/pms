#!/usr/bin/env tsx

import { generateCompleteTestData, clearDatabase } from './testDataGenerator';

async function main() {
	const args = process.argv.slice(2);
	const command = args[0];

	switch (command) {
		case 'clear':
			console.log('🧹 Clearing database...');
			await clearDatabase();
			console.log('✅ Database cleared successfully!');
			break;

		case 'generate':
		case 'seed':
			const options = {
				userCount: parseInt(args[1] ?? '30'),
				transactionCount: parseInt(args[2] ?? '50'),
				includeScenarios: args[3] !== 'false',
			};

			console.log('🌱 Generating test data with options:', options);
			await generateCompleteTestData(options);
			break;

		case 'help':
		default:
			console.log(`
🎯 PMS Test Data Generator

Usage:
  npm run seed:generate [userCount] [transactionCount] [includeScenarios]
  npm run seed:clear

Commands:
  generate, seed    Generate test data (default: 30 users, 50 transactions, scenarios enabled)
  clear            Clear all data from database
  help             Show this help message

Examples:
  npm run seed:generate                    # Generate default test data
  npm run seed:generate 50 100            # Generate 50 users, 100 transactions
  npm run seed:generate 20 30 false       # Generate 20 users, 30 transactions, no scenarios
  npm run seed:clear                      # Clear all data

Options:
  userCount        Number of users to generate (default: 30)
  transactionCount Number of transactions to generate (default: 50)
  includeScenarios Whether to include specific test scenarios (default: true)
      `);
			break;
	}
}

main()
	.then(() => {
		console.log('🎉 Operation completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Operation failed:', error);
		process.exit(1);
	});
