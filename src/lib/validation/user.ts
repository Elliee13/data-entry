import { z } from "zod";
import { UserRole } from "@/generated/prisma/enums";

export const createUserSchema = z.object({
  email: z.email().trim().toLowerCase(),
  name: z.string().trim().min(1, "Name is required."),
  password: z.string().min(12, "Password must be at least 12 characters."),
  role: z.enum([UserRole.ADMIN, UserRole.USER]),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").optional(),
  role: z.enum([UserRole.ADMIN, UserRole.USER]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(12, "Password must be at least 12 characters.").optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
