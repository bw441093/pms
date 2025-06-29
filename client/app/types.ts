import type { SITE_OPTIONS, ROLE_OPTIONS, LOCATION_STATUSES, SERVICE_TYPE_OPTIONS } from "./consts";

export type Roles = typeof ROLE_OPTIONS[number];

export type Sites = typeof SITE_OPTIONS[number];

export type ServiceTypes = typeof SERVICE_TYPE_OPTIONS[number];

export type Locations = typeof LOCATION_STATUSES[number];

export type Person = {
	id: string;
	name: string;
	site: Sites;
	serviceType: ServiceTypes;
	manager: {
		id: string;
		name: string;
	};
	alertStatus: string;
	reportStatus: string;
	location: string;
	updatedAt: string;
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
	personRoles?: {
		role: {
			id: string;
			name: Roles;
			opts: any;
		};
	}[];
};
