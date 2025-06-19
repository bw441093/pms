export type Person = {
	id: string;
	name: string;
	site: string;
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
		origin: string;
		target: string;
		originConfirmation: boolean;
		targetConfirmation: boolean;
		field: string;
		createdAt: string;
		status: string;
	};
	personRoles?: {
		role: {
			id: string;
			name: string;
			opts: any;
		};
	}[];
};
