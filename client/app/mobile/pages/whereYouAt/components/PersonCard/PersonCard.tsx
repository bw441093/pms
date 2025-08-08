import React, { useState, type SyntheticEvent } from 'react';
import {
	Card,
	CardContent,
	Typography,
	Button,
	Box,
	Stack,
	IconButton,
	Collapse,
} from '@mui/material';
import type { Person } from '../../../../../types';
import ActionModal from '../ActionModal/ActionModal';
import { hebrewLocationNames, hebrewSiteNames } from '~/consts';
import { useTheme } from '@mui/material/styles';
import PersonCardHeader from './PersonCardHeader';
import PersonCardActions from './PersonCardActions';
import PersonCardTimestamp from './PersonCardTimestamp';

const defaultPerson: Person = {
	id: '13123123',
	name: 'John Doe',
	site: 'mbt',
	manager: {
		id: '13123123',
		name: 'Jane Doe',
	},
	serviceType: 'hova',
	location: 'jerusalem',
	reportStatus: 'home',
	alertStatus: 'pending',
	updatedAt: '2025-06-18T11:09:04.797Z',
	approvedBy: null,
};

interface PersonCardProps {
	person?: Person;
	isUser?: boolean;
	permissions?: { name: string; opts: string[] }[];
	defaultCollapsed?: boolean;
}

const PersonCard: React.FC<PersonCardProps> = ({
	person = defaultPerson,
	defaultCollapsed = false,
}) => {
	const [openModal, setOpenModal] = useState(false);
	const [action, setAction] = useState('');
	const [collapsed, setCollapsed] = useState(defaultCollapsed);
	const theme = useTheme();
	const {
		name,
		site,
		currentSite,
		reportStatus,
		serviceType,
		updatedAt,
		transaction,
		alertStatus,
		approvedBy,
	} = person;

	const handleButtonClick = (action: string, event: SyntheticEvent) => {
		event.stopPropagation();
		setAction(action);
		setOpenModal(true);
	};

  const handleCardClick = (e: React.MouseEvent) => {
    // If any modal is open, ignore clicks on the card
    if (openModal) return;
    const anyOpenMuiModal = document.querySelector('.MuiModal-root[aria-hidden="false"]');
    if (anyOpenMuiModal) return;
    // Prevent toggling collapse when clicking any button or interactive element
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.person-card-menu-btn') || target.tagName === 'BUTTON') return;
    setCollapsed((prev) => !prev);
  };

	return (
		<Card
			elevation={0}
			sx={{
				width: '95%',
				bgcolor: theme.palette.custom.gray2,
				borderRadius: 5,
				cursor: 'pointer',
			}}
			onClick={handleCardClick}
		>
			<CardContent sx={{ px: 2, py: collapsed ? 1 : 2, '&:last-child': { pb: 2 }, direction: 'rtl', pb: collapsed ? 2 : undefined }}>
				<Stack spacing={3}>
					<PersonCardHeader
						name={name}
						alertStatus={alertStatus}
						transaction={transaction}
						reportStatus={reportStatus}
						hebrewLocationNames={hebrewLocationNames}
						currentSite={currentSite}
						site={site}
						hebrewSiteNames={hebrewSiteNames}
						collapsed={collapsed}
						handleButtonClick={handleButtonClick}
						approvedBy={approvedBy}
						serviceType={serviceType}
					/>
					<Collapse in={!collapsed} timeout="auto" unmountOnExit>
						<PersonCardActions
							transaction={transaction}
							alertStatus={alertStatus}
							handleButtonClick={handleButtonClick}
						/>
						<PersonCardTimestamp updatedAt={updatedAt} />
					</Collapse>
				</Stack>
			</CardContent>
			<ActionModal
				person={person}
				action={action}
				openModal={openModal}
				onClose={() => setOpenModal(false)}
			/>
		</Card>
	);
};

export default PersonCard;
