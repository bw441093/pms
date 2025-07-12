import React, { useState, type SyntheticEvent } from 'react';
import {
	Card,
	CardContent,
	Typography,
	Button,
	Box,
	Stack,
	IconButton,
} from '@mui/material';
import type { Person } from '../../../../types';
import ActionModal from './ActionModal/ActionModal';
import { hebrewLocationNames, hebrewSiteNames } from '~/consts';
import { useTheme } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import buildingIcon from '../../../../assets/icons/base.png';

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
};

interface PersonCardProps {
	person?: Person;
	isUser?: boolean;
	permissions?: { name: string; opts: string[] }[];
}

const PersonCard: React.FC<PersonCardProps> = ({
	person = defaultPerson,
	permissions,
}) => {
	const [openModal, setOpenModal] = useState(false);
	const [action, setAction] = useState('');
	const theme = useTheme();
	const {
		name,
		site,
		manager,
		location,
		reportStatus,
		updatedAt,
		transaction,
		alertStatus,
		personSystemRoles,
		serviceType,
	} = person;
	console.log(person);

	const handleButtonClick = (action: string, event: SyntheticEvent) => {
		event.stopPropagation();
		setAction(action);
		setOpenModal(true);
	};

	return (
		<Card
			elevation={0}
			sx={{
				width: '95%',
				bgcolor: theme.palette.custom.gray2,
				borderRadius: 5,
				border: `0.5px solid ${theme.palette.custom.gray5}`,
			}}
		>
			<CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, direction: 'rtl' }}>
				<Stack spacing={2}>
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
						width="105%"
					>
						<Stack
							direction="row"
							alignItems="center"
							sx={{
								flexWrap: 'nowrap',
								maxWidth: '60%'
							}}
						>
							<Box
								width={14}
								height={14}
								sx={{
									ml: 1.5,
									borderRadius: '50%',
									bgcolor: alertStatus !== 'good' || (transaction?.status !== 'resolved') ? theme.palette.custom.error : theme.palette.custom.success,
									minWidth: '14px',
									flexShrink: 0
								}}
							/>

							<Typography
								fontWeight={700}
								fontSize={24}
								sx={{
									whiteSpace: 'nowrap',
									overflow: 'hidden',
									textOverflow: 'ellipsis'
								}}
							>
								{name}
							</Typography>

						</Stack>

						<Stack direction="row" alignItems="center" spacing={1}>
							<Box
								bgcolor={theme.palette.custom.gray4}
								sx={{
									px: 2,
									py: 0.7,
									borderRadius: 3,
									display: 'flex',
									alignItems: 'center',
									minWidth: 'fit-content'
								}}
							>
								<Typography
									fontWeight={700}
									fontSize={17}
									color={theme.palette.custom.surfaceBright}
								>
									{reportStatus in hebrewLocationNames
										? hebrewLocationNames[reportStatus as keyof typeof hebrewLocationNames]
										: reportStatus}
								</Typography>
							</Box>
							<IconButton size="small" onClick={(e) => handleButtonClick('More', e)}>
								<MoreVertIcon />
							</IconButton>
						</Stack>
					</Stack>

					{/* Location info */}
					<Stack spacing={1}>
						<Stack direction="row" alignItems="center">
							<PersonIcon sx={{ color: theme.palette.custom.surfaceContainerHighest }} />
							<Typography sx={{ marginInlineStart: '2vw', color: theme.palette.custom.surfaceBright, fontWeight: 500, fontSize: 18 }}>
								{manager?.name}
							</Typography>
						</Stack>
						<Stack direction="row" alignItems="center">
							<LocationOnIcon sx={{ color: theme.palette.custom.surfaceContainerHighest }} />
							<Typography sx={{ marginInlineStart: '2vw', color: theme.palette.custom.surfaceBright, fontWeight: 500, fontSize: 18 }}>
								{location in hebrewLocationNames
									? hebrewLocationNames[location as keyof typeof hebrewLocationNames]
									: location}
							</Typography>
						</Stack>
						<Stack direction="row" alignItems="center">
							<Box
								component="img"
								src={buildingIcon}
								sx={{
									width: 21,
									height: 21,
									marginInlineEnd: '1vw',
									marginRight: '1vw',
									marginBottom: '0.7vh',
									verticalAlign: 'middle',
									filter: `brightness(0) saturate(100%) invert(${theme.palette.mode === 'dark' ? 1 : 0})`
								}}
							/>
							<Typography sx={{ marginInlineStart: '2vw', color: theme.palette.custom.surfaceBright, fontWeight: 500, fontSize: 18 }}>
								{site in hebrewSiteNames
									? hebrewSiteNames[site as keyof typeof hebrewSiteNames]
									: site}
							</Typography>
						</Stack>
					</Stack>

					{/* Action buttons */}
					<Stack
						direction="row"
						width='100%'
						sx={{
							gap: '1vw',
							'& > button': {
								flex: 1,
								minWidth: 0,
								boxShadow: 'none',
								py: 1,
								'&:hover': {
									boxShadow: 'none'
								}
							},
							'& > button:not(:last-child)': {
								marginInlineEnd: '4px'
							}
						}}
					>
						<Button
							variant="contained"
							onClick={(e) => handleButtonClick('Move', e)}
							sx={{
								borderRadius: 2,
								bgcolor: transaction?.status === 'pending' ? theme.palette.custom.error : theme.palette.custom.gray4,
								color: transaction?.status === 'pending' ? theme.palette.custom.gray1 : theme.palette.custom.surfaceBright,
								'&:hover': {
									bgcolor: theme.palette.custom.gray5
								},
								fontSize: 16,
								fontWeight: 500,
								textTransform: 'none'
							}}
						>
							שינוי אתר
						</Button>

						<Button
							variant="contained"
							onClick={(e) => handleButtonClick('Report', e)}
							sx={{
								borderRadius: 2,
								fontSize: 16,
								fontWeight: 500,
								textTransform: 'none'
							}}
						>
							שינוי דיווח
						</Button>
						<Button
							variant="contained"
							disabled={alertStatus === 'good'}
							onClick={(e) => handleButtonClick('Alert', e)}
							sx={{
								borderRadius: 2,
								bgcolor: alertStatus === 'good' ? theme.palette.custom.success : theme.palette.custom.error,
								color: theme.palette.custom.gray1,
								'&:hover': {
									bgcolor: theme.palette.custom.gray5
								},
								fontSize: 16,
								fontWeight: 500,
								textTransform: 'none'
							}}
						>
							נכס"ל
						</Button>
					</Stack>

					{/* Timestamp */}
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{
							fontSize: 12,
							textAlign: 'left',
							display: 'block'
						}}
					>
						{new Date(updatedAt).toLocaleDateString('he-IL', {
							day: '2-digit',
							month: '2-digit',
							year: 'numeric'
						}) + ' ' +
							new Date(updatedAt).toLocaleTimeString('he-IL', {
								hour: '2-digit',
								minute: '2-digit'
							})}
					</Typography>
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
