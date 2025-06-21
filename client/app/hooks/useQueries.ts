import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	updatePersonSite,
	getUserSite,
	updateUserSite,
	addNewPerson,
	deletePerson,
} from '../mockApi';
import {
	getPeopleData,
	updateAlertStatus,
	updatMoveStatus,
	postMoveStatus,
	updateReportStatus,
	updatePersonDetails,
	updatePersonRoles,
} from '../clients/personsClient';

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

// New mutation hooks for backend API calls
export function useUpdateAlertStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, status }: { userId: string; status: string }) =>
			updateAlertStatus(userId, status),
		onSuccess: () => {
			// Invalidate people queries to refresh data after alert status change
			queryClient.invalidateQueries({ queryKey: ['people'] });
		},
	});
}

export function useUpdateMoveStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			userId,
			originator,
			status,
		}: {
			userId: string;
			originator: string;
			status: boolean;
		}) => updatMoveStatus(userId, originator, status),
		onSuccess: () => {
			// Invalidate people queries to refresh data after move status change
			queryClient.invalidateQueries({ queryKey: ['people'] });
		},
	});
}

export function usePostMoveStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			userId,
			origin,
			target,
		}: {
			userId: string;
			origin: string;
			target: string;
		}) => postMoveStatus(userId, origin, target),
		onSuccess: () => {
			// Invalidate people queries to refresh data after move
			queryClient.invalidateQueries({ queryKey: ['people'] });
		},
	});
}

export function useUpdateReportStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			userId,
			status,
			location,
		}: {
			userId: string;
			status: string;
			location: string;
		}) => updateReportStatus(userId, status, location),
		onSuccess: () => {
			// Invalidate people queries to refresh data after status update
			queryClient.invalidateQueries({ queryKey: ['people'] });
		},
	});
}

export function useUpdatePersonDetails() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			userId,
			name,
			manager,
			site,
			email,
		}: {
			userId: string;
			name?: string;
			manager?: string;
			site?: string;
			email?: string;
		}) => updatePersonDetails(userId, { name, manager, site, email }),
		onSuccess: () => {
			// Invalidate people queries to refresh data after status update
			queryClient.invalidateQueries({ queryKey: ['people'] });
		},
	});
}

export function useUpdatePersonRoles() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			userId,
			roles,
		}: {
			userId: string;
			roles: { name: string; opts: string[] }[];
		}) => updatePersonRoles(userId, roles),
		onSuccess: () => {
			// Invalidate people queries to refresh data after status update
			queryClient.invalidateQueries({ queryKey: ['people'] });
		},
	});
}

