import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import { useTheme } from '@mui/material/styles';

export default function BottomNavBar() {
	const location = useLocation();
	const navigate = useNavigate();
	const theme = useTheme();

	return (
		<Paper
			sx={{
				position: 'fixed',
				bottom: 16,
				left: '50%',
				transform: 'translateX(-50%)',
				width: '90%',
				maxWidth: 400,
				borderRadius: 3,
				zIndex: 1000,
				boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
				backgroundColor: theme.palette.custom.gray1,
        border: '1px solid',
        borderColor: theme.palette.custom.gray5,
			}}
			elevation={3}
		>
			<BottomNavigation
				value={location.pathname}
				onChange={(_, newValue) => {
					navigate(newValue);
				}}
				sx={{
					borderRadius: 3,
					height: 56,
					backgroundColor: 'transparent',
					'& .Mui-selected': {
						color: `${theme.palette.custom.surfaceContainerLow} !important`,
					},
					'& .MuiBottomNavigationAction-root': {
						color: theme.palette.custom.outlineVariant,
					},
				}}
			>
				<BottomNavigationAction
					value="/calendar"
					icon={<CalendarMonthIcon />}
				/>
				<BottomNavigationAction
					value="/"
					icon={<HomeIcon />}
				/>
				<BottomNavigationAction
					value="/profile"
					icon={<PersonIcon />}
				/>
			</BottomNavigation>
		</Paper>
	);
} 