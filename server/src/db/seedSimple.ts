#!/usr/bin/env tsx

import { db } from './db';
import {
	UsersTable,
	PersonsTable,
	GroupsTable,
	PersonsToGroups,
	SystemRolesTable,
	PersonsToSystemRoles,
} from './schema';
import { v4 as uuidv4 } from 'uuid';

async function clearDatabase() {
	console.log('🧹 Clearing existing data...');
	await db.delete(PersonsToSystemRoles);
	await db.delete(PersonsToGroups);
	await db.delete(SystemRolesTable);
	await db.delete(GroupsTable);
	await db.delete(PersonsTable);
	await db.delete(UsersTable);
	console.log('✅ Database cleared!');
}

async function seedSimpleData() {
	console.log('🌱 Starting simple seed...');
	
	// Create system roles
	console.log('🎭 Creating system roles...');
	const roles = [
		{
			id: uuidv4(),
			name: 'siteManager',
			opts: ['mbt'], // You manage mbt site
		},
		{
			id: uuidv4(),
			name: 'siteManager',
			opts: ['kir'], // Another site manager
		},
		{
			id: uuidv4(),
			name: 'personnelManager',
			opts: null,
		},
	];

	for (const role of roles) {
		await db.insert(SystemRolesTable).values(role);
		console.log(`  ✅ Created role: ${role.name}`);
	}

	// Create 4 groups
	console.log('👥 Creating 4 groups...');
	const groups = [
		{
			groupId: uuidv4(),
			name: 'Development Team',
			command: false,
			site: false,
		},
		{
			groupId: uuidv4(),
			name: 'Operations Team',
			command: true,
			site: false,
		},
		{
			groupId: uuidv4(),
			name: 'Security Team',
			command: true,
			site: false,
		},
		{
			groupId: uuidv4(),
			name: 'Strategic Planning Team',
			command: true,
			site: false,
		},
	];

	for (const group of groups) {
		await db.insert(GroupsTable).values(group);
		console.log(`  ✅ Created group: ${group.name}`);
	}

	// Create your user account
	console.log('👤 Creating your user account...');
	const userId = 'feb8bf9c-d2be-4f25-ad79-9d478af482a1';
	const userEmail = 'benjaminw@example.com';
	const userName = 'עומרי אבידן'; // You can change this

	// Create user
	await db.insert(UsersTable).values({
		id: userId,
		email: userEmail,
		createdAt: new Date(),
	});

	// Create person record
	await db.insert(PersonsTable).values({
		id: userId,
		name: userName,
		site: 'mbt',
		alertStatus: 'good',
		reportStatus: 'present',
		location: 'jerusalem',
		serviceType: 'hova',
		updatedAt: new Date(),
	});

	console.log(`  ✅ Created user: ${userName} (${userEmail})`);

	// Assign you as site manager for mbt
	await db.insert(PersonsToSystemRoles).values({
		userId: userId,
		roleId: roles[0]!.id, // mbt site manager
	});

	console.log(`  ✅ Made you site manager of: mbt`);

	// Create additional persons with specific relationships
	console.log('👥 Creating additional persons...');

	// 1. Create 8 people that belong to mbt site
	// 4 of them under your direct management
	const directReports = [
		{ name: 'Alice Johnson', email: 'alice.johnson@example.com' },
		{ name: 'Bob Smith', email: 'bob.smith@example.com' },
		{ name: 'Carol Davis', email: 'carol.davis@example.com' },
		{ name: 'David Wilson', email: 'david.wilson@example.com' },
	];

	const directReportIds = [];
	for (const report of directReports) {
		const reportId = uuidv4();
		
		await db.insert(UsersTable).values({
			id: reportId,
			email: report.email,
			createdAt: new Date(),
		});

		await db.insert(PersonsTable).values({
			id: reportId,
			name: report.name,
			site: 'mbt', // Same site as you
			alertStatus: 'good',
			reportStatus: 'present',
			location: 'jerusalem',
			serviceType: 'hova',
			updatedAt: new Date(),
		});

		directReportIds.push(reportId);
		console.log(`  ✅ Created direct report: ${report.name}`);
	}

	// Create another manager for mbt site
	const otherMbtManagerId = uuidv4();
	await db.insert(UsersTable).values({
		id: otherMbtManagerId,
		email: 'other.mbt.manager@example.com',
		createdAt: new Date(),
	});

	await db.insert(PersonsTable).values({
		id: otherMbtManagerId,
		name: 'Other MBT Manager',
		site: 'mbt',
		alertStatus: 'good',
		reportStatus: 'present',
		location: 'jerusalem',
		serviceType: 'hova',
		updatedAt: new Date(),
	});

	// 4 remaining people from the 8 that belong to mbt site (different manager)
	const siteColleagues = [
		{ name: 'Eva Brown', email: 'eva.brown@example.com' },
		{ name: 'Frank Garcia', email: 'frank.garcia@example.com' },
		{ name: 'Grace Miller', email: 'grace.miller@example.com' },
		{ name: 'Henry Lee', email: 'henry.lee@example.com' },
	];

	const siteColleagueIds = [];
	for (const colleague of siteColleagues) {
		const colleagueId = uuidv4();
		
		await db.insert(UsersTable).values({
			id: colleagueId,
			email: colleague.email,
			createdAt: new Date(),
		});

		await db.insert(PersonsTable).values({
			id: colleagueId,
			name: colleague.name,
			site: 'mbt', // Same site as you
			alertStatus: 'good',
			reportStatus: 'present',
			location: 'jerusalem',
			serviceType: 'hova',
			updatedAt: new Date(),
		});

		siteColleagueIds.push(colleagueId);
		console.log(`  ✅ Created mbt site colleague: ${colleague.name}`);
	}

	// 2. Create 4 people whose direct manager's manager is you (indirect reports)
	// First create 2 middle managers who report to you
	const middleManagers = [
		{ name: 'Team Lead Alpha', email: 'lead.alpha@example.com' },
		{ name: 'Team Lead Beta', email: 'lead.beta@example.com' },
	];

	const middleManagerIds = [];
	for (const manager of middleManagers) {
		const managerId = uuidv4();
		
		await db.insert(UsersTable).values({
			id: managerId,
			email: manager.email,
			createdAt: new Date(),
		});

		await db.insert(PersonsTable).values({
			id: managerId,
			name: manager.name,
			site: 'mbt', // Same site as you
			alertStatus: 'good',
			reportStatus: 'present',
			location: 'jerusalem',
			serviceType: 'hova',
			updatedAt: new Date(),
		});

		middleManagerIds.push(managerId);
		console.log(`  ✅ Created middle manager: ${manager.name}`);
	}

	// Now create 4 people who report to these middle managers
	const indirectReports = [
		{ name: 'John Alpha1', email: 'john.alpha1@example.com' },
		{ name: 'Jane Alpha2', email: 'jane.alpha2@example.com' },
		{ name: 'Mike Beta1', email: 'mike.beta1@example.com' },
		{ name: 'Lisa Beta2', email: 'lisa.beta2@example.com' },
	];

	const indirectReportIds = [];
	for (let i = 0; i < indirectReports.length; i++) {
		const report = indirectReports[i]!;
		const reportId = uuidv4();
		const managerIndex = Math.floor(i / 2); // 2 reports per manager
		
		await db.insert(UsersTable).values({
			id: reportId,
			email: report.email,
			createdAt: new Date(),
		});

		await db.insert(PersonsTable).values({
			id: reportId,
			name: report.name,
			site: 'mbt',
			alertStatus: 'good',
			reportStatus: 'present',
			location: 'jerusalem',
			serviceType: 'hova',
			updatedAt: new Date(),
		});

		indirectReportIds.push(reportId);
		console.log(`  ✅ Created indirect report: ${report.name}`);
	}

	// 3. Create 4 people with a direct manager who is not you (unrelated)
	// Create another manager (not reporting to you)
	const unrelatedManagerId = uuidv4();
	await db.insert(UsersTable).values({
		id: unrelatedManagerId,
		email: 'unrelated.manager@example.com',
		createdAt: new Date(),
	});

	await db.insert(PersonsTable).values({
		id: unrelatedManagerId,
		name: 'Unrelated Manager',
		site: 'kir', // Different site
		alertStatus: 'good',
		reportStatus: 'present',
		location: 'haifa',
		serviceType: 'hova',
		updatedAt: new Date(),
	});

	// Assign unrelated manager the kir site manager role
	await db.insert(PersonsToSystemRoles).values({
		userId: unrelatedManagerId,
		roleId: roles[1]!.id, // kir site manager
	});

	const unrelatedPersons = [
		{ name: 'Sam Wilson', email: 'sam.wilson@example.com' },
		{ name: 'Tina Lopez', email: 'tina.lopez@example.com' },
		{ name: 'Omar Hassan', email: 'omar.hassan@example.com' },
		{ name: 'Nina Patel', email: 'nina.patel@example.com' },
	];

	const unrelatedIds = [];
	for (const person of unrelatedPersons) {
		const personId = uuidv4();
		
		await db.insert(UsersTable).values({
			id: personId,
			email: person.email,
			createdAt: new Date(),
		});

		await db.insert(PersonsTable).values({
			id: personId,
			name: person.name,
			site: 'kir', // Different site
			alertStatus: 'good',
			reportStatus: 'present',
			location: 'haifa',
			serviceType: 'hova',
			updatedAt: new Date(),
		});

		unrelatedIds.push(personId);
		console.log(`  ✅ Created unrelated person: ${person.name}`);
	}

	// Assign persons to groups
	console.log('👥 Assigning persons to groups...');

	// Make you an admin of the Operations Team
	await db.insert(PersonsToGroups).values({
		personId: userId,
		groupId: groups[1]!.groupId, // Operations Team
		groupRole: 'admin',
	});

	// Make you an admin of the Security Team as well
	await db.insert(PersonsToGroups).values({
		personId: userId,
		groupId: groups[2]!.groupId, // Security Team
		groupRole: 'admin',
	});

	// Make you an admin of the Strategic Planning Team
	await db.insert(PersonsToGroups).values({
		personId: userId,
		groupId: groups[3]!.groupId, // Strategic Planning Team
		groupRole: 'admin',
	});

	// Add you as a member to the Development Team
	await db.insert(PersonsToGroups).values({
		personId: userId,
		groupId: groups[0]!.groupId, // Development Team
		groupRole: 'member',
	});

	// Add some of your direct reports to your Operations Team
	await db.insert(PersonsToGroups).values({
		personId: directReportIds[0]!,
		groupId: groups[1]!.groupId, // Operations Team
		groupRole: 'member',
	});

	await db.insert(PersonsToGroups).values({
		personId: directReportIds[1]!,
		groupId: groups[1]!.groupId, // Operations Team
		groupRole: 'member',
	});

	// Add middle managers to Operations Team
	await db.insert(PersonsToGroups).values({
		personId: middleManagerIds[0]!,
		groupId: groups[1]!.groupId, // Operations Team
		groupRole: 'member',
	});

	await db.insert(PersonsToGroups).values({
		personId: middleManagerIds[1]!,
		groupId: groups[1]!.groupId, // Operations Team
		groupRole: 'member',
	});

	// Add some indirect reports to Development Team
	await db.insert(PersonsToGroups).values({
		personId: indirectReportIds[0]!,
		groupId: groups[0]!.groupId, // Development Team
		groupRole: 'member',
	});

	await db.insert(PersonsToGroups).values({
		personId: indirectReportIds[1]!,
		groupId: groups[0]!.groupId, // Development Team
		groupRole: 'member',
	});

	// Add some site colleagues to Development Team
	await db.insert(PersonsToGroups).values({
		personId: siteColleagueIds[0]!,
		groupId: groups[0]!.groupId, // Development Team
		groupRole: 'member',
	});

	// Add some unrelated persons to Security Team
	await db.insert(PersonsToGroups).values({
		personId: unrelatedIds[0]!,
		groupId: groups[2]!.groupId, // Security Team
		groupRole: 'member',
	});

	await db.insert(PersonsToGroups).values({
		personId: unrelatedIds[1]!,
		groupId: groups[2]!.groupId, // Security Team
		groupRole: 'admin',
	});

	// Add some people to Strategic Planning Team
	await db.insert(PersonsToGroups).values({
		personId: middleManagerIds[0]!,
		groupId: groups[3]!.groupId, // Strategic Planning Team
		groupRole: 'member',
	});

	await db.insert(PersonsToGroups).values({
		personId: directReportIds[2]!,
		groupId: groups[3]!.groupId, // Strategic Planning Team
		groupRole: 'member',
	});

	await db.insert(PersonsToGroups).values({
		personId: siteColleagueIds[1]!,
		groupId: groups[3]!.groupId, // Strategic Planning Team
		groupRole: 'member',
	});

	console.log('\n🎉 Simple seed completed successfully!');
	console.log('\nSummary:');
	console.log('- 4 groups created: Development Team, Operations Team, Security Team, Strategic Planning Team');
	console.log('- Your account created as admin of 3 command groups: Operations Team, Security Team, and Strategic Planning Team');
	console.log('- You are also a member of the Development Team and site manager of mbt');
	console.log('- 8 people created that belong to mbt site:');
	console.log('  • 4 direct reports under your management');
	console.log('  • 4 colleagues with different manager (Other MBT Manager)');
	console.log('- 4 people with indirect reporting (their manager reports to you):');
	console.log('  • 2 middle managers who report to you');
	console.log('  • 4 people who report to those middle managers');
	console.log('- 4 unrelated people with manager who is not you (Unrelated Manager)');
	console.log('- All persons assigned to various groups');
}

async function main() {
	const args = process.argv.slice(2);
	const command = args[0] || 'seed';

	switch (command) {
		case 'clear':
			await clearDatabase();
			break;
		case 'seed':
		default:
			await clearDatabase();
			await seedSimpleData();
			break;
	}
}

main()
	.then(() => {
		console.log('✅ Operation completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Operation failed:', error);
		process.exit(1);
	}); 