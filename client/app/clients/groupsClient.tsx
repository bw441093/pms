import { apiClient } from './personsClient';

export async function getGroupsByPersonId(personId: string) {
	const response = await apiClient.get(`/groups/person/${personId}`);
	return response.data;
}

export async function getGroupById(groupId: string) {
	const response = await apiClient.get(`/groups/${groupId}`);
	return response.data;
}

export async function getPersonsByGroupId(groupId: string) {
	const response = await apiClient.get(`/groups/${groupId}/persons`);
	return response.data;
}


