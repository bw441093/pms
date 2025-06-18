import React, { useState, type SyntheticEvent } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { Check, Close } from '@mui/icons-material';

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
			<Typography variant="h6" component="h2" gutterBottom>
				Update Alert Status
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
					Good
				</Button>
				<Button
					variant="contained"
					color="error"
					size="large"
					startIcon={<Close />}
					onClick={(e) => handleButtonClick('bad', e)}
					disabled={updateAlertStatusMutation.isPending}
				>
					Bad
				</Button>
			</Stack>
			<Stack direction="row" spacing={2} justifyContent="center">
				<Button variant="outlined" onClick={onClose}>
					Cancel
				</Button>
			</Stack>
		</Stack>
	);
};

export default AlertAction;
