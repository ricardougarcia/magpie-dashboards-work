"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useEvidenceTrace } from "./evidence-region";
import styles from "./region.module.css";

// A deterministic tonal pass that fully settles; no idle animation loop.
const PIXELS = Array.from({ length: 192 }, (_, index) => {
  const noise = ((Math.imul(index + 17, 2654435761) >>> 0) % 997) / 997;
  return { "--acquire-delay": `${(index % 32) * 4 + noise * 65}ms`, "--acquire-tone": .025 + noise * .055 } as CSSProperties;
});

export function RegionInspection({ label, summary, insight, children, evidence = false, locator, reference }: {
  label: string; summary: string; insight: string; children: ReactNode; evidence?: boolean; locator?: ReactNode; reference?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const setTrace = useEvidenceTrace();
  const update = useCallback((next: boolean) => {
    clearTimeout(hoverTimer.current);
    setExpanded(next);
    if (evidence) setTrace?.(next);
  }, [evidence, setTrace]);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  useEffect(() => {
    if (!expanded) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) update(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [expanded, update]);
  return <div ref={root} className={styles.inspection} data-expanded={expanded}
    onPointerEnter={(event) => {
      if (event.pointerType === "mouse") {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => update(true), 120);
      }
    }}
    onPointerLeave={(event) => {
      if (event.pointerType !== "mouse") return;
      clearTimeout(hoverTimer.current);
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
      <div className={styles.insightRest} aria-hidden={expanded} data-inactive={expanded}>{reference ? <span className={styles.annotationReference}>{reference}.01 / {reference === "A" ? "What to notice" : "Source note"}</span> : null}<p>{summary}</p></div>
      <div id={id} className={styles.insight} aria-hidden={!expanded} data-inactive={!expanded}>
        <div className={styles.acquisition} aria-hidden="true">{PIXELS.map((style, index) => <i key={index} style={style} />)}</div>
        <div>{reference ? <span className={styles.annotationReference}>{reference}.02 / Inspection note</span> : null}<p>{insight}</p></div>
        {locator}
      </div>
    </div>
  </div>;
}
