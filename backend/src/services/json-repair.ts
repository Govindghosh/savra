const trailingCommaPattern = /,\s*([}\]])/g;
const singleQuotePattern = /'/g;
const markdownFencePattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/;

export function sanitizeLLMJson(raw: string): string {
  let cleaned = raw.trim();

  const fenceMatch = cleaned.match(markdownFencePattern);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }

  cleaned = cleaned.replace(trailingCommaPattern, "$1");

  return cleaned;
}

export function tryParseJson<T>(raw: string): { success: true; data: T } | { success: false; error: string } {
  const sanitized = sanitizeLLMJson(raw);

  try {
    const parsed = JSON.parse(sanitized) as T;
    return { success: true, data: parsed };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export function extractJsonFromMixed(raw: string): string {
  const sanitized = sanitizeLLMJson(raw);

  const objectStart = sanitized.indexOf("{");
  const arrayStart = sanitized.indexOf("[");

  let start: number;
  let endChar: string;

  if (objectStart === -1 && arrayStart === -1) {
    return sanitized;
  }

  if (objectStart === -1) {
    start = arrayStart;
    endChar = "]";
  } else if (arrayStart === -1) {
    start = objectStart;
    endChar = "}";
  } else if (arrayStart < objectStart) {
    start = arrayStart;
    endChar = "]";
  } else {
    start = objectStart;
    endChar = "}";
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < sanitized.length; i++) {
    const char = sanitized[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{" || char === "[") depth++;
    if (char === "}" || char === "]") depth--;

    if (depth === 0) {
      return sanitized.slice(start, i + 1);
    }
  }

  return sanitized.slice(start);
}

export function formatZodErrors(issues: { path: (string | number)[]; message: string }[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    })
    .join("\n");
}

export function getSchemaDescription(type: string): string {
  switch (type) {
    case "outline":
      return 'Array of objects with "title" (string), "type" (one of: cover, concept, example, formula, activity, quiz, summary), "notes" (string)';
    case "cover":
      return 'Object with "title" (string), "subtitle" (string), "gradeLabel" (string)';
    case "concept":
      return 'Object with "title" (string), "bullets" (string[], 1-8 items), "explanation" (string)';
    case "example":
      return 'Object with "title" (string), "scenario" (string), "steps" (string[]), "takeaway" (string)';
    case "formula":
      return 'Object with "title" (string), "formula" (string), "variables" (string[]), "solvedExample" (string)';
    case "activity":
      return 'Object with "title" (string), "instruction" (string), "materials" (string[]), "duration" (string)';
    case "quiz":
      return 'Object with "title" (string), "question" (string), "options" (string[], exactly 4), "answer" (string), "explanation" (string)';
    case "summary":
      return 'Object with "title" (string), "keyPoints" (string[], 1-8 items), "nextSteps" (string)';
    default:
      return 'Object with "title" (string), "bullets" (string[]), "explanation" (string)';
  }
}
