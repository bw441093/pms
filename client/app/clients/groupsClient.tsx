import { apiClient } from './personsClient';
import type { GroupedPersons } from '../types';

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

export async function getPersonRoleInGroup(personId: string, groupIds: string[]) {
	const response = await apiClient.get(`/groups/person/${personId}/roles`, {
		params: {
			groupIds: groupIds.join(',')
		}
	});
	return response.data;
}


export async function getCommandChainPersons(personId: string): Promise<GroupedPersons> {
	const { data } = await apiClient.get(`/groups/person/${personId}/command-chain`);
	return data;
}

