import { Queue } from "bullmq";
import { env } from "../config/env.js";
import { createRedisConnection } from "./redis.js";

export type PresentationJobPayload = {
  jobId: string;
};

export const presentationQueue = new Queue<PresentationJobPayload>(env.PRESENTATION_QUEUE_NAME, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: env.JOB_RETRY_ATTEMPTS,
    backoff: {
      type: "exponential",
      delay: env.JOB_RETRY_DELAY_MS
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

export async function enqueuePresentationJob(jobId: string) {
  await presentationQueue.add(
    env.PRESENTATION_QUEUE_NAME,
    {
      jobId
    },
    {
      jobId
    }
  );
}
