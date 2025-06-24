import { useState, useEffect } from 'react';

import PersonCard from './components/PersonCard';
import { useQueryClient } from '@tanstack/react-query';
import {
	usePeopleData,
} from '../../hooks/useQueries';
import TopBar from './components/TopBar';
import { Stack } from '@mui/material';
import type { Person } from '../../types';

export default function WhereYouAt() {
	const [userId, setUserId] = useState('');
	const [selected, setSelected] = useState('');
	const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
	const queryClient = useQueryClient();

	useEffect(() => {
		const id = localStorage.getItem('login_token') || '';
		setUserId(id);
	}, []);

	const { data: sortedPeople, isLoading: peopleLoading } =
		usePeopleData(userId);

	const permissions = sortedPeople?.user?.personRoles?.map((pr) => ({ name: pr.role.name, opts: pr.role.opts }));
	const handleCardExpand = (personId: string, expanded: boolean) => {
		if (expanded) {
			setExpandedCardId(personId);
		} else {
			setExpandedCardId(null);
		}
	};
	console.log(sortedPeople);
	return (
		<Stack direction="column" alignItems="center" minWidth="40vw" gap={2}>
			<TopBar />
			{!!sortedPeople?.user && !peopleLoading && (
				<PersonCard
					person={sortedPeople.user}
					isUser
				/>
			)}

			{!!sortedPeople?.people &&
				!peopleLoading &&
				sortedPeople.people.map((person: Person) => (
					<PersonCard
						key={person.id}
						person={person}
						permissions={permissions}
					/>
				))}
		</Stack>
	);
}
