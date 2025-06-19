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
import {
	Menu as MenuIcon,
	Add as AddIcon,
	Warning as AlertIcon,
	Download as ExportIcon,
	Home as HomeIcon,
	Settings as SettingsIcon,
	Person as PersonIcon,
	Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import AddPersonModal from './ActionModal/AddPersonModal';
import { getPerson } from '../../../clients/personsClient';
import type { Person } from '../../../types';

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
				console.error('Error fetching current user:', err);
				setError('Failed to load user information');
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
			setError('You do not have permission to access this menu');
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
			const token = localStorage.getItem('login_token');
			await axios.post(
				'/api/users/alert-all',
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
				}
			);

			// Invalidate and refetch person data to update the UI
			await queryClient.invalidateQueries({ queryKey: ['people'] });

			setDrawerOpen(false);
			console.log('All users alerted successfully');
		} catch (err: any) {
			console.error('Error alerting all users:', err);
			setError(err.response?.data || 'Failed to alert all users');
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
			setError(err.response?.data || 'Failed to export users');
		} finally {
			setLoading(false);
		}
	};

	const menuItems = [
		{
			text: 'Alert All Users',
			icon: <AlertIcon />,
			onClick: handleAlertAll,
			disabled: loading,
		},
		{
			text: 'Export Users',
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

						<Typography
							variant="h6"
							component="div"
							sx={{ flexGrow: 1, textAlign: 'center' }}
						>
							My App
						</Typography>

						<IconButton
							size="large"
							edge="end"
							color="inherit"
							aria-label="add person"
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
						<Typography variant="h6" sx={{ mb: 2 }}>
							Admin Menu
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
							>
								<ListItemIcon>{item.icon}</ListItemIcon>
								<ListItemText primary={item.text} />
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
					console.log('Person added successfully');
				}}
			/>
		</>
	);
};

export default TopBar;
