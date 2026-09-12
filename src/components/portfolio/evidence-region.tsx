"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Artifact } from "@/lib/portfolio-types";
import styles from "./region.module.css";

const EvidenceContext = createContext<((id: string, active: boolean) => void) | null>(null);
export const useEvidenceTrace = () => useContext(EvidenceContext);
type Crop = NonNullable<Artifact["details"]>[number]["crop"];
type Entry = "idle" | "frames" | "wait-map" | "map" | "trace" | "wait-detail" | "detail" | "complete";
type Point = { x: number; y: number };
type Geometry = { path: string; source: Point; detail: Point; frames: Record<string, string> };
const FRAME_EASE = [0.22, 1, 0.36, 1] as const;

const compactQuery = "(max-width: 760px)";
const isCompact = () => typeof window.matchMedia === "function" && window.matchMedia(compactQuery).matches;
const serverCompact = () => false;
function subscribeCompact(callback: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(compactQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function EvidenceRegion({ children, crop, deferUntilVisible = false }: { children: ReactNode; crop?: Crop; deferUntilVisible?: boolean }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [entry, setEntry] = useState<Entry>("idle");
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const reduceMotion = useReducedMotion();
  const compact = useSyncExternalStore(subscribeCompact, isCompact, serverCompact);
  const region = useRef<HTMLDivElement>(null);
  const activate = useCallback((id: string, active: boolean) => {
    setActiveId((current) => active ? id : current === id ? null : current);
    // Inspection takes precedence over the introduction, including touch and focus.
    if (active) setEntry("complete");
  }, []);
  const drawing = !reduceMotion && entry !== "idle" && entry !== "complete";
  const tracing = drawing && ["trace", "wait-detail", "detail"].includes(entry);
  const active = activeId !== null;

  useLayoutEffect(() => {
    const root = region.current;
    if (!root || !crop) return;
    const map = root.querySelector<HTMLElement>("[data-evidence-map] img");
    const detail = root.querySelector<HTMLElement>('[data-artifact="C"] [data-artifact-mount]');
    const source = root.querySelector<HTMLElement>('[data-map-mount]');
    if (!map || !detail || !source) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      // Measure the unscaled mount to avoid feedback from the image transform.
      const mount = source.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight - mount.top) / (window.innerHeight + mount.height)));
      root.style.setProperty("--map-scale", String(reduceMotion ? 1 : 1 + progress * .012));
      const board = root.getBoundingClientRect();
      const image = map.getBoundingClientRect();
      const b = source.getBoundingClientRect();
      const c = detail.getBoundingClientRect();
      if (!image.width || !c.width) return;
      const narrow = c.left >= b.left && c.left < b.right;
      // Desktop uses the inter-column gutter; stacked artifacts use the sheet margin.
      const rail = narrow ? b.left - board.left - 10 : (c.right + b.left) / 2 - board.left;
      const sourcePoint = { x: image.left - board.left + image.width * crop.x, y: image.top - board.top + image.height * (crop.y + crop.height / 2) };
      const detailPoint = { x: (narrow ? c.left : c.right) - board.left, y: c.top - board.top + 22 };
      const frames: Record<string, string> = {};
      root.querySelectorAll<HTMLElement>("[data-artifact]").forEach((plate) => {
        const rect = plate.querySelector<HTMLElement>("[data-artifact-mount]")!.getBoundingClientRect();
        const left = rect.left - board.left, top = rect.top - board.top;
        const right = rect.right - board.left, bottom = rect.bottom - board.top;
        frames[plate.dataset.artifact!] = plate.dataset.artifact === "C"
          ? `M ${detailPoint.x} ${detailPoint.y} V ${top} H ${detailPoint.x + (narrow ? 36 : -36)}`
          : `M ${left} ${top + 22} V ${top} H ${left + 48}${plate.dataset.artifact === "B" ? ` M ${right - 32} ${bottom} H ${right} V ${bottom - 16}` : ""}`;
      });
      const next = { path: `M ${sourcePoint.x} ${sourcePoint.y} H ${rail} V ${detailPoint.y} H ${detailPoint.x}`, source: sourcePoint, detail: detailPoint, frames };
      setGeometry((current) => current?.path === next.path && JSON.stringify(current.frames) === JSON.stringify(frames) ? current : next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    [root, map, ...root.querySelectorAll<HTMLElement>("[data-artifact-mount]")].forEach((element) => observer?.observe(element));
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      observer?.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule); window.removeEventListener("scroll", schedule);
      root.style.removeProperty("--map-scale");
    };
  }, [crop, reduceMotion]);

  useEffect(() => {
    const root = region.current;
    if (!root || reduceMotion || !geometry) return;
    if (!compact && !deferUntilVisible && entry === "idle") {
      const frame = requestAnimationFrame(() => setEntry("frames"));
      return () => cancelAnimationFrame(frame);
    }
    const target = entry === "idle" ? "A" : entry === "wait-map" ? "B" : entry === "wait-detail" ? "C" : null;
    const next: Entry = entry === "idle" ? "frames" : entry === "wait-map" ? "map" : "detail";
    if (!target || typeof IntersectionObserver === "undefined") return;
    const plate = root.querySelector(`[data-artifact="${target}"]`);
    if (!plate) return;
    const observer = new IntersectionObserver(([record]) => {
      if (!record.isIntersecting) return;
      observer.disconnect();
      setEntry(next);
    }, { threshold: 0.12 });
    observer.observe(plate);
    return () => observer.disconnect();
  }, [reduceMotion, compact, geometry, entry, deferUntilVisible]);

  return <EvidenceContext value={activate}>
    <div ref={region} className={styles.constellation} data-evidence-active={active || tracing} data-entry={drawing ? entry : "complete"}>
      {children}
      {geometry && (active || tracing) ? <svg className={styles.evidenceTrace} aria-hidden="true" data-evidence-trace>
        <motion.path key={active ? "inspection" : "entry"} d={geometry.path}
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: FRAME_EASE }}
          onAnimationComplete={() => { if (!active && entry === "trace") setEntry(compact ? "wait-detail" : "detail"); }} />
        <rect x={geometry.source.x - 2} y={geometry.source.y - 2} width="4" height="4" />
        <rect x={geometry.detail.x - 2} y={geometry.detail.y - 2} width="4" height="4" />
      </svg> : null}
      {drawing && geometry ? <svg className={styles.entryFrames} aria-hidden="true" data-entry-frames>
        {["A", "B", "C"].filter((label) => geometry.frames[label] && (label !== "C" || entry === "detail") && (label !== "B" || !compact || !["frames", "wait-map"].includes(entry))).map((label) => <motion.path
          key={label} d={geometry.frames[label]} data-frame={label}
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: label === "A" ? 0.68 : label === "B" ? 0.82 : 0.62, delay: label === "B" ? 0.09 : 0, ease: FRAME_EASE }}
          onAnimationComplete={() => {
            if (label === "A" && compact) setEntry((current) => current === "frames" ? "wait-map" : current);
            if (label === "B") setEntry((current) => current === "frames" || current === "map" ? "trace" : current);
            if (label === "C") setEntry("complete");
          }} />)}
      </svg> : null}
    </div>
  </EvidenceContext>;
}
