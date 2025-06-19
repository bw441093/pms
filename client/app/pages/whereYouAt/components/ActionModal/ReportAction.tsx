import React, { useState, type ChangeEvent, type SyntheticEvent } from 'react';
import { Button, Stack, TextField, Typography, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Check, Close } from '@mui/icons-material';

import type { Person } from '../../../../types';
import { useUpdateReportStatus } from '~/hooks/useQueries';
import { STATUS_OPTIONS } from '../../../../consts';

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
			<Typography variant="h6" component="h2" gutterBottom>
				Report your location/status
			</Typography>
			<Stack spacing={2}>
				<FormControl fullWidth>
					<InputLabel id="status-select-label">Status</InputLabel>
					<Select
						labelId="status-select-label"
						id="status-select"
						value={reportStatusReport}
						label="Status"
						onChange={(e) => setReportStatusReport(e.target.value)}
					>
						{STATUS_OPTIONS.map((option: string) => (
							<MenuItem key={option} value={option}>
								{option}
							</MenuItem>
						))}
					</Select>
				</FormControl>
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
				<Button
					variant="contained"
					onClick={handleButtonClick}
					disabled={updateReportStatusMutation.isPending}
				>
					Submit
				</Button>
			</Stack>
		</Stack>
	);
};

export default ReportAction;
