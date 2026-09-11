"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./board-sheet.module.css";

const pad = (value: number) => String(Math.max(0, Math.round(value))).padStart(4, "0");
const INITIAL = { width: 0, y: 0, progress: 0, pointer: null as null | { x: number; y: number; left: number; top: number; code: string } };

/** Registration follows native scrolling; it does not introduce a pan surface. */
export function BoardRegistration() {
  const root = useRef<HTMLDivElement>(null);
  const [registration, setRegistration] = useState(INITIAL);

  useEffect(() => {
    const sheet = root.current?.closest<HTMLElement>("[data-board-sheet]");
    if (!sheet) return;
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    const measure = () => {
      frame = 0;
      const bounds = sheet.getBoundingClientRect();
      const y = Math.max(0, -bounds.top);
      const currentPointer = pointer;
      const target = currentPointer ? document.elementFromPoint(currentPointer.x, currentPointer.y) : null;
      setRegistration({
        width: Math.round(bounds.width),
        y,
        progress: Math.min(100, Math.round(y / Math.max(1, bounds.height - window.innerHeight) * 100)),
        pointer: currentPointer && target && sheet.contains(target) ? {
          x: currentPointer.x - bounds.left,
          y: currentPointer.y - bounds.top,
          left: Math.max(8, Math.min(currentPointer.x + 18, window.innerWidth - 150)),
          top: currentPointer.y > window.innerHeight - 64 ? currentPointer.y - 56 : currentPointer.y + 18,
          code: target.closest<HTMLElement>("[data-region-code]")?.dataset.regionCode ?? "—",
        } : null,
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const move = (event: PointerEvent) => {
      pointer = event.pointerType === "mouse" ? { x: event.clientX, y: event.clientY } : null;
      schedule();
    };
    const leave = () => { pointer = null; schedule(); };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(sheet);
    sheet.addEventListener("pointermove", move, { passive: true });
    sheet.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("blur", leave);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      sheet.removeEventListener("pointermove", move);
      sheet.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("blur", leave);
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
    {registration.pointer ? <div className={styles.cursor} style={{ left: registration.pointer.left, top: registration.pointer.top }} aria-hidden="true">
      <span>X:{pad(registration.pointer.x)} Y:{pad(registration.pointer.y)}</span>
      <span>R:{registration.pointer.code}</span>
    </div> : null}
  </>;
}
