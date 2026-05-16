import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128)
});

export const createUserSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.enum(["teacher", "student", "admin"]),
  name: z.string().optional(),
  age: z.number().optional(),
  experience: z.number().optional(),
  proficiency: z.string().optional(),
  qualification: z.string().optional(),
  grade: z.number().optional(),
  subjects: z.string().optional()
});

export type LoginBody = z.infer<typeof loginSchema>;
export type CreateUserBody = z.infer<typeof createUserSchema>;

