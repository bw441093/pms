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

export const rolesSchema = z.object({
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
	})
	.merge(rolesSchema)
	.merge(loginSchema);

export const updateStatusSchema = z.object({
	status: z.string(),
	location: z.string(),
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

export type Id = z.infer<typeof idSchema>;
export type Status = z.infer<typeof updateStatusSchema>;
export type PostMove = z.infer<typeof postMoveSchema>;
export type UpdateMove = z.infer<typeof updateMoveSchema>;
export type Login = z.infer<typeof loginSchema>;
export type OTP = z.infer<typeof otpVerifySchema>;
export type UpdateRoles = z.infer<typeof rolesSchema>;
export type PostPerson = z.infer<typeof postPersonSchema>;
