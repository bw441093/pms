import React, { useState, type ChangeEvent, type SyntheticEvent } from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { Check, Close } from '@mui/icons-material';

import type { Person } from '../../../../types';
import { updateAlertStatus, updateReportStatus } from '~/clients/personsClient';

const ReportAction = ({
	person,
	onClose,
}: {
	person: Person;
	onClose: () => void;
}) => {
	const { id, reportStatus, location, site } = person;

	const [locationReport, setLocationReport] = useState(location);
	const [reportStatusReport, setReportStatusReport] = useState(reportStatus);

	const handleButtonClick = (event: SyntheticEvent) => {
		event.stopPropagation();
		const status = reportStatusReport;
		const location = site !== 'other' ? site : locationReport;

		updateReportStatus(id, status, location);
		onClose();
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>, setter: Function) => {
		const { value } = e.target;
		setter(value);
	};

	return (
		<Stack spacing={3} sx={{ minWidth: 300 }}>
			<Typography variant="h6" component="h2" gutterBottom>
				Report your location/status
			</Typography>
			<Stack spacing={2}>
				<TextField
					label="Status"
					fullWidth
					value={reportStatusReport}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						handleChange(e, setReportStatusReport)
					}
				/>
				<TextField
					label="Location"
					fullWidth
					disabled={site !== 'other'}
					value={locationReport}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						handleChange(e, setLocationReport)
					}
				/>
			</Stack>
			<Stack direction="row" spacing={2} justifyContent="flex-end">
				<Button variant="outlined" onClick={onClose}>
					Cancel
				</Button>
				<Button variant="contained" onClick={handleButtonClick}>
					Submit
				</Button>
			</Stack>
		</Stack>
	);
};

export default ReportAction;
