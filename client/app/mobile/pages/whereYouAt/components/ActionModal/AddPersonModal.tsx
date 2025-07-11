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
		email: '',
		name: '',
		site: '',
		manager: '',
		roles: [] as string[],
		siteManagerSite: '', // New field for site manager's specific site
		serviceType: '',
	});
	const [managers, setManagers] = useState<Manager[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const addNewPersonMutation = useAddNewPerson();
	// Fetch managers when modal opens
	useEffect(() => {
		if (open) {
			fetchManagers();
		}
	}, [open]);

	const fetchManagers = async () => {
		try {
			const token = localStorage.getItem('login_token');
			const response = await axios.get('/api/users/managers', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			setManagers(response.data);
		} catch (err) {
			console.error('Error fetching managers:', err);
			setError('Failed to load managers');
		}
	};

	const handleInputChange = (field: string, value: string | string[]) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleRoleChange = (role: string) => {
		setFormData((prev) => {
			const newRoles = prev.roles.includes(role)
				? prev.roles.filter((r) => r !== role)
				: [...prev.roles, role];

			// Clear siteManagerSite if siteManager role is removed
			const newSiteManagerSite = newRoles.includes('siteManager')
				? prev.siteManagerSite
				: '';

			return {
				...prev,
				roles: newRoles,
				siteManagerSite: newSiteManagerSite,
			};
		});
	};

	const handleSubmit = async () => {
		if (
			!formData.email ||
			!formData.name ||
			!formData.site
		) {
			setError('אנא מלא את כל השדות חובה');
			return;
		}

		// Check if siteManager role is selected but no site is chosen
		if (formData.roles.includes('siteManager') && !formData.siteManagerSite) {
			setError('אנא בחר אתר לניהול עבור תפקיד מנהל האתר');
			return;
		}

		setLoading(true);
		setError('');

		try {
			const payload = {
				email: formData.email,
				name: formData.name,
				site: formData.site,
				manager: formData.manager || '',
				systemRoles: formData.roles.map((role) => ({
					name: role,
					opts: role === 'siteManager' ? [formData.siteManagerSite] : [],
				})),
				serviceType: formData.serviceType,
			};

			await addNewPersonMutation.mutate(payload);

			// Reset form
			setFormData({
				email: '',
				name: '',
				site: '',
				manager: '',
				roles: [],
				siteManagerSite: '',
				serviceType: '',
			});

			onSuccess?.();
			onClose();
		} catch (err: any) {
			console.error(':שגיאה ביצירת משתמש:', err);
			setError(err.response?.data || 'יצירת האדם נכשלה');
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setFormData({
			email: '',
			name: '',
			site: '',
			manager: '',
			roles: [],
			siteManagerSite: '',
			serviceType: '',
		});
		setError('');
		onClose();
	};

	const hasSiteManagerRole = formData.roles.includes('siteManager');

	return (
		<Modal
			open={open}
			onClose={handleClose}
			aria-labelledby="add-person-modal-title"
			aria-describedby="add-person-modal-description"
		>
			<Box
				sx={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: '90vw',
					maxWidth: '500px',
					bgcolor: 'background.paper',
					border: '2px solid #000',
					boxShadow: 24,
					p: 4,
					borderRadius: 2,
					maxHeight: '90vh',
					overflow: 'auto',
				}}
			>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						mb: 3,
					}}
				>
					<IconButton onClick={handleClose}>
						<CloseIcon />
					</IconButton>
					<Typography
						id="add-person-modal-title"
						variant="h6"
						component="h2"
						sx={{ textAlign: 'right' }}
					>
						הוספת משתמש חדש
					</Typography>
				</Box>

				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				<Stack spacing={3}>
					<TextField
						label="אימייל"
						type="email"
						value={formData.email}
						onChange={(e) => handleInputChange('email', e.target.value)}
						required
						fullWidth
					/>

					<TextField
						label="שם"
						value={formData.name}
						onChange={(e) => handleInputChange('name', e.target.value)}
						required
						fullWidth
					/>

					<FormControl fullWidth required>
						<InputLabel>אתר</InputLabel>
						<Select
							sx={{
								'& .MuiSelect-select': {
									textAlign: 'right',
								},
							}}
							value={formData.site}
							label="Site"
							onChange={(e) => handleInputChange('site', e.target.value)}
						>
							{SITE_OPTIONS.map((site) => (
								<MenuItem
									key={site}
									value={site}
									style={{ textAlign: 'right' }}
								>
									{hebrewSiteNames[site] || site.toUpperCase()}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl fullWidth>
						<InputLabel>(רשות) מנהל</InputLabel>
						<Select
							sx={{
								'& .MuiSelect-select': {
									textAlign: 'right',
								},
							}}
							value={formData.manager}
							label="(רשות) מנהל"
							inputProps={{ style: { textAlign: 'right' } }}
							onChange={(e) => handleInputChange('manager', e.target.value)}
						>
							<MenuItem value="">
								<em>אין מנהל</em>
							</MenuItem>
							{managers.map((manager) => (
								<MenuItem key={manager.userId} value={manager.userId}>
									{manager.name} ({manager.site})
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl fullWidth required>
						<InputLabel>סוג שירות</InputLabel>
						<Select
							sx={{
								'& .MuiSelect-select': {
									textAlign: 'right',
								},
							}}
							value={formData.serviceType}
							label="סוג שירות"
							onChange={(e) => handleInputChange('serviceType', e.target.value)}
						>
							{SERVICE_TYPE_OPTIONS.map((serviceType) => (
								<MenuItem key={serviceType} value={serviceType}>
									{hebrewServiceTypeNames[serviceType]}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<Box>
						<Typography variant="subtitle1" sx={{ mb: 1, textAlign: 'right' }}>
							תפקידים *
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
						<FormControl fullWidth required>
							<InputLabel>אתר לניהול</InputLabel>
							<Select
								sx={{
									'& .MuiSelect-select': {
										textAlign: 'right',
									},
								}}
								value={formData.siteManagerSite}
								label="אתר לניהול"
								onChange={(e) =>
									handleInputChange('siteManagerSite', e.target.value)
								}
							>
								{SITE_MANAGER_OPTIONS.map((site) => (
									<MenuItem key={site} value={site}>
										{hebrewSiteNames[site] || site.toUpperCase()}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					)}

					<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
						<Button variant="outlined" onClick={handleClose}>
							ביטול
						</Button>
						<Button
							variant="contained"
							onClick={handleSubmit}
							disabled={loading}
						>
							{loading ? '...בתהליך הוספה' : 'הוסף משתמש'}
						</Button>
					</Box>
				</Stack>
			</Box>
		</Modal>
	);
};

export default AddPersonModal;
