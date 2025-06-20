import type { Sites, Roles, Locations } from './types';

// List of admin user IDs
export const ADMINS = ['admin1', 'admin2'];

// List of people
export const PEOPLE = ['person1', 'person2', 'person3', 'person4'];

// Managers and their people
export const MANAGERS = [
	{
		id: 'manager1',
		people: ['person1', 'person2'],
	},
	{
		id: 'manager2',
		people: ['person3', 'person4'],
	},
];

export const LOCATION_STATUSES = [
	'At Home',
	'At Work',
	'On Vacation',
	'In Transit',
	'late',
	'on_leave',
	'absent',
	'present',
	'on shift',
] as const;
export const SITE_OPTIONS = ['mbt', 'mfs', 'kir', 'other'] as const;
export const SITE_MANAGER_OPTIONS = ['mbt', 'mfs', 'kir'] as const; // Only these sites can have site managers
export const ROLE_OPTIONS = [
	'siteManager',
	'personnelManager',
	'hrManager',
	'admin',
] as const;

export const hebrewSiteNames: Record<Sites, string> = {
	mbt: 'איילת השחר',
	mfs: 'בראשית',
	kir: 'ביה״ב',
	other: 'אחר',
};

export const hebrewRoleNames: Record<Roles, string> = {
	siteManager: 'מנהל אתר',
	personnelManager: 'מנהל כוח אדם',
	hrManager: 'מנהל משאבי אנוש',
	admin: 'מנהל מערכת',
};

export const hebrewLocationNames: Record<Locations, string> = {
	'At Home': 'בבית',
	'At Work': 'בעבודה',
	'On Vacation': 'בחופשה',
	'In Transit': 'במעבר',
	late: 'מאחר',
	on_leave: 'עוזב',
	absent: 'נעדר',
	present: 'נוכח',
	'on shift': 'במשמרת',
};
