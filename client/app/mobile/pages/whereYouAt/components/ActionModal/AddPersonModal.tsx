import React, { useState, useEffect } from 'react';
import {
	Box,
	Button,
	TextField,
	Typography,
	IconButton,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Checkbox,
	FormControlLabel,
	FormGroup,
	Stack,
	Alert,
	Modal,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

import {
	hebrewSiteNames,
	SITE_OPTIONS,
	SITE_MANAGER_OPTIONS,
	SYSTEM_ROLE_OPTIONS,
	hebrewSystemRoleNames,
	SERVICE_TYPE_OPTIONS,
	hebrewServiceTypeNames,
} from '~/consts';
import { useAddNewPerson } from '~/hooks/useQueries';

interface Manager {
	userId: string;
	name: string;
	site: string;
	groupName: string;
	groupId: string;
}

interface Group {
	groupId: string;
	name: string;
	command: boolean;
}

interface AddPersonModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

const AddPersonModal: React.FC<AddPersonModalProps> = ({
	open,
	onClose,
	onSuccess,
}) => {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		commander: '',
		site: '',
		roles: [] as string[],
		serviceType: 'hova',
		siteManagerSite: '', // New field for site manager's specific site
		availableGroups: [] as Group[],
		selectedGroupId: '', // New field for personnelManager group selection
		newGroupName: '', // New field for personnelManager new group creation
	});
	const [managers, setManagers] = useState<Manager[]>([]);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	// Fetch managers when modal opens
	useEffect(() => {
		if (managers.length === 0) {
			fetchManagers();
		}
	}, [managers.length]);

	// Fetch available groups when manager changes (for personnelManager role)
	useEffect(() => {
		if (formData.roles.includes('personnelManager')) {
			fetchAvailableGroups();
		}
	}, [formData.roles]);

	const fetchManagers = async () => {
		try {
			setLoading(true);
			const response = await axios.get('/api/users/managers', {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('login_token')}`,
				},
			});
			setManagers(response.data);
		} catch (err) {
			console.error('Error fetching managers:', err);
			setError('Failed to load managers');
		} finally {
			setLoading(false);
		}
	};

	const fetchAvailableGroups = async () => {
		try {
			const managerId = 'none'; // Use 'none' for no manager
			const response = await axios.get(`/api/groups/subordinate-command-groups/${managerId}`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('login_token')}`,
				},
			});
			setFormData(prev => ({ ...prev, availableGroups: response.data }));
		} catch (err) {
			console.error('Error fetching available groups:', err);
			setError('Failed to load available groups');
		}
	};

	const addNewPersonMutation = useAddNewPerson();

	const handleInputChange = (field: string, value: string | string[]) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleRoleChange = (role: string) => {
		const newRoles = formData.roles.includes(role)
			? formData.roles.filter(r => r !== role)
			: [...formData.roles, role];

		setFormData(prev => {
			// Clear siteManagerSite if siteManager role is removed
			const newSiteManagerSite = newRoles.includes('siteManager')
				? prev.siteManagerSite
				: '';

			// Clear group fields if personnelManager role is removed
			const newSelectedGroupId = newRoles.includes('personnelManager')
				? prev.selectedGroupId
				: '';
			const newNewGroupName = newRoles.includes('personnelManager')
				? prev.newGroupName
				: '';

			return {
				...prev,
				roles: newRoles,
				siteManagerSite: newSiteManagerSite,
				selectedGroupId: newSelectedGroupId,
				newGroupName: newNewGroupName,
			};
		});
	};

	const handleSubmit = async () => {
		setError('');

		if (!formData.name || !formData.email || !formData.site) {
			setError('נא למלא את כל השדות הנדרשים');
			return;
		}

		// Check if siteManager role is selected but no site is chosen
		if (formData.roles.includes('siteManager') && !formData.siteManagerSite) {
			setError('נא לבחור אתר עבור מנהל אתר');
			return;
		}

		// Check if personnelManager role is selected but no group selection or new group name
		if (formData.roles.includes('personnelManager')) {
			if (!formData.selectedGroupId && !formData.newGroupName) {
				setError('נא לבחור קבוצה קיימת או להזין שם קבוצה חדשה עבור מנהל כוח אדם');
				return;
			}
			if (formData.selectedGroupId && formData.newGroupName) {
				setError('נא לבחור קבוצה קיימת או להזין שם קבוצה חדשה, לא שניהם');
				return;
			}
		}

		try {
			setLoading(true);
			
			// Create system roles array with proper structure
			const systemRoles = formData.roles.
				filter(role => SYSTEM_ROLE_OPTIONS.includes(role as any))
				.map(role => ({
					name: role,
					opts: [],
				}));

			// Only include group fields if personnelManager role is selected
			const groupFields = formData.roles.includes('personnelManager') ? {
				selectedGroupId: formData.selectedGroupId || undefined,
				newGroupName: formData.newGroupName || undefined,
			} : {};

			await addNewPersonMutation.mutateAsync({
				name: formData.name,
				email: formData.email,
				commander: formData.commander,
				site: formData.site,
				systemRoles,
				serviceType: formData.serviceType,
				...groupFields,
			});

			// Reset form
			setFormData({
				name: '',
				email: '',
				site: '',
				commander: '',
				roles: [],
				serviceType: 'hova',
				siteManagerSite: '',
				availableGroups: [],
				selectedGroupId: '',
				newGroupName: '',
			});

			onSuccess?.();
			onClose();
		} catch (err: any) {
			console.error('Error adding person:', err);
			if (err.response?.data?.includes?.('כבר קיים')) {
				setError(err.response.data);
			} else {
				setError('שגיאה בהוספת האדם');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setFormData({
			name: '',
			email: '',
			commander: '',
			site: '',
			roles: [],
			serviceType: 'hova',
			siteManagerSite: '',
			availableGroups: [],
			selectedGroupId: '',
			newGroupName: '',
		});
		onClose();
	};

	const hasSiteManagerRole = formData.roles.includes('siteManager');
	const hasPersonnelManagerRole = formData.roles.includes('personnelManager');

	return (
		<Modal open={open} onClose={onClose}>
			<Box
				sx={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: { xs: '90%', sm: '80%', md: '60%', lg: '50%' },
					bgcolor: 'background.paper',
					border: '2px solid #000',
					boxShadow: 24,
					p: 4,
					borderRadius: 2,
					maxHeight: '90vh',
					overflow: 'auto',
				}}
			>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
					<Typography variant="h6">הוספת משתמש חדש</Typography>
					<IconButton onClick={onClose}>
						<CloseIcon />
					</IconButton>
				</Box>

				<Stack spacing={3}>
					{error && (
						<Alert severity="error" sx={{ textAlign: 'right' }}>
							{error}
						</Alert>
					)}

					<TextField
						fullWidth
						label="שם מלא"
						variant="outlined"
						value={formData.name}
						onChange={(e) => handleInputChange('name', e.target.value)}
						sx={{
							'& .MuiInputLabel-root': { right: 14, left: 'auto', transformOrigin: 'top right' },
							'& .MuiOutlinedInput-root': { textAlign: 'right' },
						}}
					/>

					<TextField
						fullWidth
						label="אימייל"
						type="email"
						variant="outlined"
						value={formData.email}
						onChange={(e) => handleInputChange('email', e.target.value)}
						sx={{
							'& .MuiInputLabel-root': { right: 14, left: 'auto', transformOrigin: 'top right' },
							'& .MuiOutlinedInput-root': { textAlign: 'right' },
						}}
					/>

					<FormControl fullWidth>
						<InputLabel>(רשות) מפקד</InputLabel>
						<Select
							sx={{
								'& .MuiSelect-select': {
									textAlign: 'right',
								},
							}}
							value={formData.commander}
							label="(רשות) מפקד"
							inputProps={{ style: { textAlign: 'right' } }}
							onChange={(e) => handleInputChange('commander', e.target.value)}
						>
							<MenuItem value="">
								<em>אין מפקד</em>
							</MenuItem>
							{managers.map((manager) => (
								<MenuItem key={manager.userId} value={manager.userId}>
									{manager.name} ({manager.site}) ({manager.groupName})
								</MenuItem>
							))}
						</Select>
					</FormControl>


					<FormControl fullWidth variant="outlined">
						<InputLabel sx={{ right: 14, left: 'auto', transformOrigin: 'top right' }}>
							אתר
						</InputLabel>
						<Select
							value={formData.site}
							onChange={(e) => handleInputChange('site', e.target.value)}
							label="אתר"
							sx={{ textAlign: 'right' }}
						>
							{SITE_OPTIONS.map((site) => (
								<MenuItem key={site} value={site}>
									{hebrewSiteNames[site] ?? site.toUpperCase()}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl fullWidth variant="outlined">
						<InputLabel sx={{ right: 14, left: 'auto', transformOrigin: 'top right' }}>
							סוג שירות
						</InputLabel>
						<Select
							value={formData.serviceType}
							onChange={(e) => handleInputChange('serviceType', e.target.value)}
							label="סוג שירות"
							sx={{ textAlign: 'right' }}
						>
							{SERVICE_TYPE_OPTIONS.map((type) => (
								<MenuItem key={type} value={type}>
									{hebrewServiceTypeNames[type]}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<Box>
						<Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'right' }}>
							תפקידים
						</Typography>
						<FormGroup sx={{ alignItems: 'flex-end' }}>
							{SYSTEM_ROLE_OPTIONS.map((role) => (
								<FormControlLabel
									key={role}
									control={
										<Checkbox
											checked={formData.roles.includes(role)}
											onChange={() => handleRoleChange(role)}
										/>
									}
									label={hebrewSystemRoleNames[role] || 'תפקיד לא ידוע'}
									sx={{
										flexDirection: 'row-reverse',
										marginLeft: 0,
										marginRight: 0,
										'& .MuiFormControlLabel-label': {
											textAlign: 'right',
										},
									}}
								/>
							))}
						</FormGroup>
					</Box>

					{/* Site Manager Site Selection */}
					{hasSiteManagerRole && (
						<FormControl fullWidth variant="outlined">
							<InputLabel sx={{ right: 14, left: 'auto', transformOrigin: 'top right' }}>
								אתר לניהול
							</InputLabel>
							<Select
								value={formData.siteManagerSite}
								onChange={(e) =>
									handleInputChange('siteManagerSite', e.target.value)
								}
								label="אתר לניהול"
								sx={{ textAlign: 'right' }}
							>
								{SITE_MANAGER_OPTIONS.map((site) => (
									<MenuItem key={site} value={site}>
										{hebrewSiteNames[site] ?? site.toUpperCase()}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					)}

					{/* Personnel Manager Group Selection */}
					{hasPersonnelManagerRole && (
						<>
							<Typography variant="subtitle1" sx={{ textAlign: 'right' }}>
								בחירת קבוצה למנהל כוח אדם
							</Typography>
							
							<FormControl fullWidth variant="outlined">
								<InputLabel sx={{ right: 14, left: 'auto', transformOrigin: 'top right' }}>
									קבוצה קיימת
								</InputLabel>
								<Select
									value={formData.selectedGroupId}
									onChange={(e) => {
										handleInputChange('selectedGroupId', e.target.value);
										// Clear new group name when selecting existing group
										if (e.target.value) {
											handleInputChange('newGroupName', '');
										}
									}}
									label="קבוצה קיימת"
									sx={{ textAlign: 'right' }}
								>
									<MenuItem value="">
										<em>בחר קבוצה קיימת</em>
									</MenuItem>
									{formData.availableGroups.map((group) => (
										<MenuItem key={group.groupId} value={group.groupId}>
											{group.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							<Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
								או
							</Typography>

							<TextField
								fullWidth
								label="שם קבוצה חדשה"
								variant="outlined"
								value={formData.newGroupName}
								onChange={(e) => {
									handleInputChange('newGroupName', e.target.value);
									// Clear selected group when entering new group name
									if (e.target.value) {
										handleInputChange('selectedGroupId', '');
									}
								}}
								sx={{
									'& .MuiInputLabel-root': { right: 14, left: 'auto', transformOrigin: 'top right' },
									'& .MuiOutlinedInput-root': { textAlign: 'right' },
								}}
								helperText="הזן שם לקבוצה חדשה (אופציונלי)"
								FormHelperTextProps={{ sx: { textAlign: 'right' } }}
							/>
						</>
					)}

					<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
						<Button variant="outlined" onClick={handleCancel}>
							ביטול
						</Button>
						<Button
							variant="contained"
							onClick={handleSubmit}
							disabled={loading}
						>
							{loading ? 'מוסיף...' : 'הוסף משתמש'}
						</Button>
					</Box>
				</Stack>
			</Box>
		</Modal>
	);
};

export default AddPersonModal;
