import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	updatePersonSite,
	getUserSite,
	updateUserSite,
	addNewPerson,
	deletePerson,
} from '../mockApi';
import { getPeopleData } from '../clients/personsClient';

export function usePeopleData(userId: string) {
	return useQuery({
		queryKey: ['people', userId],
		queryFn: () => getPeopleData(userId),
	});
}

export function useUserSite(userId: string) {
	return useQuery({
		queryKey: ['userSite', userId],
		queryFn: () => getUserSite(userId),
	});
}

export function useUpdatePersonSite() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			personId,
			currentSite,
		}: {
			personId: string;
			currentSite: string;
		}) => updatePersonSite(personId, currentSite),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['people'] });
		},
	});
}

export function useUpdateUserSite() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			userId,
			currentSite,
		}: {
			userId: string;
			currentSite: string;
		}) => updateUserSite(userId, currentSite),
		onSuccess: (_, { userId }) => {
			queryClient.invalidateQueries({ queryKey: ['userSite', userId] });
		},
	});
}

export function useAddNewPerson() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			managerId,
			personId,
		}: {
			managerId: string;
			personId: string;
		}) => addNewPerson(managerId, personId),
		onSuccess: (_, { managerId }) => {
			queryClient.invalidateQueries({ queryKey: ['people'] });
			queryClient.invalidateQueries({ queryKey: ['people', managerId] });
		},
	});
}

export function useDeletePerson() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (personId: string) => deletePerson(personId),
		onSuccess: () => {
			// Invalidate all people queries to ensure fresh data
			queryClient.invalidateQueries({ queryKey: ['people'] });
		},
	});
}
