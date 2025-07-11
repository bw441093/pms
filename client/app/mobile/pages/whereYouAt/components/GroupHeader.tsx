import { Box, Typography, useTheme } from '@mui/material';
import type { Group } from '../../../../types';

interface GroupHeaderProps {
	group: Group;
}

export default function GroupHeader({ group }: GroupHeaderProps) {
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
                
			}}
		>
			<Typography
				variant="subtitle1"
				sx={{
					fontWeight: 'bold',
					color: group.command ? theme.palette.custom.gray13 : 'text.primary',
				}}
			>
				{group.name}
			</Typography>
		</Box>
	);
} 