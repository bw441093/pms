import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
	getPeopleData,
	updateAlertStatus,
	updatMoveStatus,
	postMoveStatus,
	updateReportStatus,
	updatePersonDetails,
	addNewPerson,
} from '../clients/personsClient';

export function usePeopleData(userId: string) {
	return useQuery({
		queryKey: ['people', userId],
		queryFn: () => getPeopleData(userId),
		refetchInterval: 10000,
	});
}


export function useAddNewPerson() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			name,
			manager,
			site,
			email,
			roles,
		}: {
			name: string;
			manager: string;
			site: string;
			email: string;
			roles: { name: string; opts: string[]  }[];
		}) => addNewPerson(name, manager, site, email, roles),
		onSuccess: () => {
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
			roles,
		}: {
			userId: string;
			name?: string;
			manager?: string;
			site?: string;
			email?: string;
			roles?: { name: string; opts: string[] }[];
		}) => updatePersonDetails(userId, { name, manager, site, email, roles }),
		onSuccess: () => {
			// Invalidate people queries to refresh data after status update
			queryClient.invalidateQueries({ queryKey: ['people'] });
		},
	});
}
