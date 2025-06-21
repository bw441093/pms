import React, { useState, type SyntheticEvent } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';

import type { Person } from '../../../../types';
import { useUpdateAlertStatus } from '~/hooks/useQueries';

const AlertAction = ({
	person,
	onClose,
}: {
	person: Person;
	onClose: () => void;
}) => {
	const { id } = person;
	const updateAlertStatusMutation = useUpdateAlertStatus();

	const handleButtonClick = (status: string, event: SyntheticEvent) => {
		event.stopPropagation();
		updateAlertStatusMutation.mutate(
			{ userId: id, status },
			{
				onSuccess: () => {
					onClose();
				},
			}
		);
	};

	return (
		<Stack spacing={3} sx={{ minWidth: 300 }}>
			<Typography
				variant="h6"
				component="h2"
				gutterBottom
				sx={{ textAlign: 'right' }}
			>
				עדכן מצב התראה
			</Typography>
			<Stack direction="row" spacing={2} justifyContent="center">
				<Button
					variant="contained"
					color="success"
					size="large"
					startIcon={<Check />}
					onClick={(e) => handleButtonClick('good', e)}
					disabled={updateAlertStatusMutation.isPending}
				>
					טוב
				</Button>
			</Stack>
			<Stack direction="row" spacing={2} justifyContent="center">
				<Button variant="outlined" onClick={onClose}>
					ביטול
				</Button>
			</Stack>
		</Stack>
	);
};

export default AlertAction;
