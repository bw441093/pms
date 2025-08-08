import type { SITE_OPTIONS, SYSTEM_ROLE_OPTIONS, LOCATION_STATUSES, SERVICE_TYPE_OPTIONS } from "./consts";

export type SystemRoles = typeof SYSTEM_ROLE_OPTIONS[number];

export type Sites = typeof SITE_OPTIONS[number];

export type ServiceTypes = typeof SERVICE_TYPE_OPTIONS[number];

export type Locations = typeof LOCATION_STATUSES[number];

export type Person = {
	id: string;
	name: string;
	email?: string;
	site: Sites; // Permanent/base site where person is stationed
	currentSite?: Sites; // Current/reported site based on site group membership
	serviceType: ServiceTypes;
	manager?: {
		id: string;
		name: string;
	} | null;
	alertStatus: string;
	reportStatus: string;
	location: string;
	updatedAt: string;
	approvedBy: string | null;
	transaction?: {
		id: string;
		origin: Sites;
		target: Sites;
		originConfirmation: boolean;
		targetConfirmation: boolean;
		field: string;
		createdAt: string;
		status: string;
	};
	personSystemRoles?: {
		role: {
			id: string;
			name: SystemRoles;
			opts: any;
		};
	}[];
};

export type Group = {
	groupId: string;
	name: string;
	command: boolean;
	site: boolean;
	isLeafGroup?: boolean;
};

export type GroupedPersons = {
	[groupId: string]: {
		group: Group;
		persons: Person[];
	};
};

export type GroupedPersonItem = {
	group: Group;
	person: Person;
};
