import { useState, useEffect } from 'react';

import PersonCard from './components/PersonCard';
import { useQueryClient } from '@tanstack/react-query';
import {
	usePeopleData,
	useUserSite,
	useUpdateUserSite,
} from '../../hooks/useQueries';
import TopBar from './components/TopBar';
import { Stack } from '@mui/material';
import type { Person } from '~/types';

export default function WhereYouAt() {
	const [userId, setUserId] = useState('');
	const [selected, setSelected] = useState('');
	const queryClient = useQueryClient();

	useEffect(() => {
		const id = localStorage.getItem('login_token') || '';
		setUserId(id);
	}, []);

	const { data: sortedPeople, isLoading: peopleLoading } =
		usePeopleData(userId);

	return (
		<Stack direction="column" alignItems="center" minWidth="40vw" gap={2}>
			<TopBar />
			{!!sortedPeople?.user && !peopleLoading && (
				<PersonCard person={sortedPeople.user} isUser />
			)}

			{!!sortedPeople?.people &&
				!peopleLoading &&
				sortedPeople.people.map((person: Person) => (
					<PersonCard person={person} />
				))}
		</Stack>
	);
}
