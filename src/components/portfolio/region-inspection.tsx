"use client";

import { useId, useState, type ReactNode } from "react";
import styles from "./region.module.css";

export function RegionInspection({ label, summary, insight, children }: { label: string; summary: string; insight: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return <div className={styles.inspection} data-expanded={expanded}
    onPointerEnter={(event) => { if (event.pointerType === "mouse") setExpanded(true); }}
    onPointerLeave={(event) => { if (!event.currentTarget.contains(document.activeElement)) setExpanded(false); }}
    onFocusCapture={(event) => { if (event.target.matches(":focus-visible")) setExpanded(true); }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false); }}>
    {children}
    <button className={styles.inspectButton} type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((value) => !value)}>
      <span>Inspect / {label}</span><span aria-hidden="true">{expanded ? "−" : "+"}</span>
    </button>
    {!expanded ? <div className={styles.insightRest}><p>{summary}</p></div> : null}
    <div id={id} className={styles.insight} hidden={!expanded}>
      <span className={styles.pixelMark} aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
      <p>{insight}</p>
    </div>
  </div>;
}
