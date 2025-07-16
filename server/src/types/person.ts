import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import { PersonsTable } from '../db/schema';
import {
	loginSchema,
	otpVerifySchema,
	idSchema,
	systemRolesSchema,
	postPersonSchema,
	putPersonStatusSchema,
	postTransactionSchema,
	patchTransactionSchema,
	updatePersonDetailsSchema,
} from '../validations/person';

export type Id = z.infer<typeof idSchema>;
export type Status = z.infer<typeof putPersonStatusSchema>;
export type PostTransaction = z.infer<typeof postTransactionSchema>;
export type UpdateTransaction = z.infer<typeof patchTransactionSchema>;
export type Login = z.infer<typeof loginSchema>;
export type OTP = z.infer<typeof otpVerifySchema>;
export type UpdateSystemRoles = z.infer<typeof systemRolesSchema>;
export type PostPerson = z.infer<typeof postPersonSchema>;
export type Person = InferSelectModel<typeof PersonsTable>;
export type UpdatePersonDetails = z.infer<typeof updatePersonDetailsSchema>;
