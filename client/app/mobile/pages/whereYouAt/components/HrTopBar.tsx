import { useNavigate } from 'react-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	AppBar,
	Toolbar,
	IconButton,
	Typography,
	Box,
	Stack,
	Alert,
	TextField,
	InputAdornment,
	Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import AddPersonModal from './ActionModal/AddPersonModal';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTheme } from '@mui/material/styles';
import debounce from 'lodash/debounce';
import FilterModal from '../../../../utils/FilterModal';
import { useAtomValue } from 'jotai';
import { userAtom } from '../../../../atoms/userAtom';
import type { FilterOptions } from '../../../../utils/filterUtils';

interface TopBarProps {
	onSearch: (searchTerm: string) => void;
	onFiltersChange: (filters: FilterOptions) => void;
	initialFilters?: FilterOptions;
}

const HrTopBar = ({ onSearch, onFiltersChange, initialFilters }: TopBarProps) => {
	const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
	const [filterModalOpen, setFilterModalOpen] = useState(false);
	const [filters, setFilters] = useState<FilterOptions>(initialFilters || {
		isManager: false,
		isSiteManager: false,
		isDirectManager: false,
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

	const debouncedSearch = useCallback(
		debounce((term: string) => {
			onSearch(term);
		}, 300),
		[onSearch]
	);

	useEffect(() => {
		if (initialFilters) {
			setFilters(initialFilters);
		}
	}, [initialFilters]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsStuck(!entry.isIntersecting);
			},
			{
				threshold: 1,
				rootMargin: '-10px 0px 0px 0px' // Trigger when exactly at top
			}
		);

		if (searchBarRef.current) {
			observer.observe(searchBarRef.current);
		}

		return () => observer.disconnect();
	}, []);

	const handleAddPersonOpen = () => setAddPersonModalOpen(true);
	const handleAddPersonClose = () => setAddPersonModalOpen(false);

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

	const handleFiltersChange = (newFilters: FilterOptions) => {
		setFilters(newFilters);
		onFiltersChange(newFilters);
	};

	return (
		<>

				<Stack 
					direction="row" 
					alignItems="center"
					justifyContent="space-between"
					bgcolor={theme.palette.custom.gray4}
					sx={{ 
						borderRadius: '10px',
						padding: '10px 16px',
						width: '86vw',
						height: '100%',
						marginTop: '1vh !important'
					}}
				>
										<Box 
						sx={{ 
							backgroundColor: '#000',
							borderRadius: '5px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: '24px',
							height: '24px',
						}}
					>
						<IconButton
							size="small"
							aria-label="הוסף משתמש"
							onClick={handleAddPersonOpen}
							sx={{ 
								color: 'white',
							}}
						>
							<AddIcon sx={{ fontSize: '17px' }} />
						</IconButton>
					</Box>
					<Typography
						variant="h6"
						component="div"
						sx={{ 
							color: '#000',
							fontWeight: 600,
							fontSize: '16px',
						}}
					>
						שליטה בכח אדם
					</Typography>


				</Stack>

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

			{/* Add Person Modal */}
			<AddPersonModal
				open={addPersonModalOpen}
				onClose={handleAddPersonClose}
				onSuccess={() => {
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

			<div ref={searchBarRef} style={{ height: '32px', width: '100%', margin: 0, padding: 0 }} />

			<Stack
				direction="row"
				alignItems="center"
				spacing={2}
				width="93%"
				sx={{
					position: 'sticky',
					top: 0,
					zIndex: 1000,
					height: isStuck ? '5vh' : '1vh',
					backgroundColor: isStuck ? theme.palette.custom.gray1 : 'transparent',
					borderBottom: isStuck ? '1.5px solid' : 'none',
					py: 1,
					mx: 'auto',
					mt: -1,
					mb: '2vh',
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
						padding: '10px',
						'&:hover': {
							backgroundColor: theme.palette.custom.gray5,
						},
					}}
				>
					<FilterListIcon sx={{ color: theme.palette.custom.surfaceBright, fontSize: '20px' }} />
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
						size="small"
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
								padding: '10px 12px',
								'&::placeholder': {
									color: theme.palette.custom.outlineVariant,
									opacity: 1,
								},
							},
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ color: theme.palette.custom.outlineVariant, fontSize: '20px', mr: 1 }} />
								</InputAdornment>
							),
						}}
					/>
				</Box>
			</Stack>
		</>
	);
};

export default HrTopBar;
