import React, { useState, type SyntheticEvent } from 'react';
import {
	Card,
	CardContent,
	Avatar,
	Typography,
	IconButton,
	Button,
	Collapse,
	Box,
	Stack,
	Modal,
} from '@mui/material';
import {
	ExpandMore as ExpandMoreIcon,
	Warning,
	Campaign,
	Shuffle,
	MoreVert,
	Circle,
} from '@mui/icons-material';

import type { Person } from '../../../types';
import ActionModal from './ActionModal/ActionModal';

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

const PersonCard = ({
	person = defaultPerson,
	isUser = false,
	active = false,
}) => {
	const [expanded, setExpanded] = useState(isUser || active);
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
	} = person;
	const handleExpandClick = () => {
		setExpanded(!expanded);
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
					<Circle color={alertStatus === 'good' ? 'success' : 'error'} />

					<Stack flexGrow={1}>
						<Stack direction="row" flexGrow={1}>
							<Stack flexGrow={1}>
								<Typography>{name}</Typography>
								<Typography>{manager?.name || 'No manager'}</Typography>
								<Typography>{site}</Typography>
							</Stack>
							<Stack flexGrow={1}>
								<Typography>{reportStatus}</Typography>
								<Typography>{location}</Typography>
							</Stack>
						</Stack>
						<Typography variant="caption" color="text.secondary">
							{updatedAt}
						</Typography>
					</Stack>

					<IconButton
						sx={{
							transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
							transition: 'transform 0.3s ease',
						}}
						aria-expanded={expanded}
						aria-label="show more"
					>
						<ExpandMoreIcon />
					</IconButton>
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
							onClick={(e) => handleButtonClick('Move', e)}
							sx={{ flexGrow: 1, borderRadius: 0 }}
						>
							<Shuffle />
						</Button>
						<Button
							variant="contained"
							onClick={(e) => handleButtonClick('More', e)}
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
