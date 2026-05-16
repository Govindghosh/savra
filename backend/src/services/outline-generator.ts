import { env } from "../config/env.js";
import { buildOutlineSystemPrompt, buildOutlineUserPrompt } from "../prompts/outline.js";
import { buildRepairSystemPrompt, buildRepairUserPrompt } from "../prompts/repair.js";
import type { GenerateRequestBody } from "../validators/generate.js";
import { outlineSchema, type Outline } from "../validators/ai-output.js";
import { callLLM, parseLLMJson } from "./llm-client.js";
import { formatZodErrors, getSchemaDescription } from "./json-repair.js";

function buildFallbackOutline(request: GenerateRequestBody): Outline {
  const sections: Outline = [
    { title: request.topic, type: "cover", notes: "Title slide" }
  ];

  for (let i = 1; i < request.slides - 1; i++) {
    sections.push({
      title: `${request.topic} - Part ${i}`,
      type: "concept",
      notes: `Key concepts about ${request.topic}`
    });
  }

  sections.push({
    title: "Summary",
    type: "summary",
    notes: `Recap of ${request.topic}`
  });

  return sections;
}

async function attemptRepair(rawOutput: string, validationErrors: string): Promise<Outline | null> {
  try {
    const repairResponse = await callLLM({
      messages: [
        { role: "system", content: buildRepairSystemPrompt() },
        {
          role: "user",
          content: buildRepairUserPrompt(rawOutput, validationErrors, getSchemaDescription("outline"))
        }
      ],
      tier: "cheap"
    });

    const parsed = parseLLMJson<unknown>(repairResponse.content);
    const rawArray = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown>).outline ?? parsed;
    const validated = outlineSchema.safeParse(rawArray);

    if (validated.success) {
      return validated.data;
    }
  } catch {
    return null;
  }

  return null;
}

export async function generateOutline(request: GenerateRequestBody): Promise<Outline> {
  const systemPrompt = buildOutlineSystemPrompt();
  const userPrompt = buildOutlineUserPrompt(request);

  let lastError: Error | null = null;
  let lastRawOutput = "";

  for (let attempt = 0; attempt < env.LLM_OUTLINE_MAX_RETRIES; attempt++) {
    try {
      const response = await callLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tier: "cheap"
      });

      lastRawOutput = response.content;
      const parsed = parseLLMJson<unknown>(response.content);
      const rawArray = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown>).outline ?? parsed;
      const validated = outlineSchema.safeParse(rawArray);

      if (validated.success) {
        return validated.data;
      }

      const errors = formatZodErrors(validated.error.issues);
      const repaired = await attemptRepair(lastRawOutput, errors);

      if (repaired) {
        return repaired;
      }

      lastError = new Error(`Outline validation failed after repair: ${errors}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (env.LLM_USE_FALLBACK) {
    return buildFallbackOutline(request);
  }

  throw lastError ?? new Error("Outline generation exhausted all retries");
}
