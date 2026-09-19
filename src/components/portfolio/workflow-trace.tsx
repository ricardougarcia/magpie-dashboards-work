"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import type { ProjectBlock } from "@/lib/portfolio-types";
import styles from "./workflow-trace.module.css";

type Handoff = { path: string; endX: number; endY: number; from: number; to: number; delay: number };

export function WorkflowTrace({ block }: { block: Extract<ProjectBlock, { type: "flow" }> }) {
  const list = useRef<HTMLOListElement>(null);
  const [drawing, setDrawing] = useState<{ width: number; height: number; handoffs: Handoff[] }>({ width: 0, height: 0, handoffs: [] });
  const [run, setRun] = useState(0);
  const [inspected, setInspected] = useState<number | null>(null);
  const introduced = useRef(false);
  const before = block.id === "legacy-flow";

  useEffect(() => {
    const element = list.current!;
    const measure = () => {
      const parent = element.getBoundingClientRect();
      const indices = [...element.querySelectorAll<HTMLElement>("[data-flow-index]")].map((index) => index.getBoundingClientRect());
      if (!parent.width || indices.length < 2) return;
      const vertical = getComputedStyle(element).flexDirection === "column";
      const handoffs = indices.slice(0, -1).map((index, position) => {
        const next = indices[position + 1];
        const y = index.top - parent.top + index.height / 2;
        const nextY = next.top - parent.top + next.height / 2;
        const start = index.right - parent.left + 12;
        const end = next.left - parent.left - 12;
        const mid = (start + end) / 2;
        const midY = (y + nextY) / 2;
        return {
          path: vertical
            ? `M 14 ${y} H 2 V ${midY - 3} M 2 ${midY + 3} V ${nextY} H 14`
            : `M ${start} ${y} H ${mid - 3} M ${mid + 3} ${y} H ${end}`,
          endX: vertical ? 14 : end,
          endY: vertical ? nextY : y,
          from: position, to: position + 1,
          // The pause is editorial emphasis, not a representation of elapsed work time.
          delay: position * 580 + (before && position >= 2 ? 340 : 0),
        };
      });
      setDrawing({ width: parent.width, height: parent.height, handoffs });
    };
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    for (const child of element.children) resize.observe(child);
    measure();
    if (typeof IntersectionObserver === "undefined") return () => resize.disconnect();
    const entry = new IntersectionObserver((entries) => {
      if (!introduced.current && entries.some((item) => item.isIntersecting)) {
        introduced.current = true;
        setRun(1);
        entry.disconnect();
      }
    }, { threshold: .15 });
    entry.observe(element);
    return () => { resize.disconnect(); entry.disconnect(); };
  }, [before]);

  return <figure id={block.id} className={styles.figure} data-workflow-trace data-trace-run={run} data-flow-before={before}>
    <figcaption className={styles.caption}>
      <span>{block.label}</span>
      <button type="button" onClick={() => { introduced.current = true; setRun((value) => value + 1); }} aria-label={`Replay ${block.label.toLowerCase()}`} aria-controls={`${block.id}-steps`}>[Trace workflow]</button>
    </figcaption>
    <div className={styles.drawing}>
      <ol ref={list} id={`${block.id}-steps`} className={styles.flow} onPointerLeave={() => setInspected(null)}>
        {block.steps.map((step, index) => <li key={step.id} id={step.id} data-flow-step={step.id} data-emphasis={!!step.emphasis} onPointerEnter={(event) => { if (event.pointerType !== "touch") setInspected(index); }}>
          <span className={styles.index} data-flow-index>{String(index + 1).padStart(2, "0")}</span>
          <div className={styles.copy}>{step.id === "new-create" || step.id === "new-match" ? <a className={styles.stepLink} href={step.id === "new-create" ? "#local-creation" : "#global-matching"}><strong>{step.label}<span aria-hidden="true" /></strong></a> : <strong>{step.label}</strong>}<span>{step.note}</span></div>
        </li>)}
      </ol>
      {drawing.handoffs.length > 0 && <svg key={run} className={styles.ink} width={drawing.width} height={drawing.height} aria-hidden="true" data-playing={run > 0}>
        {drawing.handoffs.map((handoff) => <g key={handoff.from} data-handoff data-near={inspected === handoff.from || inspected === handoff.to} style={{ "--handoff-delay": `${handoff.delay}ms` } as CSSProperties}>
          <path className={styles.route} d={handoff.path} />
          <path className={styles.traveler} data-flow-traveler d={handoff.path} pathLength="1" />
          <rect className={styles.receiver} x={handoff.endX - 1.5} y={handoff.endY - 1.5} width="3" height="3" />
        </g>)}
      </svg>}
    </div>
  </figure>;
}
