"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useEvidenceTrace } from "./evidence-region";
import { PixelAcquisition } from "./pixel-acquisition";
import styles from "./region.module.css";

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
    const dismiss = (event: KeyboardEvent) => { if (event.key === "Escape") update(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", dismiss);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", dismiss);
    };
  }, [expanded, update]);
  return <div ref={root} className={styles.inspection} data-expanded={expanded}
    onPointerEnter={(event) => { if (event.pointerType === "mouse") update(true); }}
    onPointerLeave={(event) => {
      if (event.pointerType !== "mouse") return;
      if (!event.currentTarget.contains(document.activeElement)) update(false);
    }}
    onFocusCapture={(event) => { if (event.target.matches(":focus-visible")) update(true); }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) update(false); }}>
    {children}
    <button className={styles.inspectButton} type="button" aria-label={`Inspect / ${label}`} aria-expanded={expanded} aria-controls={id} onClick={() => update(!expanded)}>
      <span>Inspect / {label}</span><span className={styles.inspectState} aria-hidden="true">[{expanded ? "Close −" : "Inspect +"}]</span>
    </button>
    <div className={styles.annotation}>
      <PixelAcquisition active={expanded} />
      <div className={styles.insightRest} aria-hidden={expanded} data-inactive={expanded}>{reference ? <span className={styles.annotationReference}>{reference}.01 / {reference === "B" ? "What to notice" : "Source note"}</span> : null}<p>{summary}</p></div>
      <div id={id} className={styles.insight} aria-hidden={!expanded} data-inactive={!expanded}>
        <div>{reference ? <span className={styles.annotationReference}>{reference}.02 / Inspection note</span> : null}<p>{insight}</p></div>
        {locator}
      </div>
    </div>
  </div>;
}
