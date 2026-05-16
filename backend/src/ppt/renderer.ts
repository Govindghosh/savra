import PptxGenJS from "pptxgenjs";
import { PPT_COLORS, PPT_FONTS } from "./styles.js";
import type { StructuredSlide } from "../validators/ai-output.js";

type Slide = any;

const SLIDE_W = 10;
const SLIDE_H = 5.625;
const FOOTER_Y = 5.25;
const CONTENT_BOTTOM = 5.05;

function text(value: unknown) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clip(value: unknown, max: number) {
  const clean = text(value);
  return clean.length > max ? `${clean.slice(0, Math.max(0, max - 3)).trim()}...` : clean;
}

function estimateLines(value: string, charsPerLine: number) {
  return Math.max(1, Math.ceil(value.length / charsPerLine));
}

function titleSize(value: string, base = 30) {
  return clamp(base - Math.floor(value.length / 18) * 2, 18, base);
}

function bodySize(items: string[], base = 16) {
  const longest = items.reduce((max, item) => Math.max(max, item.length), 0);
  return clamp(base - Math.floor(longest / 70) * 2 - Math.max(0, items.length - 5), 11, base);
}

function addTitle(slide: Slide, title: unknown, color = PPT_COLORS.PRIMARY) {
  const clean = clip(title, 105);
  slide.addText(clean, {
    x: 0.55,
    y: 0.35,
    w: 8.9,
    h: 0.72,
    fontSize: titleSize(clean),
    color,
    bold: true,
    fontFace: PPT_FONTS.TITLE,
    margin: 0.02,
    fit: "shrink",
    breakLine: false
  });
}

function addFooter(slide: Slide, topic: string, index: number) {
  slide.addShape("line", {
    x: 0.55,
    y: 5.16,
    w: 8.9,
    h: 0,
    line: { color: "D8DEE9", width: 0.6 }
  });
  slide.addText(clip(topic, 80), {
    x: 0.55,
    y: FOOTER_Y,
    w: 7.25,
    h: 0.22,
    fontSize: 8,
    color: "64748B",
    margin: 0
  });
  slide.addText(String(index), {
    x: 8.55,
    y: FOOTER_Y,
    w: 0.9,
    h: 0.22,
    fontSize: 8,
    color: "64748B",
    align: "right",
    margin: 0
  });
}

function addBodyText(slide: Slide, value: unknown, x: number, y: number, w: number, h: number, fontSize = 15, color = PPT_COLORS.TEXT_DARK) {
  slide.addText(clip(value, Math.round(w * h * 95)), {
    x,
    y,
    w,
    h,
    fontSize,
    color,
    fontFace: PPT_FONTS.BODY,
    margin: 0.08,
    breakLine: false,
    fit: "shrink",
    valign: "mid"
  });
}

function addBulletList(slide: Slide, items: unknown[], x: number, y: number, w: number, maxH: number, baseFont = 16) {
  const cleanItems = items.map((item) => clip(item, 130)).filter(Boolean).slice(0, 6);
  const fontSize = bodySize(cleanItems, baseFont);
  let currentY = y;
  const charsPerLine = Math.max(32, Math.floor(w * 12));

  for (const item of cleanItems) {
    const lineCount = estimateLines(item, charsPerLine);
    const itemH = clamp(lineCount * (fontSize / 44) + 0.14, 0.34, 0.78);

    if (currentY + itemH > y + maxH) {
      break;
    }

    slide.addText(item, {
      x,
      y: currentY,
      w,
      h: itemH,
      fontSize,
      color: PPT_COLORS.TEXT_DARK,
      fontFace: PPT_FONTS.BODY,
      bullet: { indent: 12 },
      margin: 0.03,
      fit: "shrink"
    });

    currentY += itemH + 0.1;
  }
}

function addCard(slide: Slide, x: number, y: number, w: number, h: number, fill = "F8FAFC", line = "CBD5E1") {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    rectRadius: 0.06,
    fill: { color: fill },
    line: { color: line, width: 0.8 }
  });
}

export class PptRenderer {
  private pres: any;
  private slideIndex = 0;

  constructor(private topic: string) {
    this.pres = new (PptxGenJS as any)();
    this.pres.title = this.topic;
    this.pres.subject = "Educational presentation";
    this.pres.company = "Savra";
    this.pres.lang = "en-US";
    this.pres.layout = "LAYOUT_16x9";
    this.pres.author = "Savra";
  }

  public addSlides(slides: StructuredSlide[]) {
    for (const slideData of slides) {
      this.renderSlide(slideData);
    }
  }

  private renderSlide(slideData: StructuredSlide) {
    this.slideIndex += 1;
    const slide = this.pres.addSlide();
    slide.background = { color: "FFFFFF" };

    switch (slideData.type) {
      case "cover":
        this.renderCover(slide, slideData.content as any);
        break;
      case "concept":
        this.renderConcept(slide, slideData.content as any);
        break;
      case "example":
        this.renderExample(slide, slideData.content as any);
        break;
      case "formula":
        this.renderFormula(slide, slideData.content as any);
        break;
      case "quiz":
        this.renderQuiz(slide, slideData.content as any);
        break;
      case "activity":
        this.renderActivity(slide, slideData.content as any);
        break;
      case "summary":
        this.renderSummary(slide, slideData.content as any);
        break;
      default:
        this.renderGeneric(slide, slideData.content as any);
    }

    addFooter(slide, this.topic, this.slideIndex);
  }

  private renderCover(slide: Slide, content: any) {
    slide.background = { color: PPT_COLORS.PRIMARY };
    slide.addShape("rect", {
      x: 0,
      y: 4.7,
      w: SLIDE_W,
      h: 0.95,
      fill: { color: PPT_COLORS.SECONDARY, transparency: 16 },
      line: { color: PPT_COLORS.SECONDARY, transparency: 100 }
    });

    const title = clip(content.title, 95);
    slide.addText(title, {
      x: 0.85,
      y: 1.45,
      w: 8.3,
      h: 1.35,
      fontSize: titleSize(title, 40),
      color: PPT_COLORS.TEXT_LIGHT,
      align: "center",
      bold: true,
      fontFace: PPT_FONTS.TITLE,
      margin: 0.05,
      fit: "shrink"
    });
    slide.addText(clip(content.subtitle, 140), {
      x: 1.3,
      y: 3.0,
      w: 7.4,
      h: 0.72,
      fontSize: 18,
      color: "D7EAFB",
      align: "center",
      fontFace: PPT_FONTS.BODY,
      margin: 0.05,
      fit: "shrink"
    });
    slide.addText(clip(content.gradeLabel, 60), {
      x: 1.6,
      y: 4.05,
      w: 6.8,
      h: 0.35,
      fontSize: 12,
      color: PPT_COLORS.TEXT_LIGHT,
      align: "center",
      bold: true,
      margin: 0.02
    });
  }

  private renderConcept(slide: Slide, content: any) {
    addTitle(slide, content.title);
    addBulletList(slide, content.bullets ?? [], 0.75, 1.22, 8.6, 2.65, 16);
    addCard(slide, 0.65, 4.05, 8.7, 0.85, "EEF6FF", "B7D7F4");
    addBodyText(slide, content.explanation, 0.82, 4.16, 8.35, 0.58, 12, PPT_COLORS.PRIMARY);
  }

  private renderExample(slide: Slide, content: any) {
    addTitle(slide, content.title, PPT_COLORS.SECONDARY);
    slide.addText("Scenario", { x: 0.65, y: 1.22, w: 2.4, h: 0.25, fontSize: 12, bold: true, color: PPT_COLORS.ACCENT, margin: 0 });
    addCard(slide, 0.65, 1.52, 8.7, 1.0, "FFF7ED", "FED7AA");
    addBodyText(slide, content.scenario, 0.82, 1.68, 8.35, 0.62, 14);

    const steps = Array.isArray(content.steps) ? content.steps.slice(0, 4) : [];
    slide.addText("Steps", { x: 0.65, y: 2.75, w: 2.4, h: 0.25, fontSize: 12, bold: true, color: PPT_COLORS.ACCENT, margin: 0 });
    addBulletList(slide, steps, 0.78, 3.07, 4.25, 1.42, 13);
    addCard(slide, 5.35, 3.02, 4.0, 1.48, "F0FDF4", "BBF7D0");
    slide.addText("Key takeaway", { x: 5.55, y: 3.18, w: 3.6, h: 0.22, fontSize: 11, bold: true, color: PPT_COLORS.SUCCESS, margin: 0 });
    addBodyText(slide, content.takeaway, 5.5, 3.48, 3.65, 0.72, 12, PPT_COLORS.TEXT_DARK);
  }

  private renderFormula(slide: Slide, content: any) {
    addTitle(slide, content.title);
    addCard(slide, 0.85, 1.32, 8.3, 0.95, PPT_COLORS.PRIMARY, PPT_COLORS.PRIMARY);
    slide.addText(clip(content.formula, 95), {
      x: 1.05,
      y: 1.48,
      w: 7.9,
      h: 0.55,
      fontSize: titleSize(text(content.formula), 28),
      color: "FFFFFF",
      align: "center",
      bold: true,
      margin: 0.02,
      fit: "shrink"
    });

    slide.addText("Variables", { x: 0.7, y: 2.55, w: 3.7, h: 0.28, fontSize: 13, bold: true, color: PPT_COLORS.ACCENT, margin: 0 });
    addBulletList(slide, content.variables ?? [], 0.88, 2.95, 3.95, 1.75, 12);
    slide.addText("Solved example", { x: 5.25, y: 2.55, w: 3.7, h: 0.28, fontSize: 13, bold: true, color: PPT_COLORS.ACCENT, margin: 0 });
    addCard(slide, 5.15, 2.92, 4.1, 1.75, "F8FAFC", "CBD5E1");
    addBodyText(slide, content.solvedExample, 5.32, 3.08, 3.75, 1.25, 12);
  }

  private renderQuiz(slide: Slide, content: any) {
    slide.background = { color: PPT_COLORS.QUIZ_BG };
    slide.addText("Quick Quiz", { x: 0.55, y: 0.28, w: 2.2, h: 0.3, fontSize: 15, color: PPT_COLORS.SECONDARY, bold: true, margin: 0 });
    const question = clip(content.question, 150);
    slide.addText(question, {
      x: 0.55,
      y: 0.78,
      w: 8.9,
      h: 0.82,
      fontSize: titleSize(question, 24),
      bold: true,
      color: PPT_COLORS.PRIMARY,
      margin: 0.03,
      fit: "shrink"
    });

    const options = Array.isArray(content.options) ? content.options.slice(0, 4) : [];
    options.forEach((option: string, idx: number) => {
      const row = Math.floor(idx / 2);
      const col = idx % 2;
      const x = 0.65 + col * 4.45;
      const y = 1.95 + row * 1.15;
      addCard(slide, x, y, 4.25, 0.85, "FFFFFF", "93C5FD");
      addBodyText(slide, option, x + 0.16, y + 0.12, 3.92, 0.45, 13);
    });

    addCard(slide, 0.65, 4.38, 8.8, 0.55, "EFF6FF", "BFDBFE");
    addBodyText(slide, `Answer: ${clip(content.answer, 12)} - ${clip(content.explanation, 100)}`, 0.82, 4.48, 8.45, 0.28, 10, PPT_COLORS.PRIMARY);
  }

  private renderActivity(slide: Slide, content: any) {
    addTitle(slide, content.title, PPT_COLORS.ACCENT);
    addCard(slide, 0.65, 1.25, 8.7, 1.18, "FFF7ED", "FDBA74");
    addBodyText(slide, content.instruction, 0.85, 1.45, 8.3, 0.72, 15);

    slide.addText("Materials", { x: 0.7, y: 2.75, w: 3.7, h: 0.28, fontSize: 13, bold: true, color: PPT_COLORS.ACCENT, margin: 0 });
    addBulletList(slide, content.materials ?? [], 0.88, 3.1, 4.0, 1.18, 12);
    addCard(slide, 5.15, 3.05, 4.1, 1.1, "EEF6FF", "BFDBFE");
    slide.addText("Duration", { x: 5.35, y: 3.22, w: 3.6, h: 0.24, fontSize: 12, bold: true, color: PPT_COLORS.SECONDARY, margin: 0 });
    addBodyText(slide, content.duration, 5.35, 3.55, 3.6, 0.35, 15, PPT_COLORS.PRIMARY);
  }

  private renderSummary(slide: Slide, content: any) {
    addTitle(slide, content.title);
    addBulletList(slide, content.keyPoints ?? [], 0.75, 1.2, 8.6, 2.55, 15);
    addCard(slide, 0.65, 4.0, 8.7, 0.88, "F0FDF4", "BBF7D0");
    slide.addText("Next steps", { x: 0.85, y: 4.14, w: 2.4, h: 0.22, fontSize: 11, bold: true, color: PPT_COLORS.SUCCESS, margin: 0 });
    addBodyText(slide, content.nextSteps, 0.85, 4.42, 8.15, 0.28, 11, PPT_COLORS.TEXT_DARK);
  }

  private renderGeneric(slide: Slide, content: any) {
    addTitle(slide, content.title || "Slide");
    addBulletList(slide, content.bullets ?? [content.explanation ?? content.notes ?? ""], 0.75, 1.25, 8.6, CONTENT_BOTTOM - 1.45, 15);
  }

  public async save(filePath: string): Promise<string> {
    return this.pres.writeFile({ fileName: filePath });
  }
}
