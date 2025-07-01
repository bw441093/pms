import { group } from 'console';
import { db } from './db';
import {
	UsersTable,
	PersonsTable,
	SystemRolesTable,
	PersonsToSystemRoles,
	TransactionsTable,
	GroupsTable,
	PersonsToGroups,
	EventsTable,
} from './schema';
import { eq, or, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
// Enhanced sample data with more variety
const SAMPLE_NAMES = [
	// Management team
	'Alexander Thompson',
	'Maria Rodriguez',
	'David Chen',
	'Sarah Williams',
	'James Johnson',
	// Development team
	'Emily Davis',
	'Michael Brown',
	'Lisa Anderson',
	'Robert Garcia',
	'Jennifer Martinez',
	'Christopher Lee',
	'Jessica White',
	'Daniel Wilson',
	'Ashley Clark',
	'Matthew Lewis',
	// Support team
	'Nicole Hall',
	'Andrew Allen',
	'Stephanie Young',
	'Joshua King',
	'Rebecca Wright',
	// Operations team
	'Kevin Scott',
	'Laura Green',
	'Brian Baker',
	'Michelle Adams',
	'Steven Nelson',
	'Kimberly Carter',
	'Timothy Mitchell',
	'Angela Perez',
	'Jeffrey Roberts',
	'Melissa Turner',
];

const SAMPLE_SITES = ['mbt', 'mfs', 'kir', 'mdt', 'other'];

const SAMPLE_ROLES = [
	{ name: 'siteManager', opts: ['mbt'] },
	{ name: 'siteManager', opts: ['kir'] },
	{ name: 'personnelManager' },
	{ name: 'hrManager' },
];

const SAMPLE_LOCATIONS = [
	'jerusalem',
	'tel_aviv',
	'haifa',
	'petach_tikva',
	'eilat',
];

const SAMPLE_ORIGINS = [...SAMPLE_SITES];

const SAMPLE_TARGETS = [...SAMPLE_SITES];

// Helper functions
function getRandomElement<T>(array: T[]): T {
	const randomIndex = Math.floor(Math.random() * array.length);
	return array[randomIndex]!;
}

function getRandomElements<T>(array: T[], count: number): T[] {
	const shuffled = [...array].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count);
}

function getRandomDate(start: Date, end: Date): Date {
	return new Date(
		start.getTime() + Math.random() * (end.getTime() - start.getTime())
	);
}

function getRandomDateInRange(daysAgo: number): Date {
	const now = new Date();
	const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
	return getRandomDate(past, now);
}

// Test data generation functions
export async function generateUsers(count: number = 30) {
	console.log(`👤 Generating ${count} users...`);
	const users = [];

	for (let i = 0; i < count; i++) {
		const userId = uuidv4();
		const name = SAMPLE_NAMES[i % SAMPLE_NAMES.length];
		const username = name?.toLowerCase().replace(/\s+/g, '.');

		const user = {
			id: userId,
			email: `${username}@example.com`,
			createdAt: getRandomDateInRange(365), // Random date within last year
		};

		await db.insert(UsersTable).values(user);
		users.push(user);
	}

	return users;
}

export async function generateSystemRoles() {
	console.log('👥 Generating roles...');
	const roles = [];

	for (const roleData of SAMPLE_ROLES) {
		const roleId = uuidv4();
		const role = {
			id: roleId,
			name: roleData.name,
			opts: roleData.opts,
		};

		await db.insert(SystemRolesTable).values(role);
		roles.push(role);
	}

	return roles;
}

export async function generatePersons(users: any[], roles: any[]) {
	console.log('👤 Generating persons...');
	const persons = [];
	const managers = [];

	for (let i = 0; i < users.length; i++) {
		const user = users[i];
		const name = SAMPLE_NAMES[i % SAMPLE_NAMES.length];

		const person = {
			id: user.id,
			name,
			site: getRandomElement(SAMPLE_SITES),
			manager: null as string | null,
			alertStatus: getRandomElement(['pending', 'good', 'bad'] as const),
			reportStatus: getRandomElement(['present', 'absent', 'late', 'on_leave']),
			serviceType: getRandomElement(['hova', 'keva', 'miluim', 'aatz', 'ps'] as const),
			location: getRandomElement(SAMPLE_LOCATIONS),
			updatedAt: getRandomDateInRange(30), // Random date within last 30 days
		};

		await db.insert(PersonsTable).values(person as any);
		persons.push(person);

		// Assign first 5 as managers
		if (i < 5) {
			managers.push(user.id);
		}
	}

	// Assign managers to persons
	console.log('👨‍💼 Assigning managers...');
	for (let i = 5; i < persons.length; i++) {
		const managerId = getRandomElement(managers);
		await db
			.update(PersonsTable)
			.set({ manager: managerId })
			.where(eq(PersonsTable.id, persons[i]?.id));
	}

	// Assign roles to persons
	console.log('🎭 Assigning roles...');
	for (const person of persons) {
		const roleCount = Math.floor(Math.random() * 3) + 1; // 1-3 roles per person
		const personRoles = getRandomElements(roles, roleCount);

		for (const role of personRoles) {
			await db.insert(PersonsToSystemRoles).values({
				userId: person.id,
				roleId: role.id,
			});
		}
	}

	return persons;
}

export async function generateGroups(persons: any[]) {
	console.log('👥 Generating groups...');
	const groups = [];

	for (const person of persons) {
		const groupId = uuidv4();
		const group = {
			groupId: groupId,
			name: `Group ${groupId}`,
			command: Math.random() > 0.5,
			description: `Group for ${person.name}`,
			createdAt: getRandomDateInRange(30),
			updatedAt: getRandomDateInRange(30),
		};
		await db.insert(GroupsTable).values(group);
		groups.push(group);
	}

	// Assign groups to persons
	console.log('👥 Assigning groups to persons...');
	// Create a Set to track unique person-group combinations
	const assignedCombinations = new Set<string>();

	for (const person of persons) {
		try {
			let groupId: string;
			let combination: string;

		// Keep trying until we find a unique combination
		do {
			groupId = getRandomElement(groups).groupId;
			combination = `${person.id}-${groupId}`;
		} while (assignedCombinations.has(combination));

		assignedCombinations.add(combination);

		await db.insert(PersonsToGroups).values({
			personId: person.id,
			groupId: groupId,
			groupRole: getRandomElement(['admin', 'member'] as const),
			});
		} catch (error) {
			console.error('❌ Error generating groups:', error);
		}
	}

	return groups;
}

export async function generateEvents(persons: any[], groups: any[]) {
	console.log('🎭 Generating events...');
	const events = [];

	for (const person of persons) {
		const eventId = uuidv4();
		const entityType = getRandomElement(['group', 'person'] as const);
		let entityId: string;

		if (entityType === 'group') {
			entityId = getRandomElement(groups).groupId;
		} else {
			entityId = getRandomElement(persons).id;
		}

		const startTime = getRandomDateInRange(30);
		const endTime = new Date(startTime);
		endTime.setDate(endTime.getDate() + Math.floor(Math.random() * 7) + 1);

		const event = {
			eventId: eventId,
			entityId: entityId,
			entityType: entityType,
			startTime: startTime,
			endTime: endTime,
			title: `Event ${eventId}`,
			description: `Description for event ${eventId}`,
			location: getRandomElement(SAMPLE_LOCATIONS),
			mandatory: Math.random() > 0.5,
			insider: Math.random() > 0.5,
			createdAt: getRandomDateInRange(30),
			updatedAt: getRandomDateInRange(30)
		}
		await db.insert(EventsTable).values(event);
		events.push(event);
	}
}


export async function generateTransactions(persons: any[], count: number = 50) {
	console.log(`📋 Generating up to ${count} transactions (one per user due to unique constraint)...`);

	// If count is less than number of persons, pick random persons
	let selectedPersons: any[];
	if (count < persons.length) {
		selectedPersons = getRandomElements(persons, count);
	} else {
		selectedPersons = persons;
	}

	for (const person of selectedPersons) {
		const origin = getRandomElement(SAMPLE_ORIGINS);
		const target = getRandomElement(SAMPLE_TARGETS);

		await db.insert(TransactionsTable).values({
			id: uuidv4(),
			origin,
			target,
			originConfirmation: Math.random() > 0.3,
			targetConfirmation: Math.random() > 0.3,
			field: getRandomElement(['site', 'manager'] as const),
			createdAt: getRandomDateInRange(90), // Random date within last 90 days
			status: getRandomElement(['pending', 'resolved'] as const),
			userId: person.id,
		});
	}
}

export async function generateSpecificScenarios() {
	console.log('🎭 Generating specific scenarios...');

	// Get all persons
	const persons = await db.select().from(PersonsTable);

	// Scenario 1: High alert situation
	const highAlertPersons = getRandomElements(persons, 3);
	for (const person of highAlertPersons) {
		await db
			.update(PersonsTable)
			.set({
				alertStatus: 'bad',
				location: 'office',
				updatedAt: new Date(),
			})
			.where(eq(PersonsTable.id, person.id));
	}

	// Scenario 2: Multiple pending transactions
	const pendingPersons = getRandomElements(persons, 5);
	for (const person of pendingPersons) {
		// Check if a transaction already exists for this user
		const existing = await db.select().from(TransactionsTable).where(eq(TransactionsTable.userId, person.id));
		if (existing.length === 0) {
			await db.insert(TransactionsTable).values({
				id: uuidv4(),
				origin: 'mbt',
				target: 'kir',
				originConfirmation: false,
				targetConfirmation: false,
				field: 'site',
				createdAt: new Date(),
				status: 'pending',
				userId: person.id,
			});
		}
	}

	// Scenario 3: Persons on leave
	const onLeavePersons = getRandomElements(persons, 2);
	for (const person of onLeavePersons) {
		await db
			.update(PersonsTable)
			.set({
				reportStatus: 'on_leave',
				location: 'home',
				updatedAt: new Date(),
			})
			.where(eq(PersonsTable.id, person.id));
	}
}

export async function clearDatabase() {
	console.log('🧹 Clearing existing data...');
	await db.delete(TransactionsTable);
	await db.delete(PersonsToSystemRoles);
	await db.delete(SystemRolesTable);
	await db.delete(PersonsTable);
	await db.delete(UsersTable);
}

export async function generateCompleteTestData(
	options: {
		userCount?: number;
		transactionCount?: number;
		includeScenarios?: boolean;
	} = {}
) {
	const {
		userCount = 30,
		transactionCount = 50,
		includeScenarios = true,
	} = options;

	console.log('🌱 Starting comprehensive test data generation...');

	try {
		// Clear existing data
		await clearDatabase();

		// Generate data
		const users = await generateUsers(userCount);
		const systemRoles = await generateSystemRoles();
		const persons = await generatePersons(users, systemRoles);
		const groups = await generateGroups(persons);
		await generateEvents(persons, groups);
		await generateTransactions(persons, transactionCount);

		if (includeScenarios) {
			await generateSpecificScenarios();
		}

		console.log('✅ Test data generation completed successfully!');
		console.log(`📊 Created:`);
		console.log(`   - ${users.length} users`);
		console.log(`   - ${systemRoles.length} system roles`);
		console.log(`   - ${persons.length} persons`);
		console.log(`   - ${transactionCount} transactions`);
		console.log(`   - Multiple role assignments`);
		if (includeScenarios) {
			console.log(`   - Specific test scenarios`);
		}

		return { users, systemRoles, persons };
	} catch (error) {
		console.error('❌ Error generating test data:', error);
		throw error;
	}
}

// Utility functions for querying test data
export async function getPersonsByRole(roleName: string) {
	return await db
		.select({
			person: PersonsTable,
			role: SystemRolesTable,
		})
		.from(PersonsTable)
		.innerJoin(PersonsToSystemRoles, eq(PersonsTable.id, PersonsToSystemRoles.userId))
		.innerJoin(SystemRolesTable, eq(PersonsToSystemRoles.roleId, SystemRolesTable.id))
		.where(eq(SystemRolesTable.name, roleName));
}

export async function getPersonsByManager(managerId: string) {
	return await db
		.select()
		.from(PersonsTable)
		.where(eq(PersonsTable.manager, managerId));
}

export async function getPendingTransactions() {
	return await db
		.select()
		.from(TransactionsTable)
		.where(eq(TransactionsTable.status, 'pending'))
		.orderBy(desc(TransactionsTable.createdAt));
}

export async function getPersonsWithAlerts() {
	return await db
		.select()
		.from(PersonsTable)
		.where(
			or(
				eq(PersonsTable.alertStatus, 'bad'),
				eq(PersonsTable.alertStatus, 'pending')
			)
		);
}
