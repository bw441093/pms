import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { usePeopleData, useCommandChainData, useSiteData, useDirectReportsData } from '../../hooks/useQueries';
import DesktopDashboard from './DesktopDashboard';
import type { Person } from '../../types';
import { getPerson } from '~/clients/personsClient';
import { applyFiltersAndSearch, type FilterOptions } from '../../utils/filterUtils';

export default function DashboardPage() {
	const navigate = useNavigate();
	const [userId, setUserId] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [filters, setFilters] = useState<FilterOptions>({
		isManager: false,
		isSiteManager: false,
		isDirectManager: false,
	});
	const [sitesManaged, setSitesManaged] = useState<string[]>([]);
	
	useEffect(() => {
		const id = localStorage.getItem('login_token') || '';
		setUserId(id);
	}, []);

	const { data: sortedPeople, isLoading: peopleLoading } = usePeopleData(userId);
	const { data: groupedCommandChainData = {}, isLoading: commandChainLoading } = useCommandChainData(userId);
	const { data: sortedPeopleSite = [], isLoading: siteLoading } = useSiteData(userId);
	const { data: sortedPeopleDirectReports = [], isLoading: directReportsLoading } = useDirectReportsData(userId);

	// Extract flat array from grouped command chain data
	const commandChainPeople = useMemo(() => {
		const people: Person[] = [];
		Object.values(groupedCommandChainData).forEach(({ persons }) => {
			people.push(...persons);
		});
		return people;
	}, [groupedCommandChainData]);

	const permissions = sortedPeople?.user?.personSystemRoles?.map((pr) => ({ name: pr.role.name, opts: pr.role.opts }));

	// Fuzzy search function
	const fuzzyMatch = (text: string, pattern: string) => {
		pattern = pattern.toLowerCase();
		text = text.toLowerCase();
		let patternIdx = 0;
		let textIdx = 0;

		while (patternIdx < pattern.length && textIdx < text.length) {
			if (pattern[patternIdx] === text[textIdx]) {
				patternIdx++;
			}
			textIdx++;
		}

		return patternIdx === pattern.length;
	};

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

			if (currentUser.personSystemRoles) {
				let isManager = false;
				let isSiteManager = false;
				let isDirectManager = false;
				const newSitesManaged: string[] = [];

				currentUser.personSystemRoles.forEach((pr) => {
					if (pr.role.name === 'personnelManager') {
						isManager = true;
						isDirectManager = true; // Personnel managers can also see direct reports
					}

					if (pr.role.name === 'siteManager' && pr.role.opts) {
						isSiteManager = true;
						newSitesManaged.push(...pr.role.opts);
					}
				});

				// Update filters and sites
				setFilters(prev => ({
					...prev,
					isManager,
					isSiteManager,
					isDirectManager
				}));
				setSitesManaged(newSitesManaged);
			}

			return currentUser;
		},
	});

	// Memoize the filtered and searched results
	const peopleToShow = useMemo(() => {
		if (!sortedPeople?.people) return [];

		// Use the new filtering system
		return applyFiltersAndSearch(
			sortedPeople.people,
			commandChainPeople,
			sortedPeopleSite,
			sortedPeopleDirectReports,
			searchTerm,
			currentUser || null,
			sitesManaged,
			filters
		);
	}, [sortedPeople?.people, commandChainPeople, sortedPeopleSite, sortedPeopleDirectReports, searchTerm, currentUser, filters, sitesManaged]);

	if (peopleLoading || commandChainLoading || siteLoading || directReportsLoading) {
		return <div>Loading...</div>;
	}

	return (
		<DesktopDashboard
			people={peopleToShow}
			onSearch={handleSearch}
			onFiltersChange={handleFiltersChange}
			initialFilters={filters}
			permissions={permissions}
		/>
	);
} 