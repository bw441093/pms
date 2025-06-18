import React, { useState, type SyntheticEvent } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { Check, Close } from '@mui/icons-material';

import type { Person } from '../../../../types';
import { updateAlertStatus } from '~/clients/personsClient';

const AlertAction = ({
	person,
	onClose,
}: {
	person: Person;
	onClose: () => void;
}) => {
	const { id } = person;
	const handleButtonClick = (status: string, event: SyntheticEvent) => {
		event.stopPropagation();
		updateAlertStatus(id, status);
		onClose();
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
				>
					Good
				</Button>
				<Button
					variant="contained"
					color="error"
					size="large"
					startIcon={<Close />}
					onClick={(e) => handleButtonClick('bad', e)}
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
