import { Box, Modal, Typography } from '@mui/material';

import type { Person } from '../../../../types';
import AlertAction from './AlertAction';
import ReportAction from './ReportAction';
import MoveAction from './ActionMove';
import SystemRoleAction from './SystemRoleAction';

const ActionModal = ({
	person,
	action,
	openModal,
	onClose,
}: {
	person: Person;
	action: string;
	openModal: boolean;
	onClose: () => void;
}) => {
	return (
		<Modal
			open={openModal}
			onClose={onClose}
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				bgcolor: 'rgba(0, 0, 0, 0.5)',
			}}
		>
			<Box
				sx={{
					bgcolor: 'background.paper',
					borderRadius: 2,
					boxShadow: 24,
					p: 4,
					maxWidth: 400,
					width: '90%',
					maxHeight: '90vh',
					overflow: 'auto',
				}}
			>
				{action === 'Alert' && (
					<AlertAction person={person} onClose={onClose} />
				)}
				{action === 'Report' && (
					<ReportAction person={person} onClose={onClose} />
				)}
				{action === 'Move' && <MoveAction person={person} onClose={onClose} />}
				{action === 'More' && (
					<SystemRoleAction
						person={person}
						onClose={onClose}
					/>
				)}
			</Box>
		</Modal>
	);
};

export default ActionModal;
