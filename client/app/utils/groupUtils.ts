import { getGroupsByPersonId, getPersonRoleInGroup } from '~/clients/groupsClient';

// Site code to Hebrew name mapping
const siteCodeToHebrew: Record<string, string> = {
	mbt: 'איילת השחר',
	mfs: 'בראשית', 
	kir: 'בית הבחירה',
	mdt: 'רקיע',
	other: 'אחר',
};

/**
 * Check if user is personnel manager (admin of any command groups)
 */
export const checkIsPersonnelManager = async (userId: string): Promise<boolean> => {
	try {
		const userGroups = await getGroupsByPersonId(userId);
		const groupIds = userGroups.map((group: any) => group.groupId);
		const groupRoles = await getPersonRoleInGroup(userId, groupIds);
		
		// Find if person is admin of any command groups
		return groupRoles.some((role: any) => {
			const group = userGroups.find((g: any) => g.groupId === role.groupId);
			return group?.command && role.groupRole === 'admin';
		});
	} catch (err) {
		console.error('Error checking personnel manager status:', err);
		return false;
	}
};

/**
 * Get managed sites (admin of site groups) - returns site codes
 */
export const getManagedSites = async (userId: string): Promise<string[]> => {
	try {
		const userGroups = await getGroupsByPersonId(userId);
		const groupIds = userGroups.map((group: any) => group.groupId);
		const groupRoles = await getPersonRoleInGroup(userId, groupIds);
		
		// Find site groups where user is admin
		const adminSiteGroups = groupRoles.filter((role: any) => {
			const group = userGroups.find((g: any) => g.groupId === role.groupId);
			return group?.site && role.groupRole === 'admin';
		});

		// Convert Hebrew group names to site codes
		const managedSites = adminSiteGroups.map((role: any) => {
			const group = userGroups.find((g: any) => g.groupId === role.groupId);
			// Find site code by Hebrew name
			return Object.keys(siteCodeToHebrew).find(code => siteCodeToHebrew[code] === group?.name) || '';
		}).filter(Boolean);

		return managedSites;
	} catch (err) {
		console.error('Error getting managed sites from groups:', err);
		return [];
	}
};

/**
 * Get command groups where user is admin - returns full group objects
 */
export const getAdminCommandGroups = async (userId: string): Promise<any[]> => {
	try {
		const userGroups = await getGroupsByPersonId(userId);
		const groupIds = userGroups.map((group: any) => group.groupId);
		const groupRoles = await getPersonRoleInGroup(userId, groupIds);
		
		// Find command groups where person is admin
		const adminCommandGroups = groupRoles.filter((role: any) => {
			const group = userGroups.find((g: any) => g.groupId === role.groupId);
			return group?.command && role.groupRole === 'admin';
		}).map((role: any) => {
			return userGroups.find((g: any) => g.groupId === role.groupId);
		});

		return adminCommandGroups;
	} catch (err) {
		console.error('Error fetching admin command groups:', err);
		return [];
	}
};

/**
 * Get site groups where user is admin - returns full group objects
 */
export const getAdminSiteGroups = async (userId: string): Promise<any[]> => {
	try {
		const userGroups = await getGroupsByPersonId(userId);
		const groupIds = userGroups.map((group: any) => group.groupId);
		const groupRoles = await getPersonRoleInGroup(userId, groupIds);
		
		// Find site groups where user is admin
		const adminSiteGroups = groupRoles.filter((role: any) => {
			const group = userGroups.find((g: any) => g.groupId === role.groupId);
			return group?.site && role.groupRole === 'admin';
		}).map((role: any) => {
			return userGroups.find((g: any) => g.groupId === role.groupId);
		});

		return adminSiteGroups;
	} catch (err) {
		console.error('Error fetching admin site groups:', err);
		return [];
	}
};

/**
 * Check if user is admin of a specific site (by site code)
 */
export const isAdminOfSite = async (userId: string, siteCode: string): Promise<boolean> => {
	try {
		const managedSites = await getManagedSites(userId);
		return managedSites.includes(siteCode);
	} catch (err) {
		console.error('Error checking site admin status:', err);
		return false;
	}
};

/**
 * Check if user has higher role permissions (hrManager or admin)
 */
export const hasHigherRole = (userSystemRoles: string[]): boolean => {
	return userSystemRoles.includes('hrManager') || userSystemRoles.includes('admin');
}; 