import { useNavigate } from 'react-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
	TextField,
	InputAdornment,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import AlertIcon from '@mui/icons-material/Warning';
import ArchiveIcon from '@mui/icons-material/Archive';
import ExportIcon from '@mui/icons-material/Download';
import LogoutIcon from '@mui/icons-material/Logout';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import AddPersonModal from './ActionModal/AddPersonModal';
import { getPerson } from '../../../clients/personsClient';
import type { Person } from '../../../types';
import LogoutButton from '~/pages/logout/logout';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTheme } from '@mui/material/styles';
import debounce from 'lodash/debounce';
import FilterModal from './ActionModal/FilterModal';
import { useAtomValue } from 'jotai';
import { userAtom, hasAdminAccessAtom } from '../../../atoms/userAtom';

interface TopBarProps {
	onSearch: (searchTerm: string) => void;
	onFiltersChange: (filters: { isManager: boolean; isSiteManager: boolean }) => void;
}

const TopBar = ({ onSearch, onFiltersChange }: TopBarProps) => {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
	const [filterModalOpen, setFilterModalOpen] = useState(false);
	const [filters, setFilters] = useState({
		isManager: false,
		isSiteManager: false,
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const theme = useTheme();
	const [searchValue, setSearchValue] = useState('');
	const [isStuck, setIsStuck] = useState(false);
	const searchBarRef = useRef<HTMLDivElement>(null);

	const currentUser = useAtomValue(userAtom);
	const hasAdminAccess = useAtomValue(hasAdminAccessAtom);

	// Debounce the search callback
	const debouncedSearch = useCallback(
		debounce((term: string) => {
			onSearch(term);
		}, 300),
		[onSearch]
	);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsStuck(!entry.isIntersecting);
			},
			{
				threshold: 0,
				rootMargin: '-1px 0px 0px 0px' // Trigger when exactly at top
			}
		);

		if (searchBarRef.current) {
			observer.observe(searchBarRef.current);
		}

		return () => observer.disconnect();
	}, []);

	const toggleDrawer = (open: Boolean) => {
		if (open && !hasAdminAccess) {
			setError('אין לך הרשאה לגשת לתפריט הזה');
			return;
		}
		setDrawerOpen(!!open);
		setError('');
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

	const handleArchive = () => {
		navigate('/archive');
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.value;
		setSearchValue(newValue);
		debouncedSearch(newValue);
	};

	const handleFilterClick = () => {
		setFilterModalOpen(true);
	};

	const handleFilterClose = () => {
		setFilterModalOpen(false);
	};

	const handleFiltersChange = (newFilters: { isManager: boolean; isSiteManager: boolean }) => {
		setFilters(newFilters);
		onFiltersChange(newFilters);
	};

	const handleLogout = () => {
		localStorage.removeItem('login_token');
		navigate('/login', { replace: true });
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
		{
			text: 'ארכיון',
			icon: <ArchiveIcon />,
			onClick: handleArchive,
			disabled: loading,
		},
		{
			text: 'התנתקות',
			icon: <LogoutIcon />,
			onClick: handleLogout,
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
							disabled={!currentUser}
						>
							<MenuIcon />
						</IconButton>

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

			{/* Filter Modal */}
			<FilterModal
				open={filterModalOpen}
				onClose={handleFilterClose}
				filters={filters}
				onFiltersChange={handleFiltersChange}
			/>

			<div ref={searchBarRef} style={{ height: '1px', width: '100%', margin: 0, padding: 0 }} />

			<Stack
				direction="row"
				alignItems="center"
				spacing={2}
				width="93%"
				sx={{
					position: 'sticky',
					top: 0,
					zIndex: 1000,
					backgroundColor: isStuck ? theme.palette.custom.surfaceContainerLow : 'transparent',
					py: isStuck ? 2 : 0,
					mx: 'auto',
					mt: -1,
					borderColor: 'divider',
					transition: 'all 0.1s ease-in-out',
				}}
				px={2}
			>
				<IconButton
					onClick={handleFilterClick}
					sx={{
						backgroundColor: theme.palette.custom.gray4,
						borderRadius: 2,
						padding: '12px',
						'&:hover': {
							backgroundColor: theme.palette.custom.gray5,
						},
					}}
				>
					<FilterListIcon sx={{ color: theme.palette.custom.surfaceBright }} />
				</IconButton>
				<Box
					sx={{
						flex: 1,
						position: 'relative',
					}}
				>
					<TextField
						dir="rtl"
						fullWidth
						placeholder="חפש אנשים..."
						value={searchValue}
						onChange={handleSearchChange}
						sx={{
							'& .MuiOutlinedInput-root': {
								backgroundColor: theme.palette.custom.gray4,
								borderRadius: 3,
								'& fieldset': {
									border: 'none',
								},
								'&:hover fieldset': {
									border: 'none',
								},
								'&.Mui-focused fieldset': {
									border: 'none',
								},
							},
							'& .MuiInputBase-input': {
								color: theme.palette.custom.surfaceBright,
								'&::placeholder': {
									color: theme.palette.custom.outlineVariant,
									opacity: 1,
								},
							},
						}}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon sx={{ color: theme.palette.custom.outlineVariant }} />
									</InputAdornment>
								),
							},
						}}
					/>
				</Box>
			</Stack>
		</>
	);
};

export default TopBar;
