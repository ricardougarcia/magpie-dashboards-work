"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Artifact } from "@/lib/portfolio-types";
import styles from "./region.module.css";

const EvidenceContext = createContext<((active: boolean) => void) | null>(null);
export const useEvidenceTrace = () => useContext(EvidenceContext);
type Crop = NonNullable<Artifact["details"]>[number]["crop"];

export function EvidenceRegion({ children, crop }: { children: ReactNode; crop?: Crop }) {
  const [active, setActive] = useState(false);
  const [path, setPath] = useState("");
  const region = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = region.current;
    if (!active || !crop || !root) return;
    const source = root.querySelector<HTMLElement>("[data-evidence-source]");
    const map = root.querySelector<HTMLElement>("[data-evidence-map]");
    const detail = root.querySelector<HTMLElement>("[data-evidence-detail]");
    if (!source || !map || !detail) return;
    let frame = 0;
    const measure = () => {
      const board = root.getBoundingClientRect();
      const a = source.getBoundingClientRect();
      const image = map.getBoundingClientRect();
      const c = detail.getBoundingClientRect();
      // Route through the left margin, never through another Artifact.
      const rail = Math.min(a.left, c.left) - board.left - 12;
      const sourceY = image.top - board.top + image.height * (crop.y + crop.height / 2);
      setPath(`M ${c.left - board.left} ${c.top - board.top + 21} H ${rail} V ${sourceY} H ${a.left - board.left}`);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    measure();
    const observer = new ResizeObserver(schedule);
    [root, source, map, detail].forEach((element) => observer.observe(element));
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [active, crop]);
  return <EvidenceContext value={setActive}>
    <div ref={region} className={styles.constellation} data-evidence-active={active}>
      {children}
      {active && path ? <svg className={styles.evidenceTrace} aria-hidden="true">
        <path d={path} pathLength="1" />
      </svg> : null}
    </div>
  </EvidenceContext>;
}
