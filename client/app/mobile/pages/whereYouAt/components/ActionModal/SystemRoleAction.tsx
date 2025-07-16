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

import type { Person } from '../../../../../types';
import {
	hebrewSiteNames,
	SITE_MANAGER_OPTIONS,
	SYSTEM_ROLE_OPTIONS,
	SITE_OPTIONS,
	SERVICE_TYPE_OPTIONS,
	hebrewServiceTypeNames,
	hebrewSystemRoleNames,
} from '~/consts';
import { getPerson } from '../../../../../clients/personsClient';
import { useUpdatePersonDetails } from '~/hooks/useQueries';

interface SystemRoleActionProps {
	person: Person;
	onClose: () => void;
}

interface Manager {
	userId: string;
	name: string;
	site: string;
	groupId: string;
	groupName: string;
}

interface Group {
	groupId: string;
	name: string;
	command: boolean;
}

const SystemRoleAction: React.FC<SystemRoleActionProps> = ({
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

	// Personnel Manager group selection state
	const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
	const [selectedGroupId, setSelectedGroupId] = useState('');
	const [newGroupName, setNewGroupName] = useState('');

	// Person details form state
	const [personDetails, setPersonDetails] = useState({
		name: person.name,
		email: '',
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
					setSelectedRoles(person.personSystemRoles?.map((pr) => pr.role.name) ?? []);
					const siteManagerRole = person.personSystemRoles?.find(
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

	// Fetch available groups when personnelManager role is selected
	useEffect(() => {
		if (selectedRoles.includes('personnelManager')) {
			fetchAvailableGroups();
		}
	}, [selectedRoles]);

	const fetchManagers = async () => {
		try {
			setManagersLoading(true);
			const response = await axios.get('/api/users/managers');
			console.log('response.data', response.data);
			setManagers(response.data);
		} catch (err) {
			console.error('Error fetching managers:', err);
			setError('Failed to load managers');
		} finally {
			setManagersLoading(false);
		}
	};

	const fetchAvailableGroups = async () => {
		try {
			const token = localStorage.getItem('login_token');
			const managerId = 'none'; // Use 'none' for no manager
			const response = await axios.get(`/api/groups/subordinate-command-groups/${managerId}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			setAvailableGroups(response.data);
		} catch (err) {
			console.error('Error fetching available groups:', err);
			setError('Failed to load available groups');
		}
	};

	const checkGroupNameExists = async (groupName: string): Promise<boolean> => {
		try {
			const token = localStorage.getItem('login_token');
			const response = await axios.get(`/api/groups/check-name-exists/${encodeURIComponent(groupName)}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			return response.data.exists;
		} catch (err) {
			console.error('Error checking group name:', err);
			setError('Failed to check group name');
			return false;
		}
	};

	// Authorization logic
	const getCurrentUserRoles = () => {
		if (!currentUser?.personSystemRoles) return [];
		return currentUser.personSystemRoles.map((pr) => pr.role.name);
	};

	const getCurrentUserSiteManagerSites = () => {
		if (!currentUser?.personSystemRoles) return [];
		const siteManagerRole = currentUser.personSystemRoles.find(
			(pr) => pr.role.name === 'siteManager'
		);
		return siteManagerRole?.role.opts || [];
	};

	const hasHigherRole = () => {
		const userSystemRoles = getCurrentUserRoles();
		return (
			userSystemRoles.includes('personnelManager') ||
			userSystemRoles.includes('hrManager') ||
			userSystemRoles.includes('admin')
		);
	};

	const canModifyRole = (role: string) => {
		if (hasHigherRole()) return true;

		const userSystemRoles = getCurrentUserRoles();
		const userSiteManagerSites = getCurrentUserSiteManagerSites();

		// Site managers can only modify siteManager roles for their sites
		if (role === 'siteManager' && userSystemRoles.includes('siteManager')) {
			// Check if the person being modified is in one of the current user's managed sites
			return userSiteManagerSites.includes(person.site);
		}

		return false;
	};

	const canModifySite = (site: string) => {
		if (hasHigherRole()) return true;

		const userSystemRoles = getCurrentUserRoles();
		const userSiteManagerSites = getCurrentUserSiteManagerSites();

		// Site managers can only modify sites they manage
		if (userSystemRoles.includes('siteManager')) {
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

			// Clear group fields if personnelManager role is removed
			if (role === 'personnelManager' && !newRoles.includes('personnelManager')) {
				setSelectedGroupId('');
				setNewGroupName('');
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

		// Validate personnelManager has group selection or new group name
		if (selectedRoles.includes('personnelManager')) {
			if (!selectedGroupId && !newGroupName) {
				setError('מנהל כוח אדם חייב לבחור קבוצה קיימת או להזין שם לקבוצה חדשה');
				return;
			}
			if (selectedGroupId && newGroupName) {
				setError('אנא בחר קבוצה קיימת או הזן שם לקבוצה חדשה, לא שניהם');
				return;
			}

			// Check if the new group name already exists
			if (newGroupName) {
				const groupExists = await checkGroupNameExists(newGroupName);
				if (groupExists) {
					setError(`שם הקבוצה "${newGroupName}" כבר קיים במערכת. אנא בחר שם אחר.`);
					return;
				}
			}
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
				email: personDetails.email || undefined,
				site: personDetails.site,
				systemRoles: selectedRoles.map((role) => ({
					name: role,
					opts: role === 'siteManager' ? siteManagerSites : [],
				})) || [],
				serviceType: personDetails.serviceType,
				// Only include group fields if personnelManager role is selected
				...(selectedRoles.includes('personnelManager') && {
					...(selectedGroupId && selectedGroupId.trim() !== '' && {
						selectedGroupId: selectedGroupId
					}),
					...(newGroupName && newGroupName.trim() !== '' && {
						newGroupName: newGroupName
					})
				})
			};

			console.log('Debug - SystemRoleAction sending payload:', detailsPayload);
			console.log('Debug - selectedGroupId:', detailsPayload.selectedGroupId, 'type:', typeof detailsPayload.selectedGroupId);
			console.log('Debug - newGroupName:', detailsPayload.newGroupName, 'type:', typeof detailsPayload.newGroupName);

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

	const hasPersonnelManagerRole = selectedRoles.includes('personnelManager');

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
						{SYSTEM_ROLE_OPTIONS.map((role) => (
							<FormControlLabel
								key={role}
								control={
									<Checkbox
										checked={selectedRoles.includes(role)}
										onChange={() => handleRoleChange(role)}
										disabled={!canModifyRole(role)}
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

				{hasPersonnelManagerRole && (
					<Box>
						<Divider sx={{ my: 2 }} />
						<Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'right' }}>
							קבוצות לניהול כוח אדם
						</Typography>
						<Stack spacing={2}>
							{/* Show group selection dropdown only if no new group name is entered */}
							{!newGroupName && (
								<FormControl fullWidth required>
									<InputLabel>בחר קבוצה קיימת</InputLabel>
									<Select
										sx={{
											'& .MuiSelect-select': {
												textAlign: 'right',
											},
										}}
										value={selectedGroupId}
										label="בחר קבוצה קיימת"
										onChange={(e) => {
											setSelectedGroupId(e.target.value);
											// Clear new group name when selecting existing group
											if (e.target.value) {
												setNewGroupName('');
											}
										}}
									>
										<MenuItem value="">
											<em>בחר קבוצה או הזן שם חדש למטה</em>
										</MenuItem>
										{availableGroups.map((group) => (
											<MenuItem key={group.groupId} value={group.groupId}>
												{group.name}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							)}

							{/* Show new group name field only if no existing group is selected */}
							{!selectedGroupId && (
								<TextField
									label="צור קבוצה חדשה"
									value={newGroupName}
									onChange={(e) => {
										setNewGroupName(e.target.value);
										// Clear selected group when typing new group name
										if (e.target.value) {
											setSelectedGroupId('');
										}
									}}
									fullWidth
									required
									placeholder="הזן שם לקבוצה חדשה או בחר קבוצה קיימת למעלה"
								/>
							)}

							<Typography variant="caption" sx={{ textAlign: 'right', color: 'text.secondary' }}>
								* חובה לבחור קבוצה קיימת או ליצור קבוצה חדשה
							</Typography>
						</Stack>
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
export default SystemRoleAction;
