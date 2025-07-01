import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PersonCard from './components/PersonCard';
import { useCommandChainData, useSiteData } from '../../hooks/useQueries';
import HrTopBar from './components/HrTopBar';
import { Stack } from '@mui/material';
import type { Person } from '../../types';
import { getPerson } from '~/clients/personsClient';


export default function WhereYouAt() {
	const [userId, setUserId] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const queryClient = useQueryClient();
	const [filters, setFilters] = useState({
		isManager: false,
		isSiteManager: false,
	});
	const [sitesManaged, setSitesManaged] = useState<string[]>([]);

	useEffect(() => {
		const id = localStorage.getItem('login_token') || '';
		setUserId(id);
	}, []);

	const { data: sortedPeopleCommandChain = [], isLoading: peopleLoadingCommandChain } = useCommandChainData(userId);
	const { data: sortedPeopleSite = [], isLoading: peopleLoadingSite } = useSiteData(userId);
	const permissions = (sortedPeopleCommandChain[0]?.personSystemRoles || []).map((pr: any) => ({ name: pr.role.name, opts: pr.role.opts }));

	const filterPeople = (
		people: Person[],
		currentUser: Person | null,
		sitesManaged: string[],
		filters: { isManager: boolean; isSiteManager: boolean }
	) => {
		if (!people || !currentUser) return people;

		let isManagedByMeFiltered: Person[] = [];
		let isInMySitefiltered: Person[] = [];

		if (filters.isManager) {
			isManagedByMeFiltered = sortedPeopleCommandChain;
		}

		// Filter people from sites that the current user manages
		if (filters.isSiteManager && sitesManaged.length > 0) {
			isInMySitefiltered = sortedPeopleSite;
		}

		const filteredSet = new Set([...isManagedByMeFiltered, ...isInMySitefiltered]);
		return Array.from(filteredSet);
	};

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

				currentUser.personSystemRoles.forEach((pr: any) => {
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
		let basePeople: Person[] = [];
		if (filters.isManager) {
			basePeople = [...basePeople, ...sortedPeopleCommandChain];
		}
		if (filters.isSiteManager) {
			basePeople = [...basePeople, ...sortedPeopleSite]; 
		}
		if (!basePeople) return [];
		// First apply search filter
		let filtered = searchTerm
			? basePeople.filter((person: Person) => fuzzyMatch(person.name, searchTerm))
			: basePeople;
		// Then apply manager/site filters (union)
		return filterPeople(filtered, currentUser || null, sitesManaged, filters);
	}, [sortedPeopleCommandChain, sortedPeopleSite, searchTerm, currentUser, filters, sitesManaged]);

	return (
		<Stack
			direction="column"
			alignItems="center"
			spacing={3}
			sx={{
				pb: '80px', // Add padding at the bottom to account for the fixed nav bar
			}}
		>
			<HrTopBar
				onSearch={handleSearch}
				onFiltersChange={handleFiltersChange}
				initialFilters={filters}
			/>
			<Stack spacing={1.5} sx={{ width: '95%', alignItems: 'center' }}>
				{peopleToShow.map((person: Person) => (
					<PersonCard
						key={person.id}
						person={person}
						permissions={permissions}
					/>
				))}
			</Stack>
		</Stack>
	);
}
