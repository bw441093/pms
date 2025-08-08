import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import PersonCard from './components/PersonCard/PersonCard';
import GroupHeader from './components/GroupHeader';
import { useCommandChainData, useSiteData, useDirectReportsData } from '../../../hooks/useQueries';
import { useIsMobile } from '../../../hooks/useQueries';
import HrTopBar from './components/HrTopBar';
import { Stack } from '@mui/material';
import type { Person, GroupedPersons } from '../../../types';
import { getPerson } from '~/clients/personsClient';
import { applyFiltersAndSearchToGroupedData, applyFiltersAndSearchFlat, type FilterOptions } from '../../../utils/filterUtils';
import { checkIsPersonnelManager, getManagedSites, hasHigherRole } from '../../../utils/groupUtils';

export default function WhereYouAt() {
	const [userId, setUserId] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [filters, setFilters] = useState<FilterOptions>({
		isManager: false,
		isSiteManager: false,
		isDirectManager: false,
		hasReportStatus: false,
		noReportStatus: false,
	});
	const [sitesManaged, setSitesManaged] = useState<string[]>([]);
	

	useEffect(() => {
		const id = localStorage.getItem('login_token') || '';
		setUserId(id);
	}, []);

	const { data: groupedCommandChainData = {} as GroupedPersons, isLoading: peopleLoadingCommandChain } = useCommandChainData(userId);
	const { data: sortedPeopleSite = [], isLoading: peopleLoadingSite } = useSiteData(userId);
	const { data: sortedPeopleDirectReports = [], isLoading: peopleLoadingDirectReports } = useDirectReportsData(userId);
	
	console.log(groupedCommandChainData);

	// Get permissions from the first person in command chain (if any)
	const firstGroup = Object.values(groupedCommandChainData)[0];
	const permissions = (firstGroup?.persons?.[0]?.personSystemRoles || []).map((pr: any) => ({ name: pr.role.name, opts: pr.role.opts }));

	const handleSearch = useCallback((term: string) => {
		setSearchTerm(term);
	}, []);

	const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
		setFilters(newFilters);
	}, []);

	// Get the current user for filtering
	const { data: currentUser } = useQuery({
		queryKey: ['currentUser'],
		queryFn: async () => {
			const userId = localStorage.getItem('login_token');
			if (!userId) return null;
			const currentUser = await getPerson(userId);

			// Use group-based role checking instead of system roles
			let isManager = false;
			let isSiteManager = false;
			let isDirectManager = false;
			const newSitesManaged: string[] = [];

			// Check for higher-level system roles (these still use system roles)
			const systemRoles = currentUser.personSystemRoles?.map((pr: any) => pr.role.name) ?? [];
			const hasHigherRolePermissions = hasHigherRole(systemRoles);

			if (hasHigherRolePermissions) {
				// Higher roles have all permissions
				isManager = true;
				isSiteManager = true;
				isDirectManager = true;
			}
			// Check group-based roles
			const isPersonnelManagerByGroup = await checkIsPersonnelManager(userId);
			const managedSites = await getManagedSites(userId);

			if (isPersonnelManagerByGroup) {
				isManager = true;
				isDirectManager = true; // Personnel managers can also see direct reports
			}

			if (managedSites.length > 0) {
				isSiteManager = true;
				newSitesManaged.push(...managedSites);
			}
			

			// Update filters and sites
			setFilters(prev => ({
				...prev,
				isManager,
				isSiteManager,
				isDirectManager
			}));
			setSitesManaged(newSitesManaged);

			return currentUser;
		},
	});

	// Determine if we should show grouped view (only when isManager filter is active and others are not)
	const shouldShowGrouped = filters.isManager && !filters.isSiteManager && !filters.isDirectManager && !filters.hasReportStatus && !filters.noReportStatus;

	// Get grouped data for when showing grouped view
	const groupedPeopleToShow = useMemo(() => {
		if (!shouldShowGrouped) return {};
		return applyFiltersAndSearchToGroupedData(
			groupedCommandChainData,
			sortedPeopleSite,
			sortedPeopleDirectReports,
			searchTerm,
			currentUser || null,
			sitesManaged,
			filters
		);
	}, [shouldShowGrouped, groupedCommandChainData, sortedPeopleSite, sortedPeopleDirectReports, searchTerm, currentUser, filters, sitesManaged]);

	// Get flat list for when showing flat view
	const flatPeopleToShow = useMemo(() => {
		if (shouldShowGrouped) return [];
		
		return applyFiltersAndSearchFlat(
			groupedCommandChainData,
			sortedPeopleSite,
			sortedPeopleDirectReports,
			searchTerm,
			currentUser || null,
			sitesManaged,
			filters
		);
	}, [shouldShowGrouped, groupedCommandChainData, sortedPeopleSite, sortedPeopleDirectReports, searchTerm, currentUser, filters, sitesManaged]);

	// Collapse state for each group
	const [collapsedGroups, setCollapsedGroups] = useState<{ [groupId: string]: boolean }>({});

	const handleToggleGroupCollapse = useCallback((groupId: string) => {
		setCollapsedGroups(prev => ({
			...prev,
			[groupId]: !prev[groupId],
		}));
	}, []);

	// This component is only for mobile - desktop users are redirected globally
	return (
		<Stack
			direction="column"
			alignItems="center"
			spacing={0}
			sx={{
				pb: '80px', // Add padding at the bottom to account for the fixed nav bar
			}}
		>
			<HrTopBar
				onSearch={handleSearch}
				onFiltersChange={handleFiltersChange}
				initialFilters={filters}
			/>
			<Stack spacing={0} sx={{ width: '100%', alignItems: 'center' }}>
				{shouldShowGrouped ? (
					// Grouped view with sticky headers
					Object.entries(groupedPeopleToShow).map(([groupId, { group, persons }]) => (
						<Stack key={groupId} spacing={0} justifyContent="center" alignItems="center" sx={{ width: '100%' }}>
							<GroupHeader 
								group={group} 
								collapsed={!!collapsedGroups[groupId]} 
								onToggleCollapse={() => handleToggleGroupCollapse(groupId)} 
								representativePerson={persons[0]}
							/>
							{!collapsedGroups[groupId] && (
								<Stack spacing={1.5} sx={{ width: '95%', alignItems: 'center', py: 1 }}>
									{persons.map((person: Person) => (
										<PersonCard
											key={person.id}
											person={person}
											permissions={permissions}
										/>
									))}
								</Stack>
							)}
						</Stack>
					))
				) : (
					// Flat view without group headers
					<Stack spacing={1.5} sx={{ width: '95%', alignItems: 'center', py: 1 }}>
						{flatPeopleToShow.map((person: Person) => (
							<PersonCard
								key={person.id}
								person={person}
								permissions={permissions}
							/>
						))}
					</Stack>
				)}
			</Stack>
		</Stack>
	);
}
