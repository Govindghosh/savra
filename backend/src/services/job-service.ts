import type { JobStatus } from "@prisma/client";
import { prisma } from "./prisma.js";
import { createRequestHash } from "./request-hash.js";
import type { GenerateRequestBody } from "../validators/generate.js";
import type { Role } from "../auth/roles.js";

const reusableStatuses: JobStatus[] = ["queued", "processing", "completed"];

export async function findReusableGenerationJob(userId: string, request: GenerateRequestBody) {
  const hash = createRequestHash(userId, request);
  return prisma.job.findFirst({
    where: {
      userId,
      hash,
      status: {
        in: reusableStatuses
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function createGenerationJob(userId: string, request: GenerateRequestBody) {
  const hash = createRequestHash(userId, request);
  const job = await prisma.job.create({
    data: {
      userId,
      topic: request.topic,
      subject: request.subject,
      grade: request.grade,
      slides: request.slides,
      status: "queued",
      progress: 0,
      hash
    }
  });

  return {
    job,
    reused: false
  };
}

export async function createCachedGenerationJob(userId: string, request: GenerateRequestBody, pptUrl: string) {
  const hash = createRequestHash(userId, request);
  const job = await prisma.job.create({
    data: {
      userId,
      topic: request.topic,
      subject: request.subject,
      grade: request.grade,
      slides: request.slides,
      status: "completed",
      progress: 100,
      pptUrl,
      hash
    }
  });

  return job;
}

export async function getJobById(jobId: string) {
  return prisma.job.findUnique({
    where: {
      id: jobId
    }
  });
}

function buildJobScope(userId: string, role: Role) {
  return role === "admin" ? {} : { userId };
}

export async function listJobsForUser(userId: string, role: Role) {
  return prisma.job.findMany({
    where: buildJobScope(userId, role),
    orderBy: {
      createdAt: "desc"
    },
    take: 25
  });
}

export async function listCompletedContentJobs(grade?: number) {
  return prisma.job.findMany({
    where: {
      status: "completed",
      pptUrl: {
        not: null
      },
      ...(grade !== undefined ? { grade } : {})
    },
    orderBy: {
      updatedAt: "desc"
    },
    take: 12,
    select: {
      id: true,
      topic: true,
      subject: true,
      grade: true,
      slides: true,
      pptUrl: true,
      updatedAt: true
    }
  });
}


export async function getJobForUser(jobId: string, userId: string, role: Role) {
  return prisma.job.findFirst({
    where: {
      id: jobId,
      ...buildJobScope(userId, role)
    }
  });
}

export async function getJobSummaryForUser(userId: string, role: Role) {
  const scope = buildJobScope(userId, role);
  const [total, queued, processing, completed, failed, cacheEntries] = await Promise.all([
    prisma.job.count({ where: scope }),
    prisma.job.count({ where: { ...scope, status: "queued" } }),
    prisma.job.count({ where: { ...scope, status: "processing" } }),
    prisma.job.count({ where: { ...scope, status: "completed" } }),
    prisma.job.count({ where: { ...scope, status: "failed" } }),
    prisma.presentationCache.count()
  ]);

  return {
    total,
    queued,
    processing,
    completed,
    failed,
    cacheEntries
  };
}

export async function markJobProcessing(jobId: string) {
  return prisma.job.update({
    where: {
      id: jobId
    },
    data: {
      status: "processing",
      progress: 10,
      errorMessage: null
    }
  });
}

export async function updateJobProgress(jobId: string, progress: number) {
  return prisma.job.update({
    where: {
      id: jobId
    },
    data: {
      progress
    }
  });
}

export async function markJobCompleted(jobId: string, pptUrl: string) {
  return prisma.job.update({
    where: {
      id: jobId
    },
    data: {
      status: "completed",
      progress: 100,
      pptUrl,
      errorMessage: null
    }
  });
}

export async function markJobFailed(jobId: string, errorMessage: string) {
  return prisma.job.update({
    where: {
      id: jobId
    },
    data: {
      status: "failed",
      errorMessage
    }
  });
}
