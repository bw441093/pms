import type { Sites, SystemRoles, Locations, ServiceTypes } from './types';

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
export const SITE_OPTIONS = ['mbt', 'mfs', 'kir', 'mdt', 'other'] as const;
export const SITE_MANAGER_OPTIONS = ['mbt', 'mfs', 'mdt', 'kir'] as const; // Only these sites can have site managers
export const SYSTEM_ROLE_OPTIONS = [
	'siteManager',
	'personnelManager',
	'hrManager',
	'admin',
] as const;
export const SERVICE_TYPE_OPTIONS = ['hova', 'keva', 'miluim', 'aatz', 'ps'] as const;

export const hebrewSiteNames: Record<Sites, string> = {
	mbt: 'איילת השחר',
	mfs: 'בראשית',
	kir: 'ביה״ב',
	mdt: 'רקיע',
	other: 'אחר',
};

export const hebrewServiceTypeNames: Record<ServiceTypes, string> = {
	hova: 'חובה',
	keva: 'קבע',
	miluim: 'מילואים',
	aatz: 'אזרח עובד צה"ל',
	ps: 'יועץ',
};

export const hebrewSystemRoleNames: Record<SystemRoles, string> = {
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
