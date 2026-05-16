import path from "node:path";
import fs from "node:fs/promises";
import JSZip from "jszip";
import { PptRenderer } from "../ppt/renderer.js";
import type { StructuredSlide } from "../validators/ai-output.js";

const FILES_DIR = "/app/public/files";


function createSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "presentation";
}

function createFileName(jobId: string, topic: string, grade: number) {
  const date = new Date().toISOString().slice(0, 10);
  return `${createSlug(topic)}-grade-${grade}-${date}-${jobId.slice(-6)}.pptx`;
}

function getTransitionXml(type: StructuredSlide["type"]) {
  switch (type) {
    case "cover":
      return '<p:transition spd="med" advClick="1"><p:fade/></p:transition>';
    case "concept":
      return '<p:transition spd="med" advClick="1"><p:wipe dir="l"/></p:transition>';
    case "example":
      return '<p:transition spd="med" advClick="1"><p:push dir="l"/></p:transition>';
    case "formula":
      return '<p:transition spd="med" advClick="1"><p:split orient="vert" dir="in"/></p:transition>';
    case "quiz":
      return '<p:transition spd="fast" advClick="1"><p:cover dir="u"/></p:transition>';
    case "activity":
      return '<p:transition spd="med" advClick="1"><p:wipe dir="u"/></p:transition>';
    case "summary":
      return '<p:transition spd="med" advClick="1"><p:fade/></p:transition>';
    default:
      return '<p:transition spd="med" advClick="1"><p:fade/></p:transition>';
  }
}

async function applySlideTransitions(filePath: string, slides: StructuredSlide[]) {
  const data = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(data);

  await Promise.all(
    slides.map(async (slide, index) => {
      const file = zip.file(`ppt/slides/slide${index + 1}.xml`);
      if (!file) return;

      const xml = await file.async("string");
      const withoutExisting = xml.replace(/<p:transition[\s\S]*?<\/p:transition>/, "");
      const transitionXml = getTransitionXml(slide.type);
      const updated = withoutExisting.includes("</p:cSld>")
        ? withoutExisting.replace("</p:cSld>", `</p:cSld>${transitionXml}`)
        : withoutExisting;

      zip.file(`ppt/slides/slide${index + 1}.xml`, updated);
    })
  );

  const output = await zip.generateAsync({ type: "nodebuffer" });
  await fs.writeFile(filePath, output);
}

export async function generatePptFile(jobId: string, topic: string, grade: number, slides: StructuredSlide[]): Promise<string> {
  await fs.mkdir(FILES_DIR, { recursive: true });

  const renderer = new PptRenderer(topic);
  renderer.addSlides(slides);

  const fileName = createFileName(jobId, topic, grade);
  const filePath = path.join(FILES_DIR, fileName);

  await renderer.save(filePath);
  await applySlideTransitions(filePath, slides);

  return fileName;
}
