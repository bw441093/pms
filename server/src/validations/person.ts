import { z } from 'zod';

export const loginSchema = z.object({
	username: z.string(),
	password: z.string(),
});

export const otpVerifySchema = z.object({
	otp: z.string(),
});

export const idSchema = z.object({
	id: z.string().uuid(),
});

export const userIdSchema = z.object({
	userId: z.string().uuid(),
  });

export const systemRolesSchema = z.object({
	roles: z.array(
		z.object({
			name: z.string(),
			opts: z.array(z.string()).optional(),
		})
	),
});

export const postPersonSchema = z.object({
	email: z.string().email().optional(),
	name: z.string().min(1),
	site: z.string().min(1),
	serviceType: z.string().optional(),
	systemRoles: z.array(
		z.object({
			name: z.string(),
			opts: z.array(z.string()).optional(),
		})
	),
	selectedGroupId: z.string().optional(), // For personnelManager role - existing group selection
	newGroupName: z.string().optional(), // For personnelManager role - new group creation
});

export const putPersonStatusSchema = z.object({
	status: z.string().min(1),
	location: z.string().min(1),
});

export const postTransactionSchema = z.object({
	origin: z.string().min(1),
	target: z.string().min(1),
	field: z.enum(['site']),
});

export const patchTransactionSchema = z.object({
	status: z.boolean(),
	originator: z.enum(['origin', 'target']),
});

export const updatePersonDetailsSchema = z.object({
	name: z.string().optional(),
	site: z.string().optional(),
	serviceType: z.string().optional(),
	email: z.string().email().optional(),
	systemRoles: z.array(
		z.object({
			name: z.string(),
			opts: z.array(z.string()).optional(),
		})
	).optional(),
	newSiteManagerSites: z.array(z.string()).optional(),
	selectedGroupId: z.string().optional(), // For personnelManager role - existing group selection
	newGroupName: z.string().optional(), // For personnelManager role - new group creation
	replacementAdmins: z.record(z.string()).optional(), // For command group admin replacements: groupId -> personId
});
