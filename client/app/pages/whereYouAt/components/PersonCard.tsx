import React, { useState, type SyntheticEvent } from 'react';
import {
	Card,
	CardContent,
	Typography,
	IconButton,
	Button,
	Collapse,
	Box,
	Stack,
	Modal,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Warning from '@mui/icons-material/Warning';
import Campaign from '@mui/icons-material/Campaign';
import Shuffle from '@mui/icons-material/Shuffle';
import MoreVert from '@mui/icons-material/MoreVert';
import Circle from '@mui/icons-material/Circle';
import type { Person } from '../../../types';
import ActionModal from './ActionModal/ActionModal';
import { hebrewLocationNames, hebrewSiteNames } from '~/consts';

const defaultPerson: Person = {
	id: '13123123',
	name: 'John Doe',
	site: 'mbt',
	manager: {
		id: '13123123',
		name: 'Jane Doe',
	},
	location: 'jerusalem',
	reportStatus: 'home',
	alertStatus: 'pending',
	updatedAt: '2025-06-18T11:09:04.797Z',
};

interface PersonCardProps {
	person?: Person;
	isUser?: boolean;
	permissions?: { name: string; opts: string[] }[];
	expanded?: boolean;
	onExpandChange?: (expanded: boolean) => void;
}

const PersonCard: React.FC<PersonCardProps> = ({
	person = defaultPerson,
	permissions,
	expanded = false,
	onExpandChange,
}) => {
	const [openModal, setOpenModal] = useState(false);
	const [action, setAction] = useState('');
	const {
		name,
		site,
		manager,
		location,
		reportStatus,
		alertStatus,
		updatedAt,
		transaction,
		personRoles,
	} = person;

	const handleExpandClick = () => {
		if (onExpandChange) {
			onExpandChange(!expanded);
		}
	};

	const handleButtonClick = (action: string, event: SyntheticEvent) => {
		event.stopPropagation();
		setAction(action);
		setOpenModal(true);
	};

	return (
		<Card
			elevation={2}
			sx={{
				width: 350,
			}}
		>
			{/* Header Section */}
			<CardContent
				onClick={handleExpandClick}
				sx={{
					cursor: 'pointer',
					p: 0,
					'&:last-child': {
						paddingBottom: 0,
					},
				}}
			>
				<Stack direction="row" alignItems="center" gap={2}>
					<IconButton
						sx={{
							transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
							transition: 'transform 0.3s ease',
						}}
						aria-expanded={expanded}
						aria-label="הראה יותר"
					>
						<ExpandMoreIcon />
					</IconButton>
					<Stack flexGrow={1}>
						<Stack direction="row" flexGrow={1}>
							<Stack flexGrow={1} textAlign="right">
								<Typography>
									{reportStatus in hebrewLocationNames
										? hebrewLocationNames[
										reportStatus as keyof typeof hebrewLocationNames
										]
										: reportStatus}
								</Typography>
								<Typography>
									{location in hebrewSiteNames
										? hebrewSiteNames[location as keyof typeof hebrewSiteNames]
										: location}
								</Typography>
							</Stack>
							<Stack flexGrow={1} textAlign="right">
								<Typography>{name}</Typography>
								<Typography>{manager?.name || 'אין מפקד'}</Typography>
								<Typography>{hebrewSiteNames[site]}</Typography>
							</Stack>
						</Stack>
						<Typography variant="caption" color="text.secondary">
							{new Date(updatedAt).toLocaleDateString('he-IL', {
								year: 'numeric',
								month: '2-digit',
								day: '2-digit',
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit',
								hour12: false,
							})}
						</Typography>
					</Stack>

					<Circle
						color={
							alertStatus !== 'good' ||
								(transaction && transaction?.status !== 'resolved')
								? 'error'
								: 'success'
						}
					/>
				</Stack>
			</CardContent>

			<Collapse in={expanded} timeout="auto" unmountOnExit>
				<CardContent
					sx={{
						p: 0,
						paddingInline: 1,
						flexGrow: 1,
						'&:last-child': {
							paddingBottom: 1,
						},
					}}
				>
					<Stack direction="row" gap={0}>
						<Button
							variant="contained"
							disabled={alertStatus === 'good'}
							color="error"
							onClick={(e) => handleButtonClick('Alert', e)}
							sx={{ flexGrow: 1, borderRadius: 0 }}
						>
							<Warning />
						</Button>
						<Button
							variant="contained"
							onClick={(e) => handleButtonClick('Report', e)}
							sx={{ flexGrow: 1, borderRadius: 0 }}
						>
							<Campaign />
						</Button>
						<Button
							variant="contained"
							color={
								person.transaction?.status === 'pending' ? 'error' : 'primary'
							}
							onClick={(e) => handleButtonClick('Move', e)}
							sx={{ flexGrow: 1, borderRadius: 0 }}
						>
							<Shuffle />
						</Button>
						<Button
							variant="contained"
							onClick={(e) => handleButtonClick('More', e)}
							disabled={permissions?.length === 0}
							sx={{ flexGrow: 1, borderRadius: 0 }}
						>
							<MoreVert />
						</Button>
					</Stack>
				</CardContent>
			</Collapse>

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
