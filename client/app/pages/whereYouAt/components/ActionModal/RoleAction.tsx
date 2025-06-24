import React, { useState, useEffect } from 'react';
import {
	Box,
	Button,
	Typography,
	IconButton,
	Checkbox,
	FormControlLabel,
	FormGroup,
	Stack,
	Alert,
	Divider,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

import type { Person } from '../../../../types';
import {
	hebrewRoleNames,
	hebrewSiteNames,
	SITE_MANAGER_OPTIONS,
	ROLE_OPTIONS,
	SITE_OPTIONS,
	SERVICE_TYPE_OPTIONS,
	hebrewServiceTypeNames,
} from '~/consts';
import { getPerson } from '../../../../clients/personsClient';
import { useUpdatePersonDetails } from '~/hooks/useQueries';

interface RoleActionProps {
	person: Person;
	onClose: () => void;
}

interface Manager {
	userId: string;
	name: string;
	site: string;
}

const RoleAction: React.FC<RoleActionProps> = ({
	person,
	onClose,
}) => {
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const [siteManagerSites, setSiteManagerSites] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [currentUser, setCurrentUser] = useState<Person | null>(null);
	const [userLoading, setUserLoading] = useState(true);
	const updatePersonDetailsMutation = useUpdatePersonDetails();

	// Person details form state
	const [personDetails, setPersonDetails] = useState({
		name: person.name,
		email: '',
		manager: person.manager?.id || '',
		site: person.site,
		serviceType: person.serviceType,
	});
	const [managers, setManagers] = useState<Manager[]>([]);
	const [managersLoading, setManagersLoading] = useState(false);

	// Get current user's information for authorization
	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				const userId = localStorage.getItem('login_token');
				if (userId) {
					const user = await getPerson(userId);
					setCurrentUser(user);
					setSelectedRoles(person.personRoles?.map((pr) => pr.role.name) ?? []);
					const siteManagerRole = person.personRoles?.find(
						(pr) => pr.role.name === 'siteManager'
					);
					if (siteManagerRole && siteManagerRole.role.opts) {
						setSiteManagerSites(siteManagerRole.role.opts);
					}
				}
			} catch (err) {
				console.error('Error fetching current user:', err);
				setError('אירעה שגיאה בעת טעינת פרטי המשתמש');
			} finally {
				setUserLoading(false);
			}
		};

		fetchCurrentUser();
		fetchManagers();
	}, []);

	const fetchManagers = async () => {
		try {
			setManagersLoading(true);
			const response = await axios.get('/api/users/managers');
			setManagers(response.data);
		} catch (err) {
			console.error('Error fetching managers:', err);
			setError('Failed to load managers');
		} finally {
			setManagersLoading(false);
		}
	};

	// Authorization logic
	const getCurrentUserRoles = () => {
		if (!currentUser?.personRoles) return [];
		return currentUser.personRoles.map((pr) => pr.role.name);
	};

	const getCurrentUserSiteManagerSites = () => {
		if (!currentUser?.personRoles) return [];
		const siteManagerRole = currentUser.personRoles.find(
			(pr) => pr.role.name === 'siteManager'
		);
		return siteManagerRole?.role.opts || [];
	};

	const hasHigherRole = () => {
		const userRoles = getCurrentUserRoles();
		return (
			userRoles.includes('personnelManager') ||
			userRoles.includes('hrManager') ||
			userRoles.includes('admin')
		);
	};

	const canModifyRole = (role: string) => {
		if (hasHigherRole()) return true;

		const userRoles = getCurrentUserRoles();
		const userSiteManagerSites = getCurrentUserSiteManagerSites();

		// Site managers can only modify siteManager roles for their sites
		if (role === 'siteManager' && userRoles.includes('siteManager')) {
			// Check if the person being modified is in one of the current user's managed sites
			return userSiteManagerSites.includes(person.site);
		}

		return false;
	};

	const canModifySite = (site: string) => {
		if (hasHigherRole()) return true;

		const userRoles = getCurrentUserRoles();
		const userSiteManagerSites = getCurrentUserSiteManagerSites();

		// Site managers can only modify sites they manage
		if (userRoles.includes('siteManager')) {
			return userSiteManagerSites.includes(site);
		}

		return false;
	};

	const canModifyPersonDetails = () => {
		if (hasHigherRole()) return true;
		return false;
	};

	const handleRoleChange = (role: string) => {
		if (!canModifyRole(role)) {
			setError('אין לך הרשאות מתאימות לעריכת תפקיד זה');
			return;
		}

		setSelectedRoles((prev) => {
			const newRoles = prev.includes(role)
				? prev.filter((r) => r !== role)
				: [...prev, role];

			// Clear site manager sites if role is removed
			if (role === 'siteManager' && !newRoles.includes('siteManager')) {
				setSiteManagerSites([]);
			}

			return newRoles;
		});
		setError(''); // Clear any previous errors
	};

	const handleSiteChange = (site: string) => {
		if (!canModifySite(site)) {
			setError('אין לך הרשאות מתאימות לעריכת אתר זה');
			return;
		}

		setSiteManagerSites((prev) => {
			if (prev.includes(site)) {
				return prev.filter((s) => s !== site);
			} else {
				return [...prev, site];
			}
		});
		setError(''); // Clear any previous errors
	};

	const handleSubmit = async () => {
		// Validate site manager has sites selected
		if (
			selectedRoles.includes('siteManager') &&
			siteManagerSites.length === 0
		) {
			setError('מנהל אתר חייב לבחור לפחות אתר אחד');
			return;
		}

		// Check if user has permission to make these changes
		const unauthorizedRoles = selectedRoles.filter(
			(role) => !canModifyRole(role)
		);
		if (unauthorizedRoles.length > 0) {
			setError(
				`אין לך הרשאה להקצות את התפקידים הבאים: ${unauthorizedRoles.join(', ')}`
			);
			return;
		}

		const unauthorizedSites = siteManagerSites.filter(
			(site) => !canModifySite(site)
		);
		if (unauthorizedSites.length > 0) {
			setError(
				`אין לך הרשאה להקצות את האתרים הבאים: ${unauthorizedSites.join(', ')}`
			);
			return;
		}

		// Check if user has permission to modify person details
		if (!canModifyPersonDetails()) {
			setError('אין לך הרשאות מתאימות לעריכת פרטי המשתמש');
			return;
		}

		setError('');

		try {
			// Update person details
			const detailsPayload = {
				userId: person.id,
				name: personDetails.name,
				manager: personDetails.manager || undefined,
				email: personDetails.email || undefined,
				site: personDetails.site,
				roles: selectedRoles.map((role) => ({
					name: role,
					opts: role === 'siteManager' ? siteManagerSites : [],
				})) || [],
				serviceType: personDetails.serviceType,
			};

			await updatePersonDetailsMutation.mutate(detailsPayload);

			onClose();
		} catch (err: any) {
			console.error('Error updating person:', err);
			setError(err.response?.data || 'עדכון פרטי המשתמש נכשל');
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		onClose();
	};

	const hasSiteManagerRole = selectedRoles.includes('siteManager');

	if (userLoading) {
		return (
			<Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
				<Typography>...טוען הרשאות משתמש</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ width: '100%' }}>
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
				<Typography variant="h6" component="h2" sx={{ textAlign: 'right' }}>
					{person.name} - עדכון פרטים
				</Typography>
			</Box>
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}
			<Stack spacing={3}>
				{canModifyPersonDetails() && (
					<Box>
						<Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'right' }}>
							פרטי משתמש
						</Typography>
						<Stack spacing={2}>
							<TextField
								label="שם"
								value={personDetails.name}
								onChange={(e) => setPersonDetails(prev => ({ ...prev, name: e.target.value }))}
								fullWidth
								required
							/>

							<TextField
								label="אימייל"
								value={personDetails.email}
								onChange={(e) => setPersonDetails(prev => ({ ...prev, email: e.target.value }))}
								fullWidth
							/>

							<FormControl fullWidth>
								<InputLabel>אתר</InputLabel>
								<Select
									sx={{
										'& .MuiSelect-select': {
											textAlign: 'right',
										},
									}}
									value={personDetails.site}
									label="אתר"
									onChange={(e) => setPersonDetails(prev => ({ ...prev, site: e.target.value }))}
								>
									{SITE_OPTIONS.map((site) => (
										<MenuItem
											key={site}
											value={site}
											style={{ textAlign: 'right' }}
										>
											{hebrewSiteNames[site]}
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
									value={personDetails.manager}
									label="(רשות) מנהל"
									onChange={(e) => setPersonDetails(prev => ({ ...prev, manager: e.target.value }))}
									disabled={managersLoading}
								>
									<MenuItem value="">
										<em>אין מנהל</em>
									</MenuItem>
									{managers.map((manager) => (
										<MenuItem key={manager.userId} value={manager.userId}>
											{manager.name} ({hebrewSiteNames[manager.site as keyof typeof hebrewSiteNames]})
										</MenuItem>
									))}
								</Select>
							</FormControl>

							<FormControl fullWidth>
								<InputLabel>סוג שירות</InputLabel>
								<Select
									value={personDetails.serviceType}
									onChange={(e) => setPersonDetails(prev => ({ ...prev, serviceType: e.target.value }))}
								>
									{SERVICE_TYPE_OPTIONS.map((serviceType) => (
										<MenuItem key={serviceType} value={serviceType}>
											{hebrewServiceTypeNames[serviceType]}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							
						</Stack>
					</Box>
				)}

				<Box>
					<Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'right' }}>
						תפקידים
					</Typography>
					<FormGroup sx={{ alignItems: 'flex-end' }}>
						{ROLE_OPTIONS.map((role) => (
							<FormControlLabel
								key={role}
								control={
									<Checkbox
										checked={selectedRoles.includes(role)}
										onChange={() => handleRoleChange(role)}
										disabled={!canModifyRole(role)}
									/>
								}
								label={hebrewRoleNames[role] || 'תפקיד לא ידוע'}
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

				{hasSiteManagerRole && (
					<Box>
						<Divider sx={{ my: 2 }} />
						<Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'right' }}>
							אתרים לניהול
						</Typography>
						<FormGroup sx={{ alignItems: 'flex-end' }}>
							{SITE_MANAGER_OPTIONS.map((site) => (
								<FormControlLabel
									key={site}
									control={
										<Checkbox
											checked={siteManagerSites.includes(site)}
											onChange={() => handleSiteChange(site)}
											disabled={!canModifySite(site)}
										/>
									}
									label={hebrewSiteNames[site] ?? site.toUpperCase()}
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
				)}
				<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
					<Button variant="contained" onClick={handleSubmit} disabled={loading}>
						{loading ? 'מעדכן...' : 'עדכן פרטים ותפקידים'}
					</Button>
					<Button variant="outlined" onClick={handleClose}>
						ביטול
					</Button>
				</Box>
			</Stack>
		</Box>
	);
};
export default RoleAction;
