import type { FastifyInstance } from "fastify";
import { getRoleCapabilities } from "../auth/roles.js";
import { checkRole, verifyJWT } from "../middleware/auth.js";
import { listCompletedContentJobs } from "../services/job-service.js";
import { prisma } from "../services/prisma.js";

const studyMaterials = [
  {
    id: "revision-notes",
    title: "Revision Notes",
    type: "lesson_material",
    description: "Short notes for quick review before class tests."
  },
  {
    id: "practice-quiz",
    title: "Practice Quiz",
    type: "quiz",
    description: "Question practice based on available presentations."
  },
  {
    id: "key-vocabulary",
    title: "Key Vocabulary",
    type: "lesson_material",
    description: "Important terms students should remember."
  },
  {
    id: "summary-cards",
    title: "Summary Cards",
    type: "revision",
    description: "Compact recap cards for last-minute learning."
  }
];

export async function registerContentRoutes(app: FastifyInstance) {
  app.get(
    "/content/library",
    {
      preHandler: [verifyJWT, checkRole(["student", "teacher", "admin"])]
    },
    async (request) => {
      let grade: number | undefined;

      if (request.user.role === "student") {
        const user = await prisma.user.findUnique({
          where: { id: request.user.id },
          select: { grade: true }
        });
        grade = user?.grade ?? undefined;
      }

      const presentations = await listCompletedContentJobs(grade);

      return {
        role: request.user.role,
        capabilities: getRoleCapabilities(request.user.role),
        materials: studyMaterials,
        presentations: presentations.map((job: any) => ({
          id: job.id,
          title: job.topic,
          subject: job.subject,
          grade: job.grade,
          slides: job.slides,
          pptUrl: job.pptUrl,
          updatedAt: job.updatedAt
        }))
      };
    }
  );
}
