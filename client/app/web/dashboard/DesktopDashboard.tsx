import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
	Box,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	IconButton,
	Stack,
	Card,
	CardContent,
	TextField,
	InputAdornment,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Alert,
	Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';
import HomeIcon from '@mui/icons-material/Home';
import WarningIcon from '@mui/icons-material/Warning';
import { useTheme } from '@mui/material/styles';
import { useQueryClient } from '@tanstack/react-query';
import type { Person } from '../../types';
import { hebrewLocationNames, hebrewSiteNames } from '../../consts';
import ActionModal from '../../mobile/pages/whereYouAt/components/ActionModal/ActionModal';
import AddPersonModal from '../../mobile/pages/whereYouAt/components/ActionModal/AddPersonModal';
import { handleAlertAll as alertAllUsers } from '../../utils/alertUtils';
import FilterModal from '../../utils/FilterModal';
import { applyFiltersAndSearch, type FilterOptions } from '../../utils/filterUtils';

interface DesktopDashboardProps {
	people: Person[];
	onSearch: (searchTerm: string) => void;
	onFiltersChange: (filters: FilterOptions) => void;
	initialFilters?: FilterOptions;
	permissions?: { name: string; opts: string[] }[];
}

const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
	people,
	onSearch,
	onFiltersChange,
	initialFilters,
	permissions,
}) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
	const [actionType, setActionType] = useState('');
	const [modalOpen, setModalOpen] = useState(false);
	const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
	const [filterModalOpen, setFilterModalOpen] = useState(false);
	const [filters, setFilters] = useState<FilterOptions>(initialFilters || {
		isManager: false,
		isSiteManager: false,
		isDirectManager: false,
	});
	const [alertConfirmOpen, setAlertConfirmOpen] = useState(false);
	const [alertLoading, setAlertLoading] = useState(false);
	const [alertMessage, setAlertMessage] = useState('');
	const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');

	const statistics = useMemo(() => {
		const total = people.length;
		const presentCount = people.filter(person => 
			person.reportStatus === 'present' || person.reportStatus === 'At Work'
		).length;
		const absentCount = people.filter(person => 
			person.reportStatus === 'absent' || person.reportStatus === 'At Home'
		).length;
		const onLeaveCount = people.filter(person => 
			person.reportStatus === 'on_leave' || person.reportStatus === 'On Vacation'
		).length;
		const lateCount = people.filter(person => 
			person.reportStatus === 'late'
		).length;
		const availableCount = people.filter(person =>
			person.alertStatus === 'good'
		).length;

		return {
			total,
			available: availableCount,
			availablePercentage: total > 0 ? Math.round((availableCount / total) * 100) : 0,
			present: presentCount,
			presentPercentage: total > 0 ? Math.round((presentCount / total) * 100) : 0,
			absent: absentCount,
			absentPercentage: total > 0 ? Math.round((absentCount / total) * 100) : 0,
			onLeave: onLeaveCount,
			onLeavePercentage: total > 0 ? Math.round((onLeaveCount / total) * 100) : 0,
			late: lateCount,
		};
	}, [people]);

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setSearchTerm(value);
		onSearch(value);
	};

	const handlePersonAction = (person: Person, action: string) => {
		setSelectedPerson(person);
		setActionType(action);
		setModalOpen(true);
	};

	const handleFilterClick = () => {
		setFilterModalOpen(true);
	};

	const handleFiltersChange = (newFilters: FilterOptions) => {
		setFilters(newFilters);
		onFiltersChange(newFilters);
	};

	const handleAlertAllClick = () => {
		setAlertConfirmOpen(true);
	};

	const handleAlertAllConfirm = async () => {
		setAlertLoading(true);
		setAlertConfirmOpen(false);
		
		const result = await alertAllUsers(queryClient);
		
		if (result.success) {
			setAlertMessage('התראה נשלחה בהצלחה לכל המשתמשים');
			setAlertSeverity('success');
		} else {
			setAlertMessage(result.error || 'אירעה שגיאה בשליחת ההתראה');
			setAlertSeverity('error');
		}
		
		setAlertLoading(false);
	};

	const handleAlertAllCancel = () => {
		setAlertConfirmOpen(false);
	};

	const handleAlertClose = () => {
		setAlertMessage('');
	};

	const getStatusColor = (reportStatus: string, alertStatus: string) => {
		if (alertStatus !== 'good') return theme.palette.custom.error;
		switch (reportStatus) {
			case 'present':
			case 'At Work':
				return theme.palette.custom.success;
			case 'absent':
			case 'At Home':
				return theme.palette.custom.gray5;
			case 'on_leave':
			case 'On Vacation':
				return theme.palette.custom.blue;
			case 'late':
				return theme.palette.custom.error;
			default:
				return theme.palette.custom.gray5;
		}
	};

	const StatCard = ({ title, value, percentage, color }: { 
		title: string; 
		value: number | string; 
		percentage?: number; 
		color: string;
	}) => (
		<Card sx={{ 
			flex: 1,
			backgroundColor: theme.palette.custom.gray1,
			border: `1px solid ${theme.palette.custom.gray5}`,
			borderRadius: 4,
			boxShadow: 'none',
		}}>
			<CardContent sx={{ textAlign: 'right', direction: 'rtl', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 1}}>
				<Typography 
					variant="body2" 
					color={theme.palette.custom.outline}
					sx={{ 
						fontSize: 14, 
						fontWeight: 500,
					}}
				>
					{title}
				</Typography>
				<Stack direction="row" alignItems="center" justifyContent="flex-start" gap={1}>
					<Typography 
						variant="h4" 
						sx={{ 
							fontWeight: 700, 
							fontSize: 32,
							color: theme.palette.custom.gray13,
						}}
					>
						{value}
					</Typography>
					{percentage !== undefined && (
						<Typography 
							variant="body2" 
							sx={{ 
								fontSize: 14, 
								fontWeight: 600,
								color: theme.palette.custom.surfaceContainerHighest,
								backgroundColor: color,
								px: 1.5,
								py: 0.5,
								borderRadius: 1,
								minWidth: 'fit-content',
							}}
						>
							{percentage}%
						</Typography>
					)}
				</Stack>
			</CardContent>
		</Card>
	);

	return (
		<Box sx={{ display: 'flex', backgroundColor: theme.palette.custom.gray1, minHeight: '100vh' }}>
			{/* Main Content */}
			<Box sx={{ flex: 1, backgroundColor: theme.palette.custom.gray1 }}>
				{/* Header */}
				<Box sx={{ 
					p: 3, 
					pb: 1,
					borderBottom: `1px solid ${theme.palette.custom.gray5}`,
				}}>
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
		
							<Button
								startIcon={<PersonAddIcon />}
								variant="outlined"
								onClick={() => setAddPersonModalOpen(true)}
								sx={{ 
									borderRadius: 2,
									borderColor: theme.palette.custom.gray5,
									color: theme.palette.custom.gray13,
									'&:hover': {
										borderColor: theme.palette.custom.gray13,
										backgroundColor: theme.palette.custom.gray2,
									}
								}}
							>
								הוסף משתמש
							</Button>
						<Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.custom.gray13 }}>
							שליטה בכח אדם
						</Typography>
					</Stack>

					{/* Statistics Cards Row */}
					<Stack direction="row" spacing={2} sx={{ mb: 2 }}>
						<StatCard 
							title="סה״כ אנשים" 
							value={statistics.total} 
							color={theme.palette.custom.gray13}
						/>
						<StatCard 
							title="אנשים שדיווחו" 
							value={statistics.present}
							percentage={statistics.presentPercentage}
							color={theme.palette.custom.paleGreen}
						/>
						<StatCard 
							title="אנשים שלא דיווחו" 
							value={statistics.absent} 
							percentage={statistics.absentPercentage}
							color={theme.palette.custom.paleRed}
						/>
						<StatCard 
							title="אנשים במעבר אחר" 
							value={statistics.late} 
							percentage={10}
							color={theme.palette.custom.paleYellow}
						/>
						<StatCard 
							title="נכס״ל" 
							value={`${statistics.available}/${statistics.total}`} 
							percentage={statistics.availablePercentage}
							color={theme.palette.custom.paleGreen}
						/>
					</Stack>
				</Box>

				{/* Content Area */}
				<Box sx={{ p: 3 }}>

							{/* Search and Filters */}
				<Stack direction="row" sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
					<Button
						startIcon={<WarningIcon />}
						variant="contained"
						onClick={handleAlertAllClick}
						disabled={alertLoading}
						sx={{ 
							borderRadius: 2,
							backgroundColor: theme.palette.custom.error,
							color: 'white',
							'&:hover': {
								backgroundColor: '#d32f2f',
							},
							'&:disabled': {
								backgroundColor: theme.palette.custom.gray5,
							}
						}}
					>
						הפעל נכס״ל
					</Button>
					
					<Stack direction="row" spacing={2}>
					<IconButton
							onClick={handleFilterClick}
							sx={{ borderRadius: 2, backgroundColor: theme.palette.custom.gray4, color: theme.palette.custom.surfaceContainerHighest}}
						>
							<FilterListIcon />
						</IconButton>
						<TextField
							dir="rtl"
							placeholder="חפש משתמשים..."
							value={searchTerm}
							onChange={handleSearch}
							size="small"
							sx={{ 
								minWidth: 300,
								'& .MuiOutlinedInput-root': {
									backgroundColor: theme.palette.custom.gray4,
									borderRadius: 2,
									border: 'none',
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
							}}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<SearchIcon />
									</InputAdornment>
								),
							}}
						/>

					</Stack>
				</Stack>





			{/* Data Table */}
			<TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.gray5}` }}>
				<Table>
					<TableHead sx={{ backgroundColor: theme.palette.custom.gray3 }}>
						<TableRow>
							<TableCell align="right" sx={{ fontWeight: 700 }}>סטטוס</TableCell>
							<TableCell align="right" sx={{ fontWeight: 700 }}>מיקום נכחי</TableCell>
							<TableCell align="right" sx={{ fontWeight: 700 }}>אתר ראשי</TableCell>
							<TableCell align="right" sx={{ fontWeight: 700 }}>מפקד</TableCell>
							<TableCell align="right" sx={{ fontWeight: 700 }}>שם</TableCell>
							<TableCell align="center" sx={{ fontWeight: 700, width: 60 }}></TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{people.map((person) => (
							<TableRow 
								key={person.id}
								hover
								sx={{ 
									'&:nth-of-type(odd)': { 
										backgroundColor: theme.palette.custom.gray2 
									},
									cursor: 'pointer',
								}}
							>
								<TableCell align="right">
									<Stack direction="row" alignItems="center" spacing={1}>
										<Box
											width={12}
											height={12}
											sx={{
												borderRadius: '50%',
												backgroundColor: getStatusColor(person.reportStatus, person.alertStatus),
											}}
										/>
										<Chip
											label={hebrewLocationNames[person.reportStatus as keyof typeof hebrewLocationNames] || person.reportStatus}
											size="small"
											sx={{
												backgroundColor: `${getStatusColor(person.reportStatus, person.alertStatus)}20`,
												color: getStatusColor(person.reportStatus, person.alertStatus),
												fontWeight: 600,
											}}
										/>
									</Stack>
								</TableCell>
								<TableCell align="right">
									<Chip
										label={hebrewLocationNames[person.location as keyof typeof hebrewLocationNames] || person.location}
										size="small"
										variant="outlined"
									/>
								</TableCell>
								<TableCell align="right">
									<Typography sx={{ fontWeight: 500 }}>
										{hebrewSiteNames[person.site] || person.site}
									</Typography>
								</TableCell>
								<TableCell align="right">
									<Typography sx={{ fontWeight: 500 }}>
										{person.manager?.name || 'לא משויך'}
									</Typography>
								</TableCell>
								<TableCell align="right">
									<Typography sx={{ fontWeight: 700, fontSize: 16 }}>
										{person.name}
									</Typography>
								</TableCell>
								<TableCell align="center">
									<IconButton 
										size="small"
										onClick={() => handlePersonAction(person, 'More')}
									>
										<MoreVertIcon />
									</IconButton>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>



			{/* Action Modal */}
			{selectedPerson && (
				<ActionModal
					person={selectedPerson}
					action={actionType}
					openModal={modalOpen}
					onClose={() => {
						setModalOpen(false);
						setSelectedPerson(null);
						setActionType('');
					}}
				/>
			)}

				{/* Add Person Modal */}
				<AddPersonModal 
					open={addPersonModalOpen}
					onClose={() => setAddPersonModalOpen(false)}
				/>
				</Box>
			</Box>

			{/* Navigation Sidebar */}
			<Box sx={{ 
				width: 280, 
				backgroundColor: theme.palette.custom.gray4, 
				borderLeft: `1px solid ${theme.palette.custom.gray5}`,
				display: 'flex',
				flexDirection: 'column',
			}}>
				{/* App Title */}
				<Box sx={{ 
					p: 3, 
					textAlign: 'center',
					borderBottom: `1px solid ${theme.palette.custom.gray5}`,
					backgroundColor: theme.palette.custom.gray3,
				}}>
					<Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.custom.gray13 }}>
						לוזינט
					</Typography>
				</Box>

				{/* Navigation Items */}
				<Box sx={{ flex: 1, p: 2 }}>
					<Stack spacing={1}>
						<Box
							onClick={() => navigate('/dashboard')}
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'flex-end',
								p: 1,
								pr: 2,
								gap: 1,
								borderRadius: 2,
								backgroundColor: theme.palette.custom.gray5,
								cursor: 'pointer',
								'&:hover': {
									backgroundColor: theme.palette.custom.gray5,
								},
								'&:active': {
									backgroundColor: theme.palette.custom.gray5,
								},
							}}
						>
							<Typography sx={{ fontWeight: 500, fontSize: 16 }}>
								שליטה בכח אדם
							</Typography>
							<GroupsIcon sx={{ color: theme.palette.custom.gray13, fontSize: 18 }} />
						</Box>

						{/* Duties/Shifts */}
						<Box
							onClick={() => navigate('/archive')}
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'flex-end',
								p: 1,
								pr: 2,
								gap: 1,
								borderRadius: 2,
								cursor: 'pointer',
								'&:hover': {
									backgroundColor: theme.palette.custom.gray5,
								},
								'&:active': {
									backgroundColor: theme.palette.custom.gray5,
								},
							}}
						>
							<Typography sx={{ fontWeight: 600, fontSize: 16 }}>
								תורניות
							</Typography>
							<ListAltIcon sx={{ color: theme.palette.custom.surfaceContainerHighest }} />
						</Box>

						{/* Calendar */}
						<Box
							onClick={() => navigate('/calendar')}
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'flex-end',
								p: 1,
								pr: 2,
								gap: 1,
								borderRadius: 2,
								cursor: 'pointer',
								'&:hover': {
									backgroundColor: theme.palette.custom.gray5,
								},
								'&:selected': {
									backgroundColor: theme.palette.custom.gray5,
								},
							}}
						>
							<Typography sx={{ fontWeight: 600, fontSize: 16 }}>
								לוח שנה
							</Typography>
							<CalendarMonthIcon sx={{ color: theme.palette.custom.surfaceContainerHighest }} />
						</Box>
					</Stack>
				</Box>
			</Box>

			{/* Alert Confirmation Dialog */}
			<Dialog
				open={alertConfirmOpen}
				onClose={handleAlertAllCancel}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle sx={{ textAlign: 'right', fontWeight: 700 }}>
					אישור שליחת התראה
				</DialogTitle>
				<DialogContent sx={{ textAlign: 'right' }}>
					<Typography>
						האם אתה בטוח שברצונך לשלוח התראה לכל המשתמשים במערכת?
					</Typography>
					<Typography sx={{ mt: 2, color: theme.palette.custom.outline }}>
						פעולה זו תשלח הודעה לכל המשתמשים הרשומים במערכת ותבקש מהם לעדכן את סטטוס הדיווח שלהם.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ p: 2, gap: 1 }}>
					<Button 
						onClick={handleAlertAllCancel}
						sx={{ 
							borderRadius: 2,
							color: theme.palette.custom.gray13,
						}}
					>
						ביטול
					</Button>
					<Button 
						onClick={handleAlertAllConfirm}
						variant="contained"
						disabled={alertLoading}
						sx={{ 
							borderRadius: 2,
							backgroundColor: theme.palette.custom.error,
							'&:hover': {
								backgroundColor: '#d32f2f',
							}
						}}
					>
						{alertLoading ? 'שולח...' : 'אישור'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Alert Snackbar */}
			<Snackbar
				open={!!alertMessage}
				autoHideDuration={6000}
				onClose={handleAlertClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			>
				<Alert 
					severity={alertSeverity} 
					onClose={handleAlertClose}
					sx={{ borderRadius: 2 }}
				>
					{alertMessage}
				</Alert>
			</Snackbar>

			{/* Filter Modal */}
			<FilterModal
				open={filterModalOpen}
				onClose={() => setFilterModalOpen(false)}
				filters={filters}
				onFiltersChange={handleFiltersChange}
			/>
		</Box>
	);
};

export default DesktopDashboard; 