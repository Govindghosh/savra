import { Worker } from "bullmq";
import { env } from "../config/env.js";
import {
  getJobById,
  markJobCompleted,
  markJobFailed,
  markJobProcessing,
  updateJobProgress
} from "../services/job-service.js";
import { createRedisConnection } from "../queue/redis.js";
import type { PresentationJobPayload } from "../queue/presentation-queue.js";
import { storeSemanticCache } from "../cache/semantic-cache.js";
import { generatePresentation } from "../services/generation-service.js";
import { generatePptFile } from "../services/ppt-service.js";

function createPptUrl(fileName: string) {
  return `${env.PPT_PUBLIC_BASE_URL}/${fileName}`;
}

const worker = new Worker<PresentationJobPayload>(
  env.PRESENTATION_QUEUE_NAME,
  async (job) => {
    const { jobId } = job.data;
    const generationJob = await getJobById(jobId);

    if (!generationJob) {
      throw new Error("Job was not found");
    }

    await markJobProcessing(jobId);

    const result = await generatePresentation(
      {
        topic: generationJob.topic,
        subject: generationJob.subject ?? undefined,
        grade: generationJob.grade,
        slides: generationJob.slides
      },
      async (progress) => {
        await updateJobProgress(jobId, progress);
      }
    );

    const fileName = await generatePptFile(jobId, generationJob.topic, generationJob.grade, result.slides);

    const pptUrl = createPptUrl(fileName);
    await markJobCompleted(jobId, pptUrl);
    await storeSemanticCache(
      {
        topic: generationJob.topic,
        subject: generationJob.subject ?? undefined,
        grade: generationJob.grade,
        slides: generationJob.slides
      },
      pptUrl
    );

    return {
      jobId,
      slideCount: result.slides.length,
      pptUrl
    };
  },
  {
    connection: createRedisConnection(),
    concurrency: env.QUEUE_CONCURRENCY
  }
);

worker.on("failed", async (job, error) => {
  if (job && job.attemptsMade >= env.JOB_RETRY_ATTEMPTS) {
    await markJobFailed(job.data.jobId, error.message);
  }
});
