import crypto from "node:crypto";
import type { GenerateRequestBody } from "../validators/generate.js";

export function createRequestHash(userId: string, request: GenerateRequestBody) {
  const payload = {
    userId,
    topic: request.topic.toLowerCase(),
    grade: request.grade,
    slides: request.slides,
    subject: request.subject?.toLowerCase() ?? null
  };

  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function createCacheRequestHash(request: GenerateRequestBody) {
  const payload = {
    topic: request.topic.toLowerCase(),
    grade: request.grade,
    slides: request.slides,
    subject: request.subject?.toLowerCase() ?? null
  };

  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
