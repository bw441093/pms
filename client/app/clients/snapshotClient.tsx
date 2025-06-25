import { apiClient } from './personsClient';

export async function getSnapshotDates() {
	const response = await apiClient.get('/snapshot/dates');
	return response.data;
}

export async function getSnapshotByDate(date: string) {
	const response = await apiClient.get(`/snapshot/${date}`);
	response.data = response.data.map((person: any) => ({
		...person,
		updatedAt: new Date(person.updated_at.replace(' ', 'T')).toISOString()
	}));
	return response.data;
}





