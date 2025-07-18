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
import { getAdminCommandGroups, getManagedSites, hasHigherRole } from '../../../../../utils/groupUtils';

interface SystemRoleActionProps {
	person: Person;
	onClose: () => void;
}

interface Group {
	groupId: string;
	name: string;
	command: boolean;
}

interface Manager {
	userId: string;
	name: string;
	site: string;
	groupName: string;
	groupId: string;
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

	// Commander state
	const [managers, setManagers] = useState<Manager[]>([]);
	const [commander, setCommander] = useState('');

	// Personnel Manager group selection state
	const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
	const [selectedGroupId, setSelectedGroupId] = useState('');
	const [newGroupName, setNewGroupName] = useState('');

	// Replacement admin state
	const [currentCommandGroups, setCurrentCommandGroups] = useState<Group[]>([]);
	const [replacementAdmins, setReplacementAdmins] = useState<Record<string, string>>({});
	const [availableReplacements, setAvailableReplacements] = useState<Person[]>([]);
	const [needsReplacement, setNeedsReplacement] = useState(false);

	// Person details form state
	const [personDetails, setPersonDetails] = useState({
		name: person.name,
		email: person.email || '',
		site: person.site,
		serviceType: person.serviceType,
	});

	// Fetch managers when component mounts
	useEffect(() => {
		fetchManagers();
	}, []);

	// Get current user's information for authorization
	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				const userId = localStorage.getItem('login_token');
				if (userId) {
					const user = await getPerson(userId);
					setCurrentUser(user);
					
					// Get initial roles from person's system roles
					const roles = person.personSystemRoles?.map((pr) => pr.role.name) ?? [];
					
					// Check if person is currently admin of any command groups
					const commandGroups = await fetchCurrentCommandGroups();
					if (commandGroups && commandGroups.length > 0) {
						roles.push('personnelManager');
					}
					const currentUserSiteManagerSites = await getCurrentUserSiteManagerSites();
					if (currentUserSiteManagerSites.length > 0) {
						roles.push('siteManager');
					}
					
					setSelectedRoles(roles);
					setSiteManagerSites(currentUserSiteManagerSites);
				}
			} catch (err) {
				console.error('Error fetching current user:', err);
				setError('אירעה שגיאה בעת טעינת פרטי המשתמש');
			} finally {
				setUserLoading(false);
			}
		};

		fetchCurrentUser();
	}, []);

	// Set initial commander when person data is available
	useEffect(() => {
		if (person.manager?.id) {
			setCommander(person.manager.id);
		}
	}, [person.manager]);

	const fetchManagers = async () => {
		try {
			const response = await axios.get('/api/users/managers', {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('login_token')}`,
				},
			});
			setManagers(response.data);
		} catch (err) {
			console.error('Error fetching managers:', err);
			setError('Failed to load managers');
		}
	};

	// Check if replacement is needed when roles change
	useEffect(() => {
		checkReplacementNeeded();
	}, [selectedRoles, selectedGroupId, newGroupName, currentCommandGroups]);

	const fetchCurrentCommandGroups = async () => {
		try {
			const adminCommandGroups = await getAdminCommandGroups(person.id);
			setCurrentCommandGroups(adminCommandGroups);
			return adminCommandGroups;
		} catch (err) {
			console.error('Error fetching current command groups:', err);
		}
	};

	const fetchAvailableReplacements = async () => {
		try {
			// Get all persons to choose from as replacements
			const response = await axios.get('/api/users', {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('login_token')}`,
				},
			});
			
			// Filter out the current person
			const availablePeople = response.data.filter((p: Person) => p.id !== person.id);
			setAvailableReplacements(availablePeople);
		} catch (err) {
			console.error('Error fetching available replacements:', err);
			setError('Failed to load available replacements');
		}
	};

	const checkReplacementNeeded = () => {
		const willHavePersonnelManager = selectedRoles.includes('personnelManager');
		
		// If person currently has personnelManager role and command groups
		if (currentCommandGroups.length > 0) {
			// Case 1: Removing personnelManager role completely
			if (!willHavePersonnelManager) {
				setNeedsReplacement(true);
				fetchAvailableReplacements();
				return;
			}
			
			// Case 2: Changing to a different group (if they selected a different group)
			if (willHavePersonnelManager && (selectedGroupId || newGroupName)) {
				// Check if the selected group is different from current groups
				const isDifferentGroup = !currentCommandGroups.some(group => group.groupId === selectedGroupId);
				if (isDifferentGroup) {
					setNeedsReplacement(true);
					fetchAvailableReplacements();
					return;
				}
			}
		}
		
		setNeedsReplacement(false);
	};

	const handleReplacementChange = (groupId: string, replacementPersonId: string) => {
		setReplacementAdmins(prev => ({
			...prev,
			[groupId]: replacementPersonId
		}));
	};

	// Fetch available groups when personnelManager role is selected
	useEffect(() => {
		if (selectedRoles.includes('personnelManager')) {
			fetchAvailableGroups();
		}
	}, [selectedRoles]);

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

	const getCurrentUserSiteManagerSites = async () => {
		if (!currentUser?.id) return [];
		
		try {
			return await getManagedSites(currentUser.id);
		} catch (err) {
			console.error('Error getting managed sites from groups:', err);
			return [];
		}
	};

	const canModifyRole = async () => {
		const userSystemRoles = getCurrentUserRoles();
		if (hasHigherRole(userSystemRoles)) return true;

		return false;
	};

	const canModifySite = async (site: string) => {
		const userSystemRoles = getCurrentUserRoles();
		if (hasHigherRole(userSystemRoles)) return true;

		// Site managers can only modify sites they manage
		if (siteManagerSites.includes(site)) {
			return true;
		}

		return false;
	};

	const canModifyPersonDetails = () => {
		const userSystemRoles = getCurrentUserRoles();
		if (hasHigherRole(userSystemRoles)) return true;
		return false;
	};

	const handleRoleChange = async (role: string) => {
		const canModify = await canModifyRole();
		if (!canModify) {
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

	const handleSiteChange = async (site: string) => {
		const canModify = await canModifySite(site);
		if (!canModify) {
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

		// Validate replacement admins are selected if needed
		if (needsReplacement) {
			const missingReplacements = currentCommandGroups.filter(group => 
				!replacementAdmins[group.groupId]
			);
			if (missingReplacements.length > 0) {
				setError(`חובה לבחור מחליף עבור הקבוצות: ${missingReplacements.map(g => g.name).join(', ')}`);
				return;
			}
		}

		// Check if user has permission to make these changes
		const roleChecks = await Promise.all(
			selectedRoles.map(role => canModifyRole())
		);
		const unauthorizedRoles = selectedRoles.filter(
			(role, index) => !roleChecks[index]
		);
		if (unauthorizedRoles.length > 0) {
			setError(
				`אין לך הרשאה להקצות את התפקידים הבאים: ${unauthorizedRoles.join(', ')}`
			);
			return;
		}

		const siteChecks = await Promise.all(
			siteManagerSites.map(site => canModifySite(site))
		);
		const unauthorizedSites = siteManagerSites.filter(
			(site, index) => !siteChecks[index]
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
				commander: commander || undefined,
				systemRoles: selectedRoles.map((role) => ({
					name: role,
					opts: [],
				})) || [],
				serviceType: personDetails.serviceType,
				...(selectedRoles.includes('siteManager') && {
					newSiteManagerSites: siteManagerSites
				}), 
				// Only include group fields if personnelManager role is selected
				...(selectedRoles.includes('personnelManager') && {
					...(selectedGroupId && selectedGroupId.trim() !== '' && {
						selectedGroupId: selectedGroupId
					}),
					...(newGroupName && newGroupName.trim() !== '' && {
						newGroupName: newGroupName
					})
				}),
				// Include replacement admins if needed
				...(needsReplacement && {
					replacementAdmins: replacementAdmins
				})
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
								<InputLabel>(רשות) מפקד</InputLabel>
								<Select
									sx={{
										'& .MuiSelect-select': {
											textAlign: 'right',
										},
									}}
									value={commander}
									label="(רשות) מפקד"
									inputProps={{ style: { textAlign: 'right' } }}
									onChange={(e) => setCommander(e.target.value)}
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
										disabled={!canModifyRole()}
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

				{needsReplacement && currentCommandGroups.length > 0 && (
					<Box>
						<Divider sx={{ my: 2 }} />
						<Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'right' }}>
							בחירת מחליף למפקד קבוצה
						</Typography>
						<Typography variant="body2" sx={{ mb: 2, textAlign: 'right', color: 'text.secondary' }}>
							אתה כרגע מפקד של קבוצות הפיקוד הבאות. חובה לבחור מחליף לכל קבוצה לפני שינוי התפקיד.
						</Typography>
						<Stack spacing={2}>
							{currentCommandGroups.map((group) => (
								<Box key={group.groupId}>
									<Typography variant="body2" sx={{ mb: 1, textAlign: 'right', fontWeight: 'bold' }}>
										קבוצה: {group.name}
									</Typography>
									<FormControl fullWidth required>
										<InputLabel>בחר מחליף</InputLabel>
										<Select
											sx={{
												'& .MuiSelect-select': {
													textAlign: 'right',
												},
											}}
											value={replacementAdmins[group.groupId] || ''}
											label="בחר מחליף"
											onChange={(e) => handleReplacementChange(group.groupId, e.target.value)}
										>
											<MenuItem value="">
												<em>בחר מחליף</em>
											</MenuItem>
											{availableReplacements.map((replacement) => (
												<MenuItem key={replacement.id} value={replacement.id}>
													{replacement.name} ({replacement.site})
												</MenuItem>
											))}
										</Select>
									</FormControl>
								</Box>
							))}
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
