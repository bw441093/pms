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
	Alert,
} from '@mui/material';
import Check from '@mui/icons-material/Check';

import type { Person } from '../../../../../types';
import { getPerson } from '~/clients/personsClient';
import { usePostMoveStatus, useUpdateMoveStatus } from '~/hooks/useQueries';
import { hebrewSiteNames, SITE_OPTIONS } from '~/consts';
import { checkIsPersonnelManager, hasHigherRole, isAdminOfSite } from '../../../../../utils/groupUtils';

const MoveAction = ({
	person,
	onClose,
}: {
	person: Person;
	onClose: () => void;
}) => {
	const { id, site, currentSite, transaction } = person;
	const [origin, setOrigin] = useState(currentSite || site);
	const [target, setTarget] = useState('');
	const [error, setError] = useState('');
	const [permissions, setPermissions] = useState({
		isOriginManager: false,
		isTargetManager: false,
		isHrManager: false,
		isPersonnelManager: false,
	});

	const postMoveStatusMutation = usePostMoveStatus();
	const updateMoveStatusMutation = useUpdateMoveStatus();

	// Load permissions on component mount
	React.useEffect(() => {
		const loadPermissions = async () => {
			const userId = localStorage.getItem('login_token') || '';
			const user = await getPerson(userId);
			const newPermissions = {
				isOriginManager: false,
				isTargetManager: false,
				isHrManager: false,
				isPersonnelManager: false,
			};

			if (transaction) {
				// Check for higher-level system roles (these still use system roles)
				const systemRoles = user.personSystemRoles?.map((pr: any) => pr.role.name) ?? [];
				const hasHigherRolePermissions = hasHigherRole(systemRoles);

				if (hasHigherRolePermissions) {
					newPermissions.isHrManager = true;
					newPermissions.isPersonnelManager = true; // Higher roles have personnel manager permissions
				} else {
					// Check group-based personnel manager role
					newPermissions.isPersonnelManager = await checkIsPersonnelManager(userId);
				}

				// Check site group admin permissions using centralized utility functions
				try {
					// Check if user is admin of origin and target sites
					newPermissions.isOriginManager = await isAdminOfSite(userId, transaction.origin);
					newPermissions.isTargetManager = await isAdminOfSite(userId, transaction.target);
				} catch (err) {
					console.error('Error loading site group permissions:', err);
					// Fallback to false for site permissions
				}
			}
			setPermissions(newPermissions);
		};

		loadPermissions();
	}, [transaction]);

	const handleButtonClick = (event: SyntheticEvent) => {
		event.stopPropagation();
		
		// Validate target is selected
		if (!target.trim()) {
			setError('אנא בחר יעד להעברה');
			return;
		}
		
		setError(''); // Clear any previous errors
		postMoveStatusMutation.mutate(
			{ userId: id, origin, target },
			{
				onSuccess: () => {
					onClose();
				},
				onError: (error) => {
					setError(error.message || 'שגיאה ביצירת בקשת העברה');
				},
			}
		);
	};

	const handleConfirmButtonClick = (
		originator: string,
		event: SyntheticEvent
	) => {
		event.stopPropagation();
		setError(''); // Clear any previous errors
		updateMoveStatusMutation.mutate(
			{ userId: id, originator, status: true },
			{
				onSuccess: () => {
					onClose();
				},
				onError: (error) => {
					setError(error.message || 'שגיאה באישור העברה');
				},
			}
		);
	};

	const isButtonDisabled = (originator: string) => {
		// Check if confirmation has already been made
		if (originator === 'origin' && transaction?.originConfirmation) return true;
		if (originator === 'target' && transaction?.targetConfirmation) return true;

		// Check permissions
		if (
			transaction?.origin === 'other' &&
			(!permissions.isPersonnelManager || !permissions.isOriginManager)
		)
			return false;
		if (
			transaction?.target === 'other' &&
			(!permissions.isPersonnelManager || !permissions.isTargetManager)
		)
			return false;
		if (
			originator === 'origin' &&
			(permissions.isOriginManager || permissions.isHrManager)
		)
			return false;
		if (
			originator === 'target' &&
			(permissions.isTargetManager || permissions.isHrManager)
		)
			return false;
		return true;
	};

	const isLoading =
		postMoveStatusMutation.isPending || updateMoveStatusMutation.isPending;

	// Check if we should show text inputs (no transaction or resolved transaction)
	const shouldShowTextInputs =
		!transaction || transaction.status === 'resolved';

	// Check if we should show confirmation buttons (pending transaction)
	const shouldShowConfirmationButtons =
		transaction && transaction.status === 'pending';

	return (
		<Stack spacing={3} sx={{ minWidth: 300 }}>
			<Typography
				variant="h6"
				component="h2"
				sx={{ textAlign: 'right' }}
				gutterBottom
			>
				הזז משתמש
			</Typography>

			{error && (
				<Alert severity="error" sx={{ textAlign: 'right' }}>
					{error}
				</Alert>
			)}

			{shouldShowTextInputs && (
				<Stack spacing={2}>
					<FormControl fullWidth>
						<InputLabel id="origin-select-label">מקור</InputLabel>
						<Select
							sx={{
								'& .MuiSelect-select': {
									textAlign: 'right',
								},
							}}
							labelId="origin-select-label"
							id="origin-select"
							value={origin}
							label="מקור"
							onChange={(e) => setOrigin(e.target.value)}
							disabled
						>
							{SITE_OPTIONS.map((option) => (
								<MenuItem key={option} value={option}>
									{hebrewSiteNames[option]}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl fullWidth>
						<InputLabel id="target-select-label">יעד</InputLabel>
						<Select
							sx={{
								'& .MuiSelect-select': {
									textAlign: 'right',
								},
							}}
							labelId="target-select-label"
							id="target-select"
							value={target}
							label="יעד"
							onChange={(e) => setTarget(e.target.value)}
						>
							{SITE_OPTIONS.map((option) => (
								<MenuItem key={option} value={option}>
									{hebrewSiteNames[option]}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Stack>
			)}

			{shouldShowConfirmationButtons && transaction && (
				<Stack spacing={2}>
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ textAlign: 'right' }}
					>
						ממתין לאישור מעבר מ-{hebrewSiteNames[transaction.origin]} אל-{' '}
						{hebrewSiteNames[transaction.target]}
					</Typography>

					<Stack direction="row" spacing={2}>
						<Button
							variant="outlined"
							startIcon={<Check />}
							onClick={(e) => handleConfirmButtonClick('target', e)}
							disabled={isButtonDisabled('target') || isLoading}
							fullWidth
						>
							אישור יעד
						</Button>
						<Button
							variant="outlined"
							startIcon={<Check />}
							onClick={(e) => handleConfirmButtonClick('origin', e)}
							disabled={isButtonDisabled('origin') || isLoading}
							fullWidth
						>
							אישור מקור
						</Button>
					</Stack>
				</Stack>
			)}

			<Stack direction="row" spacing={2} justifyContent="flex-end">
				<Button variant="outlined" onClick={onClose}>
					ביטול
				</Button>
				{shouldShowTextInputs && (
					<Button
						variant="contained"
						onClick={handleButtonClick}
						disabled={isLoading || !target.trim()}
					>
						שליחה
					</Button>
				)}
			</Stack>
		</Stack>
	);
};

export default MoveAction;
