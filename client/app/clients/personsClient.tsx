import axios from 'axios';
import type { Person } from '../types';

// Create axios instance with base configuration
const apiClient = axios.create({
	baseURL: '/api',
});

export async function getPeopleData(userId: string) {
	const { data } = await apiClient.get('/users');

	const [user, people] = (data as []).reduce(
		(acc: Person[][], person: Person) => {
			if (person.id === userId) {
				acc[0].push(person);
				return acc;
			}
			acc[1].push(person);
			return acc;
		},
		[[], []]
	);

	return { user: user[0], people };
}

export async function getPerson(userId: string) {
	const { data }: { data: Person } = await apiClient.get(`/users/${userId}`);

	return data;
}

export async function updateAlertStatus(userId: string, status: string) {
	const response = await apiClient.post(`/users/${userId}/alert`, {
		status,
	});

	return response.data;
}

export async function updatMoveStatus(
	userId: string,
	originator: string,
	status: boolean
) {
	const response = await apiClient.patch(`/users/${userId}/move`, {
		status,
		originator,
	});

	return response.data;
}

export async function postMoveStatus(
	userId: string,
	origin: string,
	target: string
) {
	const response = await apiClient.post(`/users/${userId}/move`, {
		origin,
		target,
		field: 'site',
	});

	return response.data;
}

export async function updateReportStatus(
	userId: string,
	status: string,
	location: string
) {
	const response = await apiClient.put(`/users/${userId}/status`, {
		status,
		location,
	});

	return response.data;
}

export async function updatePersonDetails(
	userId: string,
	details: {
		name?: string;
		manager?: string;
		site?: string;
		email?: string;
		systemRoles?: { name: string; opts: string[] }[];
		serviceType?: string;
	}
) {
	const response = await apiClient.put(`/users/${userId}/details`, details);
	return response.data;
}

export async function addNewPerson(
		name: string,
		manager: string,
		site: string,
		email: string,
		systemRoles: { name: string; opts: string[] }[],
		serviceType: string
	) {
	const response = await apiClient.post('/users', {
		name,
		manager,
		site,
		email,
		systemRoles,
		serviceType,
	});
	return response.data;
}

export async function getSitePersons(userId: string) {
	const { data } = await apiClient.get(`/users/site/${userId}`);
	return data;
}

// Export the apiClient for use in other parts of the app
export { apiClient };
