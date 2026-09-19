"use client";

import { useRef, useState, type ReactNode } from "react";
import styles from "./pmf.module.css";

export function PmfCheckpoint({ id, label, title, reasoning, children }: { id: string; label: string; title: string; reasoning: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const pinned = useRef(false);
  const article = useRef<HTMLElement>(null);

  return <article
    ref={article}
    id={id}
    className={styles.checkpoint}
    data-pmf-checkpoint
    data-active={expanded}
    onPointerEnter={(event) => { if (event.pointerType !== "touch") setExpanded(true); }}
    onPointerLeave={() => { if (!pinned.current && !article.current?.contains(document.activeElement)) setExpanded(false); }}
    onFocusCapture={() => setExpanded(true)}
    onBlurCapture={(event) => { if (!pinned.current && !event.currentTarget.contains(event.relatedTarget)) setExpanded(false); }}
    onKeyDown={(event) => { if (event.key === "Escape" && !(event.target as HTMLElement).closest("dialog")) { pinned.current = false; setExpanded(false); } }}
  >
    <span className={styles.trackPoint} aria-hidden="true" />
    <h3 className={styles.checkpointHeading}>
      <button
        type="button"
        className={styles.checkpointToggle}
        aria-expanded={expanded}
        aria-controls={`${id}-reasoning`}
        onClick={() => { pinned.current = !pinned.current; setExpanded(pinned.current); }}
      >
        <span className={styles.meta}>{label}</span>
        <span className={styles.checkpointTitle}>{title}</span>
        <span className={styles.inspectHint}><span>Hover or tap to see the reasoning</span><i aria-hidden="true" /></span>
      </button>
    </h3>
    <div id={`${id}-reasoning`} className={styles.checkpointDetail} aria-hidden={!expanded}>
      <p>{reasoning}</p>
    </div>
    {children}
  </article>;
}
