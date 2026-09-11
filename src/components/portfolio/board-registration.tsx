"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./board-sheet.module.css";

const pad = (value: number) => String(Math.max(0, Math.round(value))).padStart(4, "0");
const INITIAL = { width: 0, y: 0, progress: 0 };

/** Registration follows native scrolling; it does not introduce a pan surface. */
export function BoardRegistration() {
  const root = useRef<HTMLDivElement>(null);
  const [registration, setRegistration] = useState(INITIAL);

  useEffect(() => {
    const sheet = root.current?.closest<HTMLElement>("[data-board-sheet]");
    if (!sheet) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const bounds = sheet.getBoundingClientRect();
      const y = Math.max(0, -bounds.top);
      setRegistration({
        width: Math.round(bounds.width),
        y,
        progress: Math.min(100, Math.round(y / Math.max(1, bounds.height - window.innerHeight) * 100)),
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(sheet);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return <>
    <div className={styles.edgeRuler} aria-hidden="true" />
    <div ref={root} className={styles.registration} aria-hidden="true">
      <div className={styles.coordinates}>
        <span><i />[{pad(0)}, {pad(registration.y)}]</span>
        <span className={styles.coordinateUnits}>Sheet coordinates / px</span>
        <span>{String(registration.progress).padStart(2, "0")}% <b>/</b> [{pad(registration.width)}, {pad(registration.y)}]<i /></span>
      </div>
      <div className={styles.topRuler}>
        {Array.from({ length: Math.floor(registration.width / 80) }, (_, index) => <span key={index} style={{ left: (index + 1) * 80 }}>{pad((index + 1) * 80)}</span>)}
      </div>
    </div>
  </>;
}
