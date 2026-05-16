import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { checkRole, verifyJWT } from "../middleware/auth.js";
import { prisma } from "../services/prisma.js";
import { createUserSchema, type CreateUserBody } from "../validators/auth.js";
import { env } from "../config/env.js";

export async function registerUserManagementRoutes(app: FastifyInstance) {
  // List all users (Admin only)
  app.get(
    "/admin/users",
    {
      preHandler: [verifyJWT, checkRole(["admin"])]
    },
    async () => {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          age: true,
          experience: true,
          proficiency: true,
          qualification: true,
          grade: true,
          subjects: true,
          createdAt: true

        },
        orderBy: {
          createdAt: "desc"
        }
      });
      return { users };
    }
  );

  // List all students (Teacher or Admin)
  app.get(
    "/teacher/students",
    {
      preHandler: [verifyJWT, checkRole(["teacher", "admin"])]
    },
    async () => {
      const users = await prisma.user.findMany({
        where: {
          role: "student"
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          age: true,
          grade: true,
          subjects: true,
          createdAt: true
        },
        orderBy: {
          createdAt: "desc"
        }
      });
      return { users };
    }
  );

  // Create a new user (Admin can create any, Teacher can create students)

  app.post(
    "/users",
    {
      preHandler: [verifyJWT, checkRole(["admin", "teacher"])]
    },
    async (request, reply) => {
      const parsed = createUserSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "Invalid user data",
          issues: parsed.error.issues
        });
      }

      // Role check: Teacher can only create students
      if (request.user.role === "teacher" && parsed.data.role !== "student") {
        return reply.code(403).send({
          error: "Forbidden",
          message: "Teachers can only create students"
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: parsed.data.email }
      });

      if (existingUser) {
        return reply.code(409).send({
          error: "Conflict",
          message: "User with this email already exists"
        });
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, env.BCRYPT_SALT_ROUNDS);

      const user = await prisma.user.create({
        data: {
          email: parsed.data.email,
          passwordHash,
          role: parsed.data.role,
          name: parsed.data.name,
          age: parsed.data.age,
          experience: parsed.data.experience,
          proficiency: parsed.data.proficiency,
          qualification: parsed.data.qualification,
          grade: parsed.data.grade,
          subjects: parsed.data.subjects
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          age: true,
          experience: true,
          proficiency: true,
          qualification: true,
          grade: true,
          subjects: true,
          createdAt: true
        }
      });


      return reply.code(201).send({ user });
    }
  );


  // Update a user (Admin can update any, Teacher can update students)
  app.patch(
    "/users/:id",
    {
      preHandler: [verifyJWT, checkRole(["admin", "teacher"])]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as Partial<CreateUserBody>;

      const targetUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!targetUser) {
        return reply.code(404).send({
          error: "Not Found",
          message: "User not found"
        });
      }

      // Permission check
      if (request.user.role === "teacher" && targetUser.role !== "student") {
        return reply.code(403).send({
          error: "Forbidden",
          message: "Teachers can only update student profiles"
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name: body.name,
          age: body.age,
          experience: body.experience,
          proficiency: body.proficiency,
          qualification: body.qualification,
          grade: body.grade,
          subjects: body.subjects
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          age: true,
          experience: true,
          proficiency: true,
          qualification: true,
          grade: true,
          subjects: true,
          createdAt: true
        }
      });

      return { user: updatedUser };
    }
  );

  // Delete a user (Admin only)

  app.delete(
    "/admin/users/:id",
    {
      preHandler: [verifyJWT, checkRole(["admin"])]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      if (id === request.user.id) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "You cannot delete your own account"
        });
      }

      try {
        await prisma.user.delete({
          where: { id }
        });
        return { success: true };
      } catch (error) {
        return reply.code(404).send({
          error: "Not Found",
          message: "User not found"
        });
      }
    }
  );
}
