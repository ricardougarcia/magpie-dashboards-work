"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useEvidenceTrace } from "./evidence-region";
import styles from "./region.module.css";

// A deterministic tonal pass that fully settles; no idle animation loop.
const PIXEL_TONES = ["#111311", "#191b19", "#2b2d2b", "#3d3f3d"] as const;
// Match public-timeline.tsx's field, timing and tones without changing the showcase.
function seededUnit(index: number, seed: number, salt: number) {
  let value = Math.imul(index + 1 + salt * 97, 0x9e3779b1) ^ Math.imul(seed + 11, 0x5f356495);
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b);
  value ^= value >>> 13;
  return (value >>> 0) / 0xffffffff;
}
const PIXELS = Array.from({ length: 256 }, (_, index) => ({
  "--pixel-in": `${Math.round(index % 16 * 34 + seededUnit(index, 0, 1) * 190)}ms`,
  "--pixel-in-duration": `${Math.round(190 + seededUnit(index, 0, 2) * 260)}ms`,
  "--pixel-out": `${Math.round((15 - index % 16) * 24 + seededUnit(index, 0, 3) * 130)}ms`,
  "--pixel-out-duration": `${Math.round(150 + seededUnit(index, 0, 4) * 170)}ms`,
  "--pixel-tone": PIXEL_TONES[Math.floor(seededUnit(index, 0, 5) * PIXEL_TONES.length)],
}) as CSSProperties);

export function RegionInspection({ label, summary, insight, children, evidence = false, locator, reference }: {
  label: string; summary: string; insight: string; children: ReactNode; evidence?: boolean; locator?: ReactNode; reference?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const setTrace = useEvidenceTrace();
  const update = useCallback((next: boolean) => {
    setExpanded(next);
    if (evidence) setTrace?.(id, next);
  }, [evidence, id, setTrace]);
  useEffect(() => () => { if (evidence) setTrace?.(id, false); }, [evidence, id, setTrace]);
  useEffect(() => {
    if (!expanded) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) update(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [expanded, update]);
  return <div ref={root} className={styles.inspection} data-expanded={expanded}
    onPointerEnter={(event) => { if (event.pointerType === "mouse") update(true); }}
    onPointerLeave={(event) => {
      if (event.pointerType !== "mouse") return;
      if (!event.currentTarget.contains(document.activeElement)) update(false);
    }}
    onFocusCapture={(event) => { if (event.target.matches(":focus-visible")) update(true); }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) update(false); }}
    onKeyDown={(event) => { if (event.key === "Escape") update(false); }}>
    {children}
    <button className={styles.inspectButton} type="button" aria-expanded={expanded} aria-controls={id} onClick={() => update(!expanded)}>
      <span>Inspect / {label}</span><span className={styles.inspectState} aria-hidden="true">[{expanded ? "Close −" : "Inspect +"}]</span>
    </button>
    <div className={styles.annotation}>
      <div className={styles.acquisition} aria-hidden="true">{PIXELS.map((style, index) => <i key={index} style={style} />)}</div>
      <div className={styles.insightRest} aria-hidden={expanded} data-inactive={expanded}>{reference ? <span className={styles.annotationReference}>{reference}.01 / {reference === "B" ? "What to notice" : "Source note"}</span> : null}<p>{summary}</p></div>
      <div id={id} className={styles.insight} aria-hidden={!expanded} data-inactive={!expanded}>
        <div>{reference ? <span className={styles.annotationReference}>{reference}.02 / Inspection note</span> : null}<p>{insight}</p></div>
        {locator}
      </div>
    </div>
  </div>;
}
