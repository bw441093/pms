import axios from 'axios';
import type { Person } from '../types';

// Create axios instance with base configuration
const apiClient = axios.create({
	baseURL: '/api',
	headers: {
		'Content-Type': 'application/json',
	},
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
	const token = localStorage.getItem('login_token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export async function getPeopleData(userId: string) {
	const { data } = await apiClient.get('/users');

	const [user, people] = (data as []).reduce(
		(acc: Person[][], person: Person) => {
			if (person.id === 'feb8bf9c-d2be-4f25-ad79-9d478af482a1') {
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

// Export the apiClient for use in other parts of the app
export { apiClient };
