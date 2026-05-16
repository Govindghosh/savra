import type { GenerateRequestBody } from "../validators/generate.js";
import type { StructuredSlide } from "../validators/ai-output.js";
import { generateOutline } from "./outline-generator.js";
import { generateSlideContent } from "./slide-generator.js";

type ProgressCallback = (progress: number) => Promise<void>;

type GenerationResult = {
  slides: StructuredSlide[];
};

export async function generatePresentation(
  request: GenerateRequestBody,
  onProgress: ProgressCallback
): Promise<GenerationResult> {
  await onProgress(10);

  const outline = await generateOutline(request);
  await onProgress(25);

  const slides: StructuredSlide[] = [];
  const context = {
    topic: request.topic,
    subject: request.subject,
    grade: request.grade,
    totalSlides: outline.length
  };

  for (let i = 0; i < outline.length; i++) {
    const slide = await generateSlideContent(outline[i], i, context);
    slides.push(slide);

    const slideProgress = 25 + Math.round(((i + 1) / outline.length) * 65);
    await onProgress(Math.min(slideProgress, 90));
  }

  await onProgress(90);

  return { slides };
}
