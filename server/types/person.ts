import { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import { PersonsTable } from '../db/schema'
import {
  loginSchema,
  otpVerifySchema,
  idSchema,
  rolesSchema,
  postPersonSchema,
  updateStatusSchema,
  postMoveSchema,
  updateMoveSchema,
} from '../validations/person';

export type Id = z.infer<typeof idSchema>;
export type Status = z.infer<typeof updateStatusSchema>;
export type PostMove = z.infer<typeof postMoveSchema>;
export type UpdateMove = z.infer<typeof updateMoveSchema>;
export type Login = z.infer<typeof loginSchema>;
export type OTP = z.infer<typeof otpVerifySchema>;
export type UpdateRoles = z.infer<typeof rolesSchema>;
export type PostPerson = z.infer<typeof postPersonSchema>;
export type Person = InferSelectModel<typeof PersonsTable>;
