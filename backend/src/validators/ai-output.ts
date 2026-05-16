import { z } from "zod";

const slideTypes = ["cover", "concept", "example", "formula", "activity", "quiz", "summary"] as const;

export const outlineSectionSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(slideTypes),
  notes: z.string().min(1).max(500)
});

export type OutlineSection = z.infer<typeof outlineSectionSchema>;

export const outlineSchema = z.array(outlineSectionSchema).min(1).max(20);

export type Outline = z.infer<typeof outlineSchema>;

export const coverSlideSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  gradeLabel: z.string().min(1)
});

export const conceptSlideSchema = z.object({
  title: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1).max(8),
  explanation: z.string().min(1)
});

export const exampleSlideSchema = z.object({
  title: z.string().min(1),
  scenario: z.string().min(1),
  steps: z.array(z.string().min(1)).max(6).default([]),
  takeaway: z.string().min(1)
});

export const formulaSlideSchema = z.object({
  title: z.string().min(1),
  formula: z.string().min(1),
  variables: z.array(z.string().min(1)).min(1).max(8),
  solvedExample: z.string().min(1)
});

export const activitySlideSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().min(1),
  materials: z.array(z.string()).default([]),
  duration: z.string().min(1)
});

export const quizSlideSchema = z.object({
  title: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  answer: z.string().min(1).max(2),
  explanation: z.string().min(1)
});

export const summarySlideSchema = z.object({
  title: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(1).max(8),
  nextSteps: z.string().min(1)
});

const slideContentSchemas: Record<OutlineSection["type"], z.ZodType> = {
  cover: coverSlideSchema,
  concept: conceptSlideSchema,
  example: exampleSlideSchema,
  formula: formulaSlideSchema,
  activity: activitySlideSchema,
  quiz: quizSlideSchema,
  summary: summarySlideSchema
};

export function validateSlideContent(type: OutlineSection["type"], data: unknown) {
  const schema = slideContentSchemas[type] ?? conceptSlideSchema;
  return schema.safeParse(data);
}

export type CoverSlide = z.infer<typeof coverSlideSchema>;
export type ConceptSlide = z.infer<typeof conceptSlideSchema>;
export type ExampleSlide = z.infer<typeof exampleSlideSchema>;
export type FormulaSlide = z.infer<typeof formulaSlideSchema>;
export type ActivitySlide = z.infer<typeof activitySlideSchema>;
export type QuizSlide = z.infer<typeof quizSlideSchema>;
export type SummarySlide = z.infer<typeof summarySlideSchema>;

export type SlideContent =
  | CoverSlide
  | ConceptSlide
  | ExampleSlide
  | FormulaSlide
  | ActivitySlide
  | QuizSlide
  | SummarySlide;

export type StructuredSlide = {
  type: OutlineSection["type"];
  content: SlideContent;
};
