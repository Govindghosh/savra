import type { FastifyInstance } from "fastify";
import { checkRole, verifyJWT } from "../middleware/auth.js";
import { getJobForUser, getJobSummaryForUser, listJobsForUser } from "../services/job-service.js";

function serializeJob(job: Awaited<ReturnType<typeof getJobForUser>>) {
  if (!job) return null;

  return {
    id: job.id,
    topic: job.topic,
    subject: job.subject,
    grade: job.grade,
    slides: job.slides,
    status: job.status,
    progress: job.progress,
    pptUrl: job.pptUrl,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  };
}

export async function registerJobRoutes(app: FastifyInstance) {
  app.get(
    "/jobs",
    {
      preHandler: [verifyJWT, checkRole(["teacher", "admin"])]
    },
    async (request) => {
      const [jobs, summary] = await Promise.all([
        listJobsForUser(request.user.id, request.user.role),
        getJobSummaryForUser(request.user.id, request.user.role)
      ]);

      return {
        jobs: jobs.map((job) => serializeJob(job)),
        summary
      };
    }
  );

  app.get(
    "/jobs/:jobId",
    {
      preHandler: [verifyJWT, checkRole(["teacher", "admin"])]
    },
    async (request, reply) => {
      const params = request.params as {
        jobId?: string;
      };
      const jobId = params.jobId?.trim();

      if (!jobId) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "Job id is required"
        });
      }

      const job = await getJobForUser(jobId, request.user.id, request.user.role);

      if (!job) {
        return reply.code(404).send({
          error: "Not Found",
          message: "Job was not found"
        });
      }

      return {
        job: serializeJob(job)
      };
    }
  );
}
