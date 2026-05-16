import bcrypt from "bcrypt";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { verifyJWT } from "../middleware/auth.js";
import { loginSchema } from "../validators/auth.js";
import { getRoleCapabilities } from "../auth/roles.js";
import { prisma } from "../services/prisma.js";
import type { SeedUser } from "../auth/seed-users.js";

export async function registerAuthRoutes(app: FastifyInstance, seedUsers: Map<string, SeedUser>) {
  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Bad Request",
        message: "Invalid email or password format"
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() }
    });

    const validPassword = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;

    if (!user || !validPassword) {
      return reply.code(401).send({
        error: "Unauthorized",
        message: "Invalid credentials"
      });
    }

    const accessToken = app.jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        type: "access"
      },
      {
        expiresIn: `${env.ACCESS_TOKEN_EXPIRE_MINUTES}m`
      }
    );

    return {
      accessToken,
      tokenType: "Bearer",
      expiresInMinutes: env.ACCESS_TOKEN_EXPIRE_MINUTES,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        age: user.age,
        experience: user.experience,
        proficiency: user.proficiency,
        qualification: user.qualification,
        grade: user.grade,
        subjects: user.subjects,
        capabilities: getRoleCapabilities(user.role)
      }
    };
  });

  app.get(
    "/auth/me",
    {
      preHandler: [verifyJWT]
    },
    async (request) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id }
      });

      if (!user) {
        throw new Error("User not found");
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          age: user.age,
          experience: user.experience,
          proficiency: user.proficiency,
          qualification: user.qualification,
          grade: user.grade,
          subjects: user.subjects,
          capabilities: getRoleCapabilities(user.role)
        }
      };
    }
  );
}


