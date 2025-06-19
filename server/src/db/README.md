# Test Data Generation for PMS

This directory contains tools for generating comprehensive test data for the Person Management System (PMS).

## Files

- `seed.ts` - Basic seed script for simple data generation
- `testDataGenerator.ts` - Advanced test data generator with utility functions
- `generateTestData.ts` - CLI tool for generating test data with options

## Quick Start

### Generate Default Test Data

```bash
npm run seed:generate
```

This will create:

- 30 users with realistic names
- 25 different roles (CEO, CTO, Manager, Developer, etc.)
- 30 persons with assigned managers and roles
- 50 transactions with various statuses
- Specific test scenarios (high alerts, pending transactions, persons on leave)

### Generate Custom Test Data

```bash
# Generate 50 users, 100 transactions
npm run seed:generate 50 100

# Generate 20 users, 30 transactions, no scenarios
npm run seed:generate 20 30 false
```

### Clear Database

```bash
npm run seed:clear
```

### Show Help

```bash
npm run seed:help
```

## Test Data Details

### Users

- Realistic names from a diverse pool
- Usernames generated from names (e.g., "John Smith" → "john.smith")
- Passwords: "password123" (hashed with bcrypt)
- Random 2FA secrets
- Creation dates spread over the last year

### Roles

- 25 different roles including:
  - Executive roles (CEO, CTO)
  - Management roles (Manager, Senior Manager, Supervisor)
  - Technical roles (Developer, Designer, Analyst, QA)
  - Support roles (IT Support, DevOps)
  - Project roles (Product Manager, Scrum Master)
- Each role has specific permissions/options

### Persons

- Linked to users (1:1 relationship)
- Assigned to various sites (Headquarters, Branch Offices, etc.)
- Random alert statuses (good, bad, pending)
- Random report statuses (present, absent, late, on_leave)
- Current locations (office, home, meeting_room, etc.)
- Manager assignments (first 5 users become managers)

### Transactions

- Movement records between different sites
- Origin and target confirmations
- Field types (site, manager)
- Status (pending, resolved)
- Creation dates spread over the last 90 days

### Test Scenarios

The generator creates specific scenarios to test edge cases:

1. **High Alert Situation**: 3 persons with 'bad' alert status
2. **Pending Transactions**: 5 persons with pending site transfers
3. **Persons on Leave**: 2 persons marked as 'on_leave'

## Utility Functions

The `testDataGenerator.ts` file includes utility functions for querying test data:

```typescript
import {
	getPersonsByRole,
	getPersonsByManager,
	getPendingTransactions,
	getPersonsWithAlerts,
} from './testDataGenerator';

// Get all developers
const developers = await getPersonsByRole('Developer');

// Get all persons managed by a specific manager
const teamMembers = await getPersonsByManager(managerId);

// Get all pending transactions
const pending = await getPendingTransactions();

// Get persons with bad or pending alerts
const alerts = await getPersonsWithAlerts();
```

## Database Schema

The test data follows the database schema defined in `schema.ts`:

- **UsersTable**: User accounts with authentication
- **PersonsTable**: Person profiles with location and status
- **RolesTable**: Available roles with permissions
- **PersonsToRoles**: Many-to-many relationship between persons and roles
- **TransactionsTable**: Movement and transfer records

## Customization

You can customize the test data by modifying the arrays in `testDataGenerator.ts`:

- `SAMPLE_NAMES`: Add more names
- `SAMPLE_SITES`: Add more locations
- `SAMPLE_ROLES`: Add more roles with permissions
- `SAMPLE_LOCATIONS`: Add more current locations

## Troubleshooting

### Database Connection Issues

Make sure your PostgreSQL database is running and accessible with the connection string in `db.ts`.

### Permission Issues

Ensure your database user has permissions to create, read, update, and delete records.

### Memory Issues

For large datasets, consider generating data in smaller batches by using the custom options.

## Examples

### Generate Minimal Test Data

```bash
npm run seed:generate 10 20 false
```

### Generate Large Dataset

```bash
npm run seed:generate 100 200
```

### Clear and Regenerate

```bash
npm run seed:clear && npm run seed:generate
```

This will give you a comprehensive test environment for developing and testing your PMS application!
