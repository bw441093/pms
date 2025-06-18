import React, { useState, type ChangeEvent, type SyntheticEvent } from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { Check, Close } from '@mui/icons-material';

import type { Person } from '../../../../types';
import {
	getPerson,
	postMoveStatus,
	updateAlertStatus,
	updateReportStatus,
	updatMoveStatus,
} from '~/clients/personsClient';

const MoveAction = ({
	person,
	onClose,
}: {
	person: Person;
	onClose: () => void;
}) => {
	const { id, site, transaction } = person;
	const [origin, setOrigin] = useState(site);
	const [target, setTarget] = useState('');
	const [permissions, setPermissions] = useState({
		isOriginManager: false,
		isTargetManager: false,
		isHrManager: false,
		isPersonnelManager: false,
	});

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
				user.personRoles?.forEach(({ role }) => {
					if (userId === person.manager)
						newPermissions.isPersonnelManager = true;
					if (role.name === 'hrManager' || role.name === 'hrManager')
						newPermissions.isHrManager = true;
					if (role.name === 'siteManager') {
						if (
							role?.opts.some(
								(siteToManage: string) => siteToManage === transaction.origin
							)
						) {
							newPermissions.isOriginManager = true;
						}
						if (
							role?.opts.some(
								(siteToManage: string) => siteToManage === transaction.target
							)
						) {
							newPermissions.isTargetManager = true;
						}
					}
				});
			}
			setPermissions(newPermissions);
		};

		loadPermissions();
	}, [person.manager, transaction]);

	const handleButtonClick = (event: SyntheticEvent) => {
		event.stopPropagation();
		postMoveStatus(id, origin, target);
		onClose();
	};

	const handleConfirmButtonClick = (
		originator: string,
		event: SyntheticEvent
	) => {
		event.stopPropagation();
		updatMoveStatus(id, originator, true);
		onClose();
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>, setter: Function) => {
		const { value } = e.target;
		setter(value);
	};

	const isButtonDisabled = (originator: string) => {
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
		if (originator === 'origin' && permissions.isOriginManager) return true;
		if (originator === 'target' && permissions.isTargetManager) return true;
		return false;
	};

	return (
		<Stack spacing={3} sx={{ minWidth: 300 }}>
			<Typography variant="h6" component="h2" gutterBottom>
				Move Action
			</Typography>

			{transaction && transaction.status === 'pending' && (
				<Stack spacing={2}>
					<Typography variant="subtitle1">Confirm Transaction</Typography>
					<Stack direction="row" spacing={2} justifyContent="center">
						<Button
							variant="contained"
							disabled={isButtonDisabled('origin')}
							color={transaction.originConfirmation ? 'success' : 'info'}
							onClick={(e) => handleConfirmButtonClick('origin', e)}
						>
							Origin
						</Button>
						<Button
							variant="contained"
							disabled={isButtonDisabled('target')}
							color={transaction.targetConfirmation ? 'success' : 'info'}
							onClick={(e) => handleConfirmButtonClick('target', e)}
						>
							Target
						</Button>
					</Stack>
				</Stack>
			)}

			<Stack spacing={2}>
				<Typography variant="subtitle1">Move Details</Typography>
				<TextField
					label="Origin"
					fullWidth
					value={origin}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						handleChange(e, setOrigin)
					}
				/>
				<TextField
					label="Target"
					fullWidth
					value={target}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						handleChange(e, setTarget)
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

export default MoveAction;
