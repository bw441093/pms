import React, { useState, type ChangeEvent, type SyntheticEvent } from 'react';
import {
	Button,
	Stack,
	TextField,
	Typography,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
} from '@mui/material';

import type { Person } from '../../../../types';
import { useUpdateReportStatus } from '~/hooks/useQueries';
import { hebrewLocationNames, LOCATION_STATUSES } from '../../../../consts';

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
	const updateReportStatusMutation = useUpdateReportStatus();

	const handleButtonClick = (event: SyntheticEvent) => {
		event.stopPropagation();
		const status = reportStatusReport;
		const location = site !== 'other' ? site : locationReport;

		updateReportStatusMutation.mutate(
			{ userId: id, status, location },
			{
				onSuccess: () => {
					onClose();
				},
			}
		);
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>, setter: Function) => {
		const { value } = e.target;
		setter(value);
	};

	return (
		<Stack spacing={3} sx={{ minWidth: 300 }}>
			<Typography
				variant="h6"
				component="h2"
				sx={{ textAlign: 'right' }}
				gutterBottom
			>
				דווח מיקום / סטטוס
			</Typography>
			<Stack spacing={2}>
				<TextField
					inputProps={{ style: { textAlign: 'right' } }}
					label="מיקום"
					fullWidth
					disabled={site !== 'other'}
					value={locationReport}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						handleChange(e, setLocationReport)
					}
				/>
			</Stack>
			<FormControl fullWidth>
				<InputLabel id="status-select-label">סטטוס</InputLabel>
				<Select
					labelId="status-select-label"
					id="status-select"
					value={reportStatusReport}
					label="סטטוס"
					sx={{
						'& .MuiSelect-select': {
							textAlign: 'right',
						},
					}}
					onChange={(e) => setReportStatusReport(e.target.value)}
				>
					{LOCATION_STATUSES.map((option) => (
						<MenuItem key={option} value={option}>
							{hebrewLocationNames[option]}
						</MenuItem>
					))}
				</Select>
			</FormControl>
			<Stack direction="row" spacing={2} justifyContent="flex-end">
				<Button variant="outlined" onClick={onClose}>
					ביטול
				</Button>
				<Button
					variant="contained"
					onClick={handleButtonClick}
					disabled={updateReportStatusMutation.isPending}
				>
					שליחה
				</Button>
			</Stack>
		</Stack>
	);
};

export default ReportAction;
