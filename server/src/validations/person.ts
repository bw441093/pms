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

export const postPersonSchema = z
	.object({
		name: z.string(),
		manager: z.string().optional(),
		site: z.string(),
		email: z.string().email(),
		serviceType: z.string(),
		systemRoles: z.array(
			z.object({
				name: z.string(),
				opts: z.array(z.string()).optional(),
			})
		),
		selectedGroupId: z.string().optional(), // For personnelManager role - existing group selection
		newGroupName: z.string().optional(), // For personnelManager role - new group creation
	})

export const updateStatusSchema = z.object({
	status: z.string(),
	location: z.string(),
});

export const updateAlertSchema = z.object({
	status: z.enum(['pending', 'good', 'bad']),
});

export const postMoveSchema = z.object({
	origin: z.string(),
	target: z.string(),
	field: z.enum(['site', 'manager']),
});

export const updateMoveSchema = z.object({
	originator: z.enum(['origin', 'target']),
	status: z.boolean(),
});

export const updatePersonDetailsSchema = z.object({
	name: z.string().optional(),
	manager: z.string().optional(),
	site: z.string().optional(),
	email: z.string().email().optional(),
	serviceType: z.string().optional(),
	selectedGroupId: z.string().optional(), // For personnelManager role - existing group selection
	newGroupName: z.string().optional(), // For personnelManager role - new group creation
}).merge(systemRolesSchema);
