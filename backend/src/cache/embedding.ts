import crypto from "node:crypto";
import OpenAI from "openai";
import { env } from "../config/env.js";
import type { GenerateRequestBody } from "../validators/generate.js";

function normalizeCacheText(request: GenerateRequestBody) {
  return [request.subject, request.topic, `grade ${request.grade}`, `slides ${request.slides}`]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function localEmbedding(text: string) {
  const vector = Array.from({ length: env.EMBEDDING_DIMENSIONS }, () => 0);
  const tokens = text.match(/[a-z0-9]+/g) ?? [];

  for (const token of tokens) {
    const hash = crypto.createHash("sha256").update(token).digest();
    const index = hash[0] % env.EMBEDDING_DIMENSIONS;
    const sign = hash[1] % 2 === 0 ? 1 : -1;
    vector[index] += sign;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;

  return vector.map((value) => value / magnitude);
}

async function openAiEmbedding(text: string) {
  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });
  const response = await client.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input: text
  });

  return response.data[0]?.embedding ?? localEmbedding(text);
}

export async function createEmbedding(request: GenerateRequestBody) {
  const text = normalizeCacheText(request);

  if (env.EMBEDDING_PROVIDER === "openai") {
    return openAiEmbedding(text);
  }

  return localEmbedding(text);
}

export function cosineSimilarity(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);

  return denominator === 0 ? 0 : dot / denominator;
}
