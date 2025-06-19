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
import { getPerson } from '../../../../clients/personsClient';

interface RoleActionProps {
	person: Person;
	onClose: () => void;
	onSuccess?: () => void;
}

const ROLE_OPTIONS = ['siteManager', 'personnelManager', 'hrManager', 'admin'];

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
				setError('Failed to load user information');
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
			setError('You do not have permission to modify this role');
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
			setError('You do not have permission to modify this site');
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
			setError('At least one role must be selected');
			return;
		}

		// Validate site manager has sites selected
		if (
			selectedRoles.includes('siteManager') &&
			siteManagerSites.length === 0
		) {
			setError('Site Manager must have at least one site selected');
			return;
		}

		// Check if user has permission to make these changes
		const unauthorizedRoles = selectedRoles.filter(
			(role) => !canModifyRole(role)
		);
		if (unauthorizedRoles.length > 0) {
			setError(
				`You do not have permission to assign these roles: ${unauthorizedRoles.join(
					', '
				)}`
			);
			return;
		}

		const unauthorizedSites = siteManagerSites.filter(
			(site) => !canModifySite(site)
		);
		if (unauthorizedSites.length > 0) {
			setError(
				`You do not have permission to assign these sites: ${unauthorizedSites.join(
					', '
				)}`
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
			setError(err.response?.data || 'Failed to update roles');
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
				<Typography>Loading user permissions...</Typography>
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
				<Typography variant="h6" component="h2">
					Manage Roles - {person.name}
				</Typography>
				<IconButton onClick={handleClose}>
					<CloseIcon />
				</IconButton>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			<Stack spacing={3}>
				<Box>
					<Typography variant="subtitle1" sx={{ mb: 2 }}>
						Roles
					</Typography>
					<FormGroup>
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
								label={role
									.replace(/([A-Z])/g, ' $1')
									.replace(/^./, (str) => str.toUpperCase())}
							/>
						))}
					</FormGroup>
				</Box>

				{/* Site Manager Sites Selection */}
				{hasSiteManagerRole && (
					<Box>
						<Divider sx={{ my: 2 }} />
						<Typography variant="subtitle1" sx={{ mb: 2 }}>
							Sites to Manage
						</Typography>
						<FormGroup>
							{['mbt', 'mfs', 'kir'].map((site) => (
								<FormControlLabel
									key={site}
									control={
										<Checkbox
											checked={siteManagerSites.includes(site)}
											onChange={() => handleSiteChange(site)}
											disabled={!canModifySite(site)}
										/>
									}
									label={site.toUpperCase()}
								/>
							))}
						</FormGroup>
					</Box>
				)}

				<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
					<Button variant="outlined" onClick={handleClose}>
						Cancel
					</Button>
					<Button variant="contained" onClick={handleSubmit} disabled={loading}>
						{loading ? 'Updating...' : 'Update Roles'}
					</Button>
				</Box>
			</Stack>
		</Box>
	);
};

export default RoleAction;
