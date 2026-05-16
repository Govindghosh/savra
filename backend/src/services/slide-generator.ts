import { env } from "../config/env.js";
import { buildSlideSystemPrompt, buildSlideUserPrompt } from "../prompts/slide.js";
import { buildRepairSystemPrompt, buildRepairUserPrompt } from "../prompts/repair.js";
import type { OutlineSection, StructuredSlide, SlideContent } from "../validators/ai-output.js";
import { validateSlideContent } from "../validators/ai-output.js";
import { callLLM, parseLLMJson } from "./llm-client.js";
import { formatZodErrors, getSchemaDescription } from "./json-repair.js";

const premiumTypes = new Set<OutlineSection["type"]>(["concept", "example", "formula"]);

function selectTier(type: OutlineSection["type"]): "cheap" | "premium" {
  return premiumTypes.has(type) ? "premium" : "cheap";
}

function buildFallbackSlide(section: OutlineSection): SlideContent {
  switch (section.type) {
    case "cover":
      return { title: section.title, subtitle: section.notes, gradeLabel: "Presentation" };
    case "summary":
      return { title: section.title, keyPoints: [section.notes], nextSteps: "Review the material" };
    case "quiz":
      return {
        title: section.title,
        question: section.notes,
        options: ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        answer: "A",
        explanation: "See the previous slides for details"
      };
    case "activity":
      return {
        title: section.title,
        instruction: section.notes,
        materials: [],
        duration: "5 minutes"
      };
    case "formula":
      return {
        title: section.title,
        formula: section.notes,
        variables: ["See explanation"],
        solvedExample: "Refer to textbook"
      };
    case "example":
      return {
        title: section.title,
        scenario: section.notes,
        steps: [],
        takeaway: "Key learning from this example"
      };
    default:
      return { title: section.title, bullets: [section.notes], explanation: section.notes };
  }
}

async function attemptSlideRepair(
  rawOutput: string,
  validationErrors: string,
  slideType: OutlineSection["type"]
): Promise<SlideContent | null> {
  try {
    const repairResponse = await callLLM({
      messages: [
        { role: "system", content: buildRepairSystemPrompt() },
        {
          role: "user",
          content: buildRepairUserPrompt(rawOutput, validationErrors, getSchemaDescription(slideType))
        }
      ],
      tier: "cheap"
    });

    const parsed = parseLLMJson<unknown>(repairResponse.content);
    const validated = validateSlideContent(slideType, parsed);

    if (validated.success) {
      return validated.data as SlideContent;
    }
  } catch {
    return null;
  }

  return null;
}

type SlideGenerationContext = {
  topic: string;
  subject: string | undefined;
  grade: number;
  totalSlides: number;
};

export async function generateSlideContent(
  section: OutlineSection,
  slideIndex: number,
  context: SlideGenerationContext
): Promise<StructuredSlide> {
  const tier = selectTier(section.type);
  const systemPrompt = buildSlideSystemPrompt();
  const userPrompt = buildSlideUserPrompt({
    topic: context.topic,
    subject: context.subject,
    grade: context.grade,
    section,
    slideIndex,
    totalSlides: context.totalSlides
  });

  let lastError: Error | null = null;
  let lastRawOutput = "";

  for (let attempt = 0; attempt < env.LLM_SLIDE_MAX_RETRIES; attempt++) {
    try {
      const response = await callLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tier
      });

      lastRawOutput = response.content;
      const parsed = parseLLMJson<unknown>(response.content);
      const validated = validateSlideContent(section.type, parsed);

      if (validated.success) {
        return { type: section.type, content: validated.data as SlideContent };
      }

      const errors = formatZodErrors(validated.error.issues);
      const repaired = await attemptSlideRepair(lastRawOutput, errors, section.type);

      if (repaired) {
        return { type: section.type, content: repaired };
      }

      lastError = new Error(`Slide ${slideIndex} validation failed after repair: ${errors}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (env.LLM_USE_FALLBACK) {
    return { type: section.type, content: buildFallbackSlide(section) };
  }

  throw lastError ?? new Error(`Slide ${slideIndex} generation exhausted all retries`);
}
