import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { usePeopleData, useIsMobile } from '../../hooks/useQueries';
import DesktopDashboard from './DesktopDashboard';
import type { Person } from '../../types';
import { getPerson } from '~/clients/personsClient';

export default function DashboardPage() {
	const navigate = useNavigate();
	const isMobile = useIsMobile();
	const [userId, setUserId] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [filters, setFilters] = useState({
		isManager: false,
		isSiteManager: false,
	});
	const [sitesManaged, setSitesManaged] = useState<string[]>([]);
	
	console.log('DashboardPage component rendered, isMobile:', isMobile);

	// This component is only for desktop - mobile users are redirected globally

	useEffect(() => {
		const id = localStorage.getItem('login_token') || '';
		setUserId(id);
	}, []);

	const filterPeople = (
		people: Person[],
		currentUser: Person | null,
		sitesManaged: string[],
		filters: { isManager: boolean; isSiteManager: boolean }
	) => {
		if (!people || !currentUser) return people;

		let filtered = [...people];
		let isManagedByMeFiltered: Person[] = [];
		let isInMySitefiltered: Person[] = [];

		if (filters.isManager) {
			isManagedByMeFiltered = filtered.filter((person) => {
				const isManaged = person.manager?.id === currentUser.id;
				return isManaged;
			});
		}

		// Filter people from sites that the current user manages
		if (filters.isSiteManager && sitesManaged.length > 0) {
			isInMySitefiltered = filtered.filter((person) => {
				// Check if the person's site is in the list of sites managed by current user
				const isSiteManaged = sitesManaged.includes(person.site);
				return isSiteManaged;
			});
		}

		const filteredSet = new Set([...isManagedByMeFiltered, ...isInMySitefiltered]);
		return Array.from(filteredSet);
	};

	const { data: sortedPeople, isLoading: peopleLoading } = usePeopleData(userId);

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

	const handleFiltersChange = useCallback((newFilters: { isManager: boolean; isSiteManager: boolean }) => {
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
				const newSitesManaged: string[] = [];

				currentUser.personSystemRoles.forEach((pr) => {
					if (pr.role.name === 'personnelManager') {
						isManager = true;
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
					isSiteManager
				}));
				setSitesManaged(newSitesManaged);
			}

			return currentUser;
		},
	});

	// Memoize the filtered and searched results
	const peopleToShow = useMemo(() => {
		if (!sortedPeople?.people) return [];

		// First apply search filter
		let filtered = searchTerm
			? sortedPeople.people.filter(person => fuzzyMatch(person.name, searchTerm))
			: sortedPeople.people;

		// Then apply manager/site filters
		return filterPeople(filtered, currentUser || null, sitesManaged, filters);
	}, [sortedPeople?.people, searchTerm, currentUser, filters, sitesManaged, filterPeople]);

	if (peopleLoading) {
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