import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { getPerson } from '../../clients/personsClient';
import axios from 'axios';
import PersonCard from './components/PersonCard';
import { usePeopleData } from '../../hooks/useQueries';
import TopBar from './components/TopBar';
import { Stack } from '@mui/material';
import type { Person } from '../../types';

interface Manager {
	id: string;
	name: string;
}

interface SiteManager {
	id: string;
	name: string;
	managers: Manager[];
}

interface PersonResponse extends Omit<Person, 'site'> {
	managers?: Manager[];
	site?: SiteManager;
}

export default function WhereYouAt() {
	const [userId, setUserId] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
	const [filters, setFilters] = useState({
		isManager: false,
		isSiteManager: false,
	});
	const queryClient = useQueryClient();

	useEffect(() => {
		const id = localStorage.getItem('login_token') || '';
		setUserId(id);
	}, []);

	const { data: sortedPeople, isLoading: peopleLoading } =
		usePeopleData(userId);

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
			return getPerson(userId);
		},
	});

	// Get all people with search and filters
	const { data: people = [], isLoading } = useQuery({
		queryKey: ['people', searchTerm, filters],
		queryFn: async () => {
			const response = await axios.get<PersonResponse[]>('/api/people');
			let filteredPeople = response.data;

			// Apply search filter
			if (searchTerm) {
				filteredPeople = filteredPeople.filter((person) =>
					person.name.toLowerCase().includes(searchTerm.toLowerCase())
				);
			}

			// Apply manager filter
			if (filters.isManager && currentUser) {
				filteredPeople = filteredPeople.filter((person) =>
					person.managers?.some((manager) => manager.id === currentUser.id)
				);
			}

			// Apply site manager filter
			if (filters.isSiteManager && currentUser) {
				filteredPeople = filteredPeople.filter((person) =>
					person.site?.managers?.some((manager) => manager.id === currentUser.id)
				);
			}

			return filteredPeople;
		},
	});

	const handleCardExpand = (personId: string, expanded: boolean) => {
		if (expanded) {
			setExpandedCardId(personId);
		} else {
			setExpandedCardId(null);
		}
	};
	console.log(sortedPeople);
	return (
		<Stack 
			direction="column" 
			alignItems="center" 
			minWidth="40vw" 
			gap={2}
			sx={{
				pb: '80px', // Add padding at the bottom to account for the fixed nav bar
				minHeight: '100vh',
				overflowX: 'hidden'
			}}
		>
			<TopBar onSearch={handleSearch} onFiltersChange={handleFiltersChange} />
			
			{!!sortedPeople?.user && !peopleLoading && (
				<PersonCard
					person={sortedPeople.user}
					isUser
				/>
			)}

			{!!filteredPeople &&
				!peopleLoading &&
				filteredPeople.map((person: Person) => (
					<PersonCard
						key={person.id}
						person={person}
						permissions={permissions}
					/>
				))}
		</Stack>
	);
}
