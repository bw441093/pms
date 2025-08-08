import { apiClient } from './personsClient';

export async function getEventsByEntityId(entityId: string, entityType: 'group' | 'person') {
  const response = await apiClient.get('/events', {
    params: { entityId, entityType }
  });
  return response.data;
}

export async function getEventsByGroupIds(groupIds: string[]) {
  const response = await apiClient.get('/events', {
    params: { groupIds: groupIds.join(',') }
  });
  return response.data;
}

export async function createEvent(event: any) {
  const response = await apiClient.post('/events', event);
  return response.data;
}

export async function updateEvent(eventId: string, event: any) {
  const response = await apiClient.put(`/events/${eventId}`, event);
  return response.data;
}

export async function deleteEvent(eventId: string) {
  const response = await apiClient.delete(`/events/${eventId}`);
  return response.data;
}



