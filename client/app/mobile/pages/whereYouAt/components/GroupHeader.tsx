import { Box, Typography, useTheme, IconButton, Chip, Stack } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import type { Group, Person } from '../../../../types';
import { hebrewSiteNames } from '~/consts';

interface GroupHeaderProps {
	group: Group;
	collapsed: boolean;
	onToggleCollapse: () => void;
	representativePerson?: Person;
}

export default function GroupHeader({ group, collapsed, onToggleCollapse, representativePerson }: GroupHeaderProps) {
	const theme = useTheme();
	return (
		<Box
			sx={{
				position: 'sticky',
				top: '7vh', // Below the search bar
				zIndex: 10,
				width: '100%',
				backgroundColor: 'background.paper',
				borderBottom: '1px solid',
				borderColor: theme.palette.custom.outlineVariant,
				px: 10,
				py: 1.2,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
			}}
		>
			<Stack direction="row" alignItems="center" spacing={1}>
				{representativePerson?.manager?.name && (
					<Chip
						label={representativePerson.manager.name}
						icon={<PersonIcon />}
						size="small"
						sx={{ bgcolor: theme.palette.custom.gray4, fontWeight: 500, px: 1, py: 1.7, ml: 1 }}
					/>
				)}
				{group.isLeafGroup && representativePerson?.site && (
					<Chip
						label={hebrewSiteNames[representativePerson.site] || representativePerson.site}
						icon={<LocationCityIcon />}
						size="small"
						sx={{ bgcolor: theme.palette.custom.gray4, fontWeight: 500, px: 1, py: 1.7 }}
					/>
				)}
			</Stack>
			<Stack direction="row" alignItems="center">
				<Typography
					variant="subtitle1"
					sx={{
						fontWeight: 'bold',
						color: group.command ? theme.palette.custom.gray13 : 'text.primary',
						maxWidth: 100,
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{group.name}
				</Typography>
				<IconButton onClick={onToggleCollapse} size="small" aria-label={collapsed ? 'Expand group' : 'Collapse group'}>
					{collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
				</IconButton>
			</Stack>

		</Box>
	);
} 