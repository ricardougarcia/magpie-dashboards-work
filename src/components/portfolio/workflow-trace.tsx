"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectBlock } from "@/lib/portfolio-types";
import styles from "./portfolio.module.css";

export function WorkflowTrace({ block }: { block: Extract<ProjectBlock, { type: "flow" }> }) {
  const list = useRef<HTMLOListElement>(null);
  const [trace, setTrace] = useState({ path: "", width: 0, height: 0 });
  const [run, setRun] = useState(0);
  const introduced = useRef(false);

  useEffect(() => {
    const element = list.current!;
    const measure = () => {
      const parent = element.getBoundingClientRect();
      const boxes = [...element.children].map((child) => child.getBoundingClientRect());
      if (!boxes.length || !parent.width) return;
      const vertical = getComputedStyle(element).flexDirection === "column";
      const first = boxes[0];
      const last = boxes.at(-1)!;
      // Follow the existing top edges on desktop, and the open margin on mobile.
      const path = vertical
        ? `M -14 ${first.top - parent.top + first.height / 2} V ${last.top - parent.top + last.height / 2} ` + boxes.map((box) => `M -14 ${box.top - parent.top + box.height / 2} H 0`).join(" ")
        : `M 0 .5 H ${last.right - parent.left}`;
      setTrace({ path, width: parent.width, height: parent.height });
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
  }, []);

  const replay = () => { introduced.current = true; setRun((value) => value + 1); };
  return <figure id={block.id} className={styles.flowFigure} data-workflow-trace data-trace-run={run}>
    <figcaption className={styles.flowCaption}>
      <span className={styles.eyebrow}>{block.label}</span>
      <button type="button" onClick={replay} aria-label={`Replay ${block.label.toLowerCase()}`} aria-controls={`${block.id}-steps`}>[Trace workflow]</button>
    </figcaption>
    <div className={styles.flowDrawing}>
      <ol ref={list} id={`${block.id}-steps`} className={styles.flow}>
        {block.steps.map((step, index) => <li key={step.id} id={step.id} className={step.emphasis ? styles.flowEmphasis : undefined}>
          <span className={styles.flowIndex}>{String(index + 1).padStart(2, "0")}</span>
          <strong>{step.label}</strong><span>{step.note}</span>
        </li>)}
      </ol>
      {trace.path && <svg key={run} className={styles.workflowInk} width={trace.width} height={trace.height} aria-hidden="true" data-playing={run > 0}>
        <path d={trace.path} pathLength="1" />
      </svg>}
    </div>
  </figure>;
}
