import type { OutlineSection } from "../validators/ai-output.js";

type SlidePromptInput = {
  topic: string;
  subject: string | undefined;
  grade: number;
  section: OutlineSection;
  slideIndex: number;
  totalSlides: number;
};

export function buildSlideSystemPrompt(): string {
  return [
    "You are an expert educational slide content writer.",
    "You produce structured JSON content for individual presentation slides.",
    "You output ONLY valid JSON with no markdown fences, no explanation, no extra text.",
    "The JSON must be a single object matching the requested schema."
  ].join(" ");
}

export function buildSlideUserPrompt(input: SlidePromptInput): string {
  const subjectLine = input.subject ? `Subject: ${input.subject}` : "";
  const typeSchema = getSchemaForType(input.section.type);

  return [
    `Generate content for slide ${input.slideIndex + 1} of ${input.totalSlides}.`,
    `Topic: ${input.topic}`,
    subjectLine,
    `Grade level: ${input.grade}`,
    `Slide title: ${input.section.title}`,
    `Slide type: ${input.section.type}`,
    `Section notes: ${input.section.notes}`,
    ``,
    `Return a JSON object with these fields:`,
    typeSchema,
    ``,
    `Keep language appropriate for grade ${input.grade} students.`,
    `Be concise but informative.`
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

function getSchemaForType(type: OutlineSection["type"]): string {
  switch (type) {
    case "cover":
      return [
        `- "title": string (presentation title)`,
        `- "subtitle": string (a short tagline or description)`,
        `- "gradeLabel": string (e.g. "Grade 8")`
      ].join("\n");

    case "concept":
      return [
        `- "title": string`,
        `- "bullets": string[] (3-5 key points)`,
        `- "explanation": string (2-3 sentence explanation)`
      ].join("\n");

    case "example":
      return [
        `- "title": string`,
        `- "scenario": string (real-world example or analogy)`,
        `- "steps": string[] (2-4 step breakdown if applicable)`,
        `- "takeaway": string (what to learn from this example)`
      ].join("\n");

    case "formula":
      return [
        `- "title": string`,
        `- "formula": string (the formula or equation)`,
        `- "variables": string[] (explain each variable)`,
        `- "solvedExample": string (one worked-out example)`
      ].join("\n");

    case "activity":
      return [
        `- "title": string`,
        `- "instruction": string (what students should do)`,
        `- "materials": string[] (what is needed, can be empty)`,
        `- "duration": string (estimated time, e.g. "5 minutes")`
      ].join("\n");

    case "quiz":
      return [
        `- "title": string`,
        `- "question": string`,
        `- "options": string[] (4 options, prefix with A/B/C/D)`,
        `- "answer": string (correct option letter)`,
        `- "explanation": string (why that answer is correct)`
      ].join("\n");

    case "summary":
      return [
        `- "title": string`,
        `- "keyPoints": string[] (3-5 recap points)`,
        `- "nextSteps": string (what to explore next)`
      ].join("\n");

    default:
      return [
        `- "title": string`,
        `- "bullets": string[] (3-5 key points)`,
        `- "explanation": string (2-3 sentence explanation)`
      ].join("\n");
  }
}
