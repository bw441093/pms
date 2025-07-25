import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { useTheme } from '@mui/material/styles';
import { useAtomValue } from 'jotai';
import { hasAdminAccessAtom } from '../../../atoms/userAtom';
import { useNavBar } from '../../../contexts/NavBarContext';

export default function BottomNavBar() {
	const location = useLocation();
	const navigate = useNavigate();
	const theme = useTheme();
	const hasAdminAccess = useAtomValue(hasAdminAccessAtom);
	const { showNavBar } = useNavBar();

	if (!showNavBar) {
		return null;
	}

	return (
		<Paper
			sx={{
				position: 'fixed',
				bottom: 40,
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
					icon={location.pathname === "/calendar" ? <CalendarMonthIcon /> : <CalendarMonthOutlinedIcon />}
				/>
				{hasAdminAccess && (
					<BottomNavigationAction
						value="/"
						icon={location.pathname === "/" ? <HomeIcon /> : <HomeOutlinedIcon />}
					/>
				)}
				<BottomNavigationAction
					value="/profile"
					icon={location.pathname === "/profile" ? <PersonIcon /> : <PersonOutlinedIcon />}
				/>
			</BottomNavigation>
		</Paper>
	);
} 