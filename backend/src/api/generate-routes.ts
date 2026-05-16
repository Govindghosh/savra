import type { FastifyInstance } from "fastify";
import { findSemanticCacheHit } from "../cache/semantic-cache.js";
import { checkRole, verifyJWT } from "../middleware/auth.js";
import { enqueuePresentationJob } from "../queue/presentation-queue.js";
import {
  createCachedGenerationJob,
  createGenerationJob,
  findReusableGenerationJob
} from "../services/job-service.js";
import { generateRequestSchema } from "../validators/generate.js";

export async function registerGenerateRoutes(app: FastifyInstance) {
  app.post(
    "/generate",
    {
      preHandler: [verifyJWT, checkRole(["teacher"])]
    },
    async (request, reply) => {
      const parsed = generateRequestSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "Invalid generation request",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        });
      }

      const reusableJob = await findReusableGenerationJob(request.user.id, parsed.data);

      if (reusableJob) {
        return reply.code(202).send({
          jobId: reusableJob.id,
          status: reusableJob.status,
          progress: reusableJob.progress,
          reused: true,
          cacheHit: false,
          statusUrl: `/jobs/${reusableJob.id}`
        });
      }

      const cacheHit = await findSemanticCacheHit(parsed.data);

      if (cacheHit) {
        const cachedJob = await createCachedGenerationJob(request.user.id, parsed.data, cacheHit.cache.pptUrl);

        return reply.code(200).send({
          jobId: cachedJob.id,
          status: cachedJob.status,
          progress: cachedJob.progress,
          reused: false,
          cacheHit: true,
          similarity: cacheHit.similarity,
          exact: cacheHit.exact,
          pptUrl: cachedJob.pptUrl,
          statusUrl: `/jobs/${cachedJob.id}`
        });
      }

      const result = await createGenerationJob(request.user.id, parsed.data);
      await enqueuePresentationJob(result.job.id);

      return reply.code(202).send({
        jobId: result.job.id,
        status: result.job.status,
        progress: result.job.progress,
        reused: result.reused,
        cacheHit: false,
        statusUrl: `/jobs/${result.job.id}`
      });
    }
  );
}
