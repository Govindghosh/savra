import type { FastifyInstance } from "fastify";
import { checkRole, verifyJWT } from "../middleware/auth.js";
import { getRoleCapabilities } from "../auth/roles.js";
import { getJobSummaryForUser } from "../services/job-service.js";

export async function registerProtectedRoutes(app: FastifyInstance) {
  app.get(
    "/generate/access",
    {
      preHandler: [verifyJWT, checkRole(["teacher"])]
    },
    async (request) => ({
      status: "allowed",
      capability: "ppt_generation",
      role: request.user.role,
      capabilities: getRoleCapabilities(request.user.role)
    })
  );

  app.get(
    "/content/access",
    {
      preHandler: [verifyJWT, checkRole(["student", "teacher", "admin"])]
    },
    async (request) => ({
      status: "allowed",
      capability: "read_content",
      role: request.user.role,
      capabilities: getRoleCapabilities(request.user.role),
      resources: ["presentations", "lesson_material"]
    })
  );

  app.get(
    "/admin/access",
    {
      preHandler: [verifyJWT, checkRole(["admin"])]
    },
    async (request) => ({
      status: "allowed",
      capability: "analytics",
      role: request.user.role,
      capabilities: getRoleCapabilities(request.user.role),
      summary: await getJobSummaryForUser(request.user.id, request.user.role)
    })
  );
}
