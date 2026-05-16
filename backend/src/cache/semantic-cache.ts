import { env } from "../config/env.js";
import { prisma } from "../services/prisma.js";
import { createCacheRequestHash } from "../services/request-hash.js";
import type { GenerateRequestBody } from "../validators/generate.js";
import { cosineSimilarity, createEmbedding } from "./embedding.js";

type CacheMetadata = {
  topic: string;
  grade: number;
  slides: number;
  subject: string | null;
};

function subjectMatches(left: string | null, right: string | undefined) {
  const normalizedRight = right?.toLowerCase() ?? null;

  return left === normalizedRight;
}

function metadataMatches(metadata: CacheMetadata, request: GenerateRequestBody) {
  return metadata.grade === request.grade && subjectMatches(metadata.subject, request.subject);
}

export async function findSemanticCacheHit(request: GenerateRequestBody) {
  const requestHash = createCacheRequestHash(request);
  const exactMatch = await prisma.presentationCache.findUnique({
    where: {
      requestHash
    }
  });

  if (exactMatch) {
    return {
      cache: exactMatch,
      similarity: 1,
      exact: true
    };
  }

  const embedding = await createEmbedding(request);
  const candidates = await prisma.presentationCache.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: 50
  });

  let bestMatch: {
    cache: (typeof candidates)[number];
    similarity: number;
  } | null = null;

  for (const candidate of candidates) {
    const metadata = candidate.metadata as CacheMetadata;

    if (!metadataMatches(metadata, request)) {
      continue;
    }

    const similarity = cosineSimilarity(embedding, candidate.embedding);

    if (similarity >= env.CACHE_SIMILARITY_THRESHOLD && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = {
        cache: candidate,
        similarity
      };
    }
  }

  return bestMatch ? { ...bestMatch, exact: false } : null;
}

export async function storeSemanticCache(request: GenerateRequestBody, pptUrl: string) {
  const requestHash = createCacheRequestHash(request);
  const embedding = await createEmbedding(request);
  const metadata: CacheMetadata = {
    topic: request.topic,
    grade: request.grade,
    slides: request.slides,
    subject: request.subject?.toLowerCase() ?? null
  };

  return prisma.presentationCache.upsert({
    where: {
      requestHash
    },
    update: {
      embedding,
      pptUrl,
      metadata
    },
    create: {
      requestHash,
      embedding,
      pptUrl,
      metadata
    }
  });
}
