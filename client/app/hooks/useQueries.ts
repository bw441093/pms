import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMediaQuery, useTheme } from '@mui/material';

import {
	getPeopleData,
	updateAlertStatus,
	updatMoveStatus,
	postMoveStatus,
	updateReportStatus,
	updatePersonDetails,
	addNewPerson,
	getPerson,
	getSitePersons,
	getDirectReports,
} from '../clients/personsClient';
import { getCommandChainPersons } from '../clients/groupsClient';
import type { GroupedPersons } from '../types';

export function useCommandChainData(userId: string) {
	return useQuery<GroupedPersons>({
		queryKey: ['commandChain', userId],
		queryFn: () => getCommandChainPersons(userId),
		refetchInterval: 10000,
		enabled: !!userId,
	});
}

export function useSiteData(userId: string) {
	return useQuery({
		queryKey: ['site', userId],
		queryFn: () => getSitePersons(userId),
		refetchInterval: 2000,
		enabled: !!userId,
	});
}

export function useDirectReportsData(userId: string) {
	return useQuery({
		queryKey: ['directReports', userId],
		queryFn: () => getDirectReports(userId),
		refetchInterval: 2000,
		enabled: !!userId,
	});
}

export function usePeopleData(userId: string) {
	return useQuery({
		queryKey: ['people', userId],
		queryFn: () => getPeopleData(userId),
		refetchInterval: 10000,
		enabled: !!userId,
	});
}

export function useAddNewPerson() {
	const queryClient = useQueryClient();
	
	return useMutation({
		mutationFn: ({
			name,
			site,
			email,
			systemRoles,
			serviceType,
			selectedGroupId,
			newGroupName,
			commander,
		}: {
			name: string;
			site: string;
			email: string;
			systemRoles: { name: string; opts: string[] }[];
			serviceType: string;
			selectedGroupId?: string;
			newGroupName?: string;
			commander?: string;
		}) => addNewPerson(name, site, email, systemRoles, serviceType, selectedGroupId, newGroupName, commander),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['peopleData'] });
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
			site,
			email,
			systemRoles,
			serviceType,
			newSiteManagerSites,
			selectedGroupId,
			newGroupName,
			replacementAdmins,	
		}: {
			userId: string;
			name?: string;
			site?: string;
			email?: string;
			systemRoles?: { name: string; opts: string[] }[];
			serviceType?: string;
			newSiteManagerSites?: string[];
			selectedGroupId?: string;
			newGroupName?: string;
			replacementAdmins?: Record<string, string>;
		}) => updatePersonDetails(userId, { name, site, email, systemRoles, serviceType, newSiteManagerSites, selectedGroupId, newGroupName, replacementAdmins }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['peopleData'] });
		},
	});
}

export function useUserData(userId: string) {
	return useQuery({
		queryKey: ['user', userId],
		queryFn: () => getPerson(userId),
		enabled: !!userId,
	});
}

export function useUserDataWithManager(userId: string) {
	return useQuery({
		queryKey: ['userWithManager', userId],
		queryFn: async () => {
			const user = await getPerson(userId);
			if (user?.manager?.id) {
				const manager = await getPerson(user.manager.id);
				return { ...user, manager: { ...user.manager, name: manager?.name || '' } };
			}
			return user;
		},
		enabled: !!userId,
	});
}

// Add mobile detection hook
export const useIsMobile = () => {
	const theme = useTheme();
	return useMediaQuery(theme.breakpoints.down('md'));
};
