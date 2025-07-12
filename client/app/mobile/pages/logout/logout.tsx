import { Stack, Typography } from '@mui/material';
import { IconButton } from '@mui/material';
import { useNavigate } from 'react-router';
import LogoutIcon from '@mui/icons-material/Logout';

export default function LogoutButton() {
	const navigate = useNavigate();

	const handleLogout = () => {
		localStorage.removeItem('login_token');
		navigate('/login', { replace: true });
	};

	return (
		<IconButton
			color="inherit"
			onClick={handleLogout}
			aria-label="התנתקות"
		>
			<Stack direction="row" spacing={1} alignItems="center">
				<LogoutIcon />
				<Typography>התנתקות</Typography>
			</Stack>
		</IconButton>
	);
}
