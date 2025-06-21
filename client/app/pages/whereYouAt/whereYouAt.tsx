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

	return (
		<Stack direction="column" alignItems="center" minWidth="40vw" gap={2}>
			<TopBar />
			{!!sortedPeople?.user && !peopleLoading && (
				<PersonCard
					person={sortedPeople.user}
					isUser
					expanded={true} // User card is always expanded
					onExpandChange={() => { }} // No-op for user card
				/>
			)}

			{!!sortedPeople?.people &&
				!peopleLoading &&
				sortedPeople.people.map((person: Person) => (
					<PersonCard
						key={person.id}
						person={person}
						permissions={permissions}
						expanded={expandedCardId === person.id}
						onExpandChange={(expanded: boolean) => handleCardExpand(person.id, expanded)}
					/>
				))}
		</Stack>
	);
}
