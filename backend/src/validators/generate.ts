import { z } from "zod";
import { env } from "../config/env.js";

const blockedPromptPatterns = [
  /\bignore\b.+\binstructions\b/i,
  /\bsystem\s*prompt\b/i,
  /\bdeveloper\s*message\b/i,
  /\boutput\s+html\b/i,
  /\breturn\s+html\b/i,
  /\bscript\s*tag\b/i,
  /<\s*script\b/i,
  /\bdelete\b.+\bdata\b/i,
  /\bexfiltrate\b/i
];

function normalizeText(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

function hasPromptInjectionRisk(value: string) {
  return blockedPromptPatterns.some((pattern) => pattern.test(value));
}

export const generateRequestSchema = z
  .object({
    topic: z
      .string()
      .transform(normalizeText)
      .pipe(
        z
          .string()
          .min(env.GENERATE_TOPIC_MIN_LENGTH)
          .max(env.GENERATE_TOPIC_MAX_LENGTH)
      ),
    grade: z.coerce.number().int().min(env.GENERATE_GRADE_MIN).max(env.GENERATE_GRADE_MAX),
    slides: z.coerce.number().int().min(env.GENERATE_SLIDES_MIN).max(env.GENERATE_SLIDES_MAX),
    subject: z
      .string()
      .transform(normalizeText)
      .pipe(z.string().min(env.GENERATE_SUBJECT_MIN_LENGTH).max(env.GENERATE_SUBJECT_MAX_LENGTH))
      .optional()
  })
  .strict()
  .superRefine((value, context) => {
    const textToCheck = [value.topic, value.subject].filter(Boolean).join(" ");

    if (hasPromptInjectionRisk(textToCheck)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["topic"],
        message: "Prompt-injection style instructions are not allowed"
      });
    }
  });

export type GenerateRequestBody = z.infer<typeof generateRequestSchema>;
