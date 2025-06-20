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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';

import type { Person } from '../../../../types';
import { hebrewRoleNames, hebrewSiteNames, SITE_MANAGER_OPTIONS, ROLE_OPTIONS } from '~/consts';
import { getPerson } from '../../../../clients/personsClient';

interface RoleActionProps {
	person: Person;
	onClose: () => void;
	onSuccess?: () => void;
}

const RoleAction: React.FC<RoleActionProps> = ({
	person,
	onClose,
	onSuccess,
}) => {
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const [siteManagerSites, setSiteManagerSites] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [currentUser, setCurrentUser] = useState<Person | null>(null);
	const [userLoading, setUserLoading] = useState(true);

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
				setError('אירעה שגיאה בעת טעינת פרטי המשתמש');
			} finally {
				setUserLoading(false);
			}
		};

		fetchCurrentUser();
	}, []);

	// Initialize roles from person data
	useEffect(() => {
		if (person.personRoles) {
			const roles = person.personRoles.map((pr) => pr.role.name);
			setSelectedRoles(roles);

			// Extract site manager sites
			const siteManagerRole = person.personRoles.find(
				(pr) => pr.role.name === 'siteManager'
			);
			if (siteManagerRole && siteManagerRole.role.opts) {
				setSiteManagerSites(siteManagerRole.role.opts);
			}
		}
	}, [person]);

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
		if (selectedRoles.length === 0) {
			setError('יש לסמן לפחות תפקיד אחד');
			return;
		}

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

		setLoading(true);
		setError('');

		try {
			const token = localStorage.getItem('login_token');
			const payload = {
				roles: selectedRoles.map((role) => ({
					name: role,
					opts: role === 'siteManager' ? siteManagerSites : undefined,
				})),
			};

			await axios.put(`/api/users/${person.id}/roles`, payload, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			onSuccess?.();
			onClose();
		} catch (err: any) {
			console.error('Error updating roles:', err);
			setError(err.response?.data || 'עדכון התפקידים נכשל');
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
       {person.name} - ניהול תפקידים
     </Typography>
   </Box>
   {error && (
     <Alert severity="error" sx={{ mb: 2 }}>
       {error}
     </Alert>
   )}
   <Stack spacing={3}>
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
                 textAlign: 'right'
               }
             }}
           />
         ))}
       </FormGroup>
     </Box>
     {/* Site Manager Sites Selection */}
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
                   textAlign: 'right'
                 }
               }}
             />
           ))}
         </FormGroup>
       </Box>
     )}
     <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
       <Button variant="contained" onClick={handleSubmit} disabled={loading}>
         {loading ? 'מעדכן...' : 'עדכן תפקידים'}
       </Button>
			 <Button variant="outlined" onClick={handleClose}>
         ביטול
       </Button>
     </Box>
   </Stack>
 </Box>
);
}
export default RoleAction;
