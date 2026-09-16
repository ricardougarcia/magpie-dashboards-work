import { describe, expect, it } from "vitest";
import { pmfConvergenceProgress } from "./pmf-inquiry-motion";

describe("PMF closing convergence", () => {
  it("finishes at the bottom of a tall viewport even with insufficient nominal scroll travel", () => {
    expect(pmfConvergenceProgress(2400, 1820, 1180, 1820)).toBe(1);
  });
  it("retains a gradual interval and reverses when the reader scrolls back", () => {
    expect(pmfConvergenceProgress(2400, 1200, 1000, 2300)).toBe(0);
    const first = pmfConvergenceProgress(2400, 1600, 1000, 2300);
    const later = pmfConvergenceProgress(2400, 1900, 1000, 2300);
    expect(first).toBeGreaterThan(0);
    expect(later).toBeGreaterThan(first);
    expect(later).toBeLessThan(1);
    expect(pmfConvergenceProgress(2400, 1600, 1000, 2300)).toBe(first);
  });
  it("reaches the settled state for a page that needs no scrolling", () => {
    expect(pmfConvergenceProgress(450, 0, 1000, 0)).toBe(1);
  });
});
