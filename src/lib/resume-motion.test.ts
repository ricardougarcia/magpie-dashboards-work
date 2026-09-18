import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  RESUME_DURATION,
  createResumeSchedule,
  resumeGraphicBounds,
  resumeGraphicMatrix,
  type ResumeDocument,
  type ResumeTreatment,
} from "./resume-motion";

const resume = JSON.parse(readFileSync(resolve(process.cwd(), "public/resume-assets/resume-vectors.json"), "utf8")) as ResumeDocument;
const treatments: ResumeTreatment[] = ["construction-1", "construction-2", "lines-1", "lines-2"];

describe("resume drawing schedules", () => {
  for (const treatment of treatments) {
    it(`${treatment} schedules every visible source item after the blank opening and completes within 8.4 seconds`, () => {
      for (const page of resume.pages) {
        const expectedIds = [
          ...page.glyphs.filter((glyph) => page.definitions[glyph.key].d.trim()).map((glyph) => glyph.id),
          ...page.graphics.map((graphic) => graphic.id),
        ];
        const schedule = createResumeSchedule(page, treatment);
        expect(schedule.map((entry) => entry.id).sort()).toEqual(expectedIds.sort());
        expect(new Set(schedule.map((entry) => entry.id)).size).toBe(schedule.length);
        for (const entry of schedule) {
          expect(entry.start).toBeGreaterThanOrEqual(180);
          expect(entry.end).toBeGreaterThan(entry.start);
          expect(entry.end).toBeLessThanOrEqual(RESUME_DURATION - 180);
        }
        expect(Math.min(...schedule.map((entry) => entry.start))).toBeLessThan(800);
        expect(Math.max(...schedule.map((entry) => entry.end))).toBeGreaterThan(7000);
      }
    });
  }

  it("uses visual reading order, despite the PDF extracting the footer first", () => {
    for (const treatment of ["construction-1", "lines-1"] as const) {
      for (const page of resume.pages) {
        const schedule = new Map(createResumeSchedule(page, treatment).map((entry) => [entry.id, entry]));
        const footer = page.glyphs.find((glyph) => glyph.y > 750 && glyph.text.trim())!;
        const heading = page.glyphs.find((glyph) => glyph.y < 50 && glyph.text.trim())!;
        expect(schedule.get(footer.id)!.start).toBeGreaterThan(schedule.get(heading.id)!.start + 4000);
        // The first registration mark sits at y=18, though its raw PDF y is 774.
        expect(schedule.get(page.graphics[0].id)!.start).toBe(180);
      }
    }
  });

  it("keeps the coordinate field deterministic while changing the line treatment's assembly order", () => {
    const page = resume.pages[0];
    expect(createResumeSchedule(page, "construction-2")).toEqual(createResumeSchedule(page, "construction-2"));
    const sequential = createResumeSchedule(page, "lines-1").sort((a, b) => a.start - b.start).map((entry) => entry.id);
    const sectional = createResumeSchedule(page, "lines-2").sort((a, b) => a.start - b.start).map((entry) => entry.id);
    expect(sectional).not.toEqual(sequential);
  });
});

describe("original PDF graphic transforms", () => {
  it("converts the PDF's inverted y axis before deciding when to draw", () => {
    expect(resumeGraphicBounds(resume.pages[0].graphics[0])).toEqual([18, 18, 28, 18]);
    expect(resumeGraphicBounds(resume.pages[0].graphics[4])).toEqual([18, 774, 28, 774]);
  });

  it("retains affine rotation, scale, and translation instead of only flipping y", () => {
    expect(resumeGraphicBounds({ id: "affine", attrs: { transform: "matrix(0,2,-3,0,10,20)" }, bounds: [1, 2, 4, 5] }))
      .toEqual([-5, 22, 4, 28]);
    expect(resumeGraphicMatrix()).toEqual([1, 0, 0, 1, 0, 0]);
    expect(() => resumeGraphicMatrix("rotate(90)")).toThrow("Unsupported");
    expect(() => resumeGraphicMatrix("matrix(1, 0, NaN, 1, 0, 0)")).toThrow("Invalid");
  });
});
