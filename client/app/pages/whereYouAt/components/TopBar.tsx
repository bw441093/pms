import React, { useState, useEffect } from 'react';
import {
	AppBar,
	Toolbar,
	IconButton,
	Typography,
	Drawer,
	List,
	ListItemIcon,
	ListItemText,
	Box,
	Divider,
	ListItemButton,
	Stack,
	Alert,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import AlertIcon from '@mui/icons-material/Warning';
import ExportIcon from '@mui/icons-material/Download';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import AddPersonModal from './ActionModal/AddPersonModal';
import { getPerson } from '../../../clients/personsClient';
import type { Person } from '../../../types';
import LogoutButton from '~/pages/logout/logout';

const TopBar = () => {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
	const [currentUser, setCurrentUser] = useState<Person | null>(null);
	const [userLoading, setUserLoading] = useState(true);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const queryClient = useQueryClient();

	// Get current user's information for authorization
	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				const userId = localStorage.getItem('login_token');
				if (userId) {
					const user = await getPerson(userId);
					setCurrentUser(user);
				}
			} catch (err) {
				console.error('שגיאה בשליפת פרטי המשתמש', err);
				setError('אירעה שגיאה בטעינת פרטי המשתמש');
			} finally {
				setUserLoading(false);
			}
		};

		fetchCurrentUser();
	}, []);

	const hasAdminAccess = () => {
		if (!currentUser?.personRoles) return false;
		const userRoles = currentUser.personRoles.map((pr) => pr.role.name);
		return userRoles.includes('hrManager') || userRoles.includes('admin');
	};

	const toggleDrawer = (open: Boolean) => {
		if (open && !hasAdminAccess()) {
			setError('אין לך הרשאה לגשת לתפריט הזה');
			return;
		}
		setDrawerOpen(!!open);
		setError(''); // Clear any previous errors
	};

	const handleAddPersonOpen = () => setAddPersonModalOpen(true);
	const handleAddPersonClose = () => setAddPersonModalOpen(false);

	const handleAlertAll = async () => {
		setLoading(true);
		setError('');

		try {
			await axios.post('/api/users/alert-all');

			// Invalidate and refetch person data to update the UI
			await queryClient.invalidateQueries({ queryKey: ['people'] });

			setDrawerOpen(false);
			console.log('All users alerted successfully');
		} catch (err: any) {
			console.error('Error alerting all users:', err);
			setError(err.response?.data || 'נכשל ניסיון לשלוח התראה לכל המשתמשים');
		} finally {
			setLoading(false);
		}
	};

	const handleExport = async () => {
		setLoading(true);
		setError('');

		try {
			const token = localStorage.getItem('login_token');
			const response = await axios.get('/api/export', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
				responseType: 'blob', // Important for file download
			});

			// Create download link
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', 'users-export.xlsx');
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);

			setDrawerOpen(false);
		} catch (err: any) {
			console.error('Error exporting users:', err);
			setError(err.response?.data || 'אירעה שגיאה בעת ייצוא המשתמשים');
		} finally {
			setLoading(false);
		}
	};

	const menuItems = [
		{
			text: 'שלח התראה לכולם',
			icon: <AlertIcon />,
			onClick: handleAlertAll,
			disabled: loading,
		},
		{
			text: 'ייצוא משתמשים',
			icon: <ExportIcon />,
			onClick: handleExport,
			disabled: loading,
		},
	];

	return (
		<>
			<AppBar position="static">
				<Toolbar>
					<Stack direction="row" alignItems="center" flexGrow="1">
						<IconButton
							size="large"
							edge="start"
							color="inherit"
							aria-label="menu"
							onClick={() => toggleDrawer(!drawerOpen)}
							disabled={userLoading}
						>
							<MenuIcon />
						</IconButton>

						<LogoutButton />

						<Typography
							variant="h6"
							component="div"
							sx={{ flexGrow: 1, textAlign: 'center' }}
						>
							?איפה אתה נמצא
						</Typography>

						<IconButton
							size="large"
							edge="end"
							color="inherit"
							aria-label="הוסף משתמש"
							onClick={handleAddPersonOpen}
						>
							<AddIcon />
						</IconButton>
					</Stack>
				</Toolbar>
			</AppBar>

			{/* Error Alert */}
			{error && (
				<Alert
					severity="error"
					sx={{
						position: 'fixed',
						top: 70,
						left: '50%',
						transform: 'translateX(-50%)',
						zIndex: 9999,
						minWidth: 300,
					}}
					onClose={() => setError('')}
				>
					{error}
				</Alert>
			)}

			{/* Drawer */}
			<Drawer
				anchor="left"
				open={drawerOpen}
				onClose={() => {
					toggleDrawer(false);
				}}
			>
				<Box
					sx={{ width: 250 }}
					role="presentation"
					onClick={() => {
						// Don't close drawer on click, let individual items handle it
					}}
					onKeyDown={() => {
						toggleDrawer(false);
					}}
				>
					<Box sx={{ p: 2 }}>
						<Typography variant="h6" sx={{ mb: 2, textAlign: 'right' }}>
							תפריט מנהלים
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ mb: 2, textAlign: 'right' }}
						>
							{currentUser?.name}
						</Typography>
					</Box>
					<Divider />
					<List>
						{menuItems.map((item) => (
							<ListItemButton
								key={item.text}
								onClick={item.onClick}
								disabled={item.disabled}
								sx={{ flexDirection: 'row-reverse' }}
							>
								<ListItemIcon
									sx={{ minWidth: 'auto', marginRight: 0, marginLeft: 2 }}
								>
									{item.icon}
								</ListItemIcon>
								<ListItemText primary={item.text} sx={{ textAlign: 'right' }} />
							</ListItemButton>
						))}
					</List>
				</Box>
			</Drawer>

			{/* Add Person Modal */}
			<AddPersonModal
				open={addPersonModalOpen}
				onClose={handleAddPersonClose}
				onSuccess={() => {
					// You can add a callback here to refresh the person list
					console.log('המשתמש נוסף בהצלחה');
				}}
			/>
		</>
	);
};

export default TopBar;
