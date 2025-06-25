import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PersonCard from './components/PersonCard';
import { usePeopleData } from '../../hooks/useQueries';
import TopBar from './components/TopBar';
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

	const filterPeople = (
		people: Person[],
		currentUser: Person | null,
		sitesManaged: string[],
		filters: { isManager: boolean; isSiteManager: boolean }
	) => {
		if (!people || !currentUser) return people;

		let filtered = [...people];
		console.log('Starting filter with:', {
			peopleCount: filtered.length,
			filters,
			sitesManaged
		});
		console.log('sitesManaged', sitesManaged);
		if (filters.isManager) {
			filtered = filtered.filter((person) => {
				const isManaged = person.manager?.id === currentUser.id;
				console.log(`${person.name} manager check:`, {
					personManagerId: person.manager?.id,
					currentUserId: currentUser.id,
					isManaged
				});
				return isManaged;
			});
			console.log('After manager filter:', filtered.length);
		}

		// Filter people from sites that the current user manages
		if (filters.isSiteManager && sitesManaged.length > 0) {
			filtered = filtered.filter((person) => {
				// Check if the person's site is in the list of sites managed by current user
				const isSiteManaged = sitesManaged.includes(person.site);
				console.log(`${person.name} site check:`, {
					personSite: person.site,
					sitesManaged,
					isSiteManaged
				});
				return isSiteManaged;
			});
			console.log('After site filter:', filtered.length);
		}

		return filtered;
	};

	const { data: sortedPeople, isLoading: peopleLoading } = usePeopleData(userId);

	const permissions = sortedPeople?.user?.personRoles?.map((pr) => ({ name: pr.role.name, opts: pr.role.opts }));

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

	// Filter people based on search term
	const filteredPeople = useMemo(() => {
		if (!searchTerm || !sortedPeople?.people) return sortedPeople?.people;

		return sortedPeople.people.filter(person =>
			fuzzyMatch(person.name, searchTerm)
		);
	}, [sortedPeople?.people, searchTerm]);

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

			if (currentUser.personRoles) {
				// Reset filters and sites
				console.log('currentUser', currentUser);
				let isManager = false;
				let isSiteManager = false;
				const newSitesManaged: string[] = [];

				currentUser.personRoles.forEach((pr) => {
					// Check for personnel manager role
					if (pr.role.name === 'personnelManager') {
						isManager = true;
					}

					// Check for site manager role and collect sites
					console.log('pr.role.opts', pr.role.opts);
					if (pr.role.name === 'siteManager' && pr.role.opts) {
						isSiteManager = true;
						// pr.role.opts.sites should be an array of site codes
						newSitesManaged.push(...pr.role.opts);
					}
				});

				console.log('User roles processed:', {
					isManager,
					isSiteManager,
					newSitesManaged
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

	const peopleToShow = useMemo(() => {
		if (!sortedPeople?.people) return [];

		// First apply search filter
		let filtered = searchTerm
			? sortedPeople.people.filter(person => fuzzyMatch(person.name, searchTerm))
			: sortedPeople.people;

		// Then apply manager/site filters
		return filterPeople(filtered, currentUser || null, sitesManaged, filters);
	}, [sortedPeople?.people, searchTerm, currentUser, filters, sitesManaged]);

	return (
		<Stack
			direction="column"
			alignItems="center"
			spacing={3}
			sx={{
				pb: '80px', // Add padding at the bottom to account for the fixed nav bar
			}}
		>
			<TopBar
				onSearch={handleSearch}
				onFiltersChange={handleFiltersChange}
			/>
			<Stack spacing={1.5} sx={{ width: '95%', alignItems: 'center' }}>
				{peopleToShow.map((person) => (
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
