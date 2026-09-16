"use client";

import { useEffect, useRef, type ReactNode } from "react";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

// The narrative must finish even when a tall viewport leaves less scroll travel
// than the nominal animation interval.
export function pmfConvergenceProgress(joinDocumentTop: number, scrollY: number, viewport: number, maximumScroll: number) {
  const start = Math.max(0, joinDocumentTop - viewport * .84);
  const end = Math.min(maximumScroll, start + viewport * .55);
  if (end <= start) return scrollY >= end ? 1 : 0;
  return clamp((scrollY - start) / (end - start));
}

export function PmfInquiryMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const tracks = [...element.querySelectorAll<HTMLElement>("[data-pmf-track]")];
    const join = element.querySelector<HTMLElement>("[data-pmf-convergence]");
    if (!join || tracks.length !== 2) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let disposed = false;

    const update = () => {
      frame = 0;
      if (disposed) return;
      const viewport = window.innerHeight;
      const joinBounds = join.getBoundingClientRect();
      const origins = tracks.map((track) => {
        const bounds = track.getBoundingClientRect();
        const rail = getComputedStyle(track, "::before");
        const railTop = parseFloat(rail.top) || 0;
        const railLeft = parseFloat(rail.left) || 0;
        const progress = preference.matches ? 1 : clamp((viewport * .6 - bounds.top - railTop) / Math.max(1, bounds.height - railTop));
        track.style.setProperty("--pmf-line-progress", String(progress));
        return (bounds.left - joinBounds.left + railLeft) / Math.max(1, joinBounds.width) * 1000;
      });
      // Join the actual rail coordinates, including the stacked mobile track.
      const path = window.matchMedia("(max-width: 760px)").matches
        ? `M${origins[1]} 0 V35 C${origins[1]} 100 500 80 500 155 V180`
        : `M${origins[0]} 0 V20 H250 V45 C250 90 500 70 500 135 M${origins[1]} 0 V20 H750 V45 C750 90 500 70 500 135 M500 135 V180`;
      join.querySelectorAll("path").forEach((line) => { if (line.getAttribute("d") !== path) line.setAttribute("d", path); });
      const progress = preference.matches ? 1 : pmfConvergenceProgress(
        joinBounds.top + window.scrollY,
        window.scrollY,
        viewport,
        Math.max(0, document.documentElement.scrollHeight - viewport),
      );
      join.style.setProperty("--pmf-join", String(progress));
      join.dataset.arrived = String(progress > .95);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    tracks.forEach((track) => observer.observe(track));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    preference.addEventListener("change", schedule);
    document.fonts.ready.then(() => { if (!disposed) schedule(); });
    update();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      preference.removeEventListener("change", schedule);
    };
  }, []);

  return <div ref={root} data-pmf-inquiry-motion>{children}</div>;
}
