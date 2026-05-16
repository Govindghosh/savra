import bcrypt from "bcrypt";
import { env } from "../config/env.js";
import { prisma } from "../services/prisma.js";
import type { AuthUser, Role } from "./roles.js";

export type SeedUser = AuthUser & {
  passwordHash: string;
};

type SeedUserInput = {
  id: string;
  email: string;
  password: string;
  role: Role;
};

const seedInputs: SeedUserInput[] = [
  {
    id: "seed_teacher",
    email: env.SEED_TEACHER_EMAIL,
    password: env.SEED_TEACHER_PASSWORD,
    role: "teacher"
  },
  {
    id: "seed_student",
    email: env.SEED_STUDENT_EMAIL,
    password: env.SEED_STUDENT_PASSWORD,
    role: "student"
  },
  {
    id: "seed_admin",
    email: env.SEED_ADMIN_EMAIL,
    password: env.SEED_ADMIN_PASSWORD,
    role: "admin"
  }
];

export async function createSeedUsers() {
  const users = await Promise.all(
    seedInputs.map(async (user) => ({
      id: user.id,
      email: user.email.toLowerCase(),
      role: user.role,
      passwordHash: await bcrypt.hash(user.password, env.BCRYPT_SALT_ROUNDS)
    }))
  );

  return new Map(users.map((user) => [user.email, user]));
}

export async function syncSeedUsers(users: Map<string, SeedUser>) {
  await Promise.all(
    Array.from(users.values()).map((user) =>
      prisma.user.upsert({
        where: {
          email: user.email
        },
        update: {
          passwordHash: user.passwordHash,
          role: user.role
        },
        create: {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          role: user.role
        }
      })
    )
  );
}
