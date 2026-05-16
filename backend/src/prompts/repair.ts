export function buildRepairSystemPrompt(): string {
  return [
    "You are a JSON repair assistant.",
    "You receive invalid or malformed JSON along with the validation errors.",
    "You fix the JSON to match the required schema.",
    "You output ONLY the corrected valid JSON with no markdown fences, no explanation, no extra text."
  ].join(" ");
}

export function buildRepairUserPrompt(originalOutput: string, validationErrors: string, schemaHint: string): string {
  return [
    "The following JSON output failed validation:",
    "",
    originalOutput,
    "",
    "Validation errors:",
    validationErrors,
    "",
    "Required schema:",
    schemaHint,
    "",
    "Return ONLY the corrected JSON object. Fix missing fields, wrong types, and remove extra keys."
  ].join("\n");
}
