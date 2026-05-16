import type { GenerateRequestBody } from "../validators/generate.js";

export function buildOutlineSystemPrompt(): string {
  return [
    "You are an expert educational content planner.",
    "You design structured presentation outlines for K-12 classrooms.",
    "You output ONLY valid JSON with no markdown fences, no explanation, no extra text.",
    "The JSON must be a single array of section objects."
  ].join(" ");
}

export function buildOutlineUserPrompt(request: GenerateRequestBody): string {
  const subjectLine = request.subject ? `Subject: ${request.subject}` : "";

  return [
    `Create a presentation outline for the following:`,
    `Topic: ${request.topic}`,
    subjectLine,
    `Grade level: ${request.grade}`,
    `Number of slides: ${request.slides}`,
    ``,
    `Return a JSON array with exactly ${request.slides} objects.`,
    `Each object must have:`,
    `- "title": a concise section title for that slide`,
    `- "type": one of "cover", "concept", "example", "formula", "activity", "quiz", "summary"`,
    `- "notes": a brief 1-sentence description of what this slide should contain`,
    ``,
    `The first slide must be type "cover".`,
    `The last slide must be type "summary".`,
    `Distribute remaining slides across concept, example, formula, activity, and quiz types based on the topic.`,
    `Keep language appropriate for grade ${request.grade} students.`
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}
