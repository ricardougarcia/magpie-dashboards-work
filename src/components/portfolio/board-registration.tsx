"use client";

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import styles from "./board-sheet.module.css";

const pad = (value: number) => String(Math.max(0, Math.round(value))).padStart(4, "0");
const INITIAL = { width: 0, y: 0, progress: 0 };

/** Registration follows native scrolling; it does not introduce a pan surface. */
export function BoardRegistration({ children }: { children?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLDivElement>(null);
  const [registration, setRegistration] = useState(INITIAL);

  useLayoutEffect(() => {
    const sheet = root.current?.closest<HTMLElement>("[data-board-sheet]");
    if (!sheet) return;
    let frame = 0;
    let disposed = false;
    const measure = () => {
      frame = 0;
      if (disposed) return;
      const bounds = sheet.getBoundingClientRect();
      const y = Math.max(0, -bounds.top);
      const readoutHeight = readout.current?.offsetHeight ?? 0;
      const navigationHeight = navigation.current?.offsetHeight ?? 0;
      // One rail keeps its space in the sheet. Only its two visual layers cross,
      // so reversing the native scroll or restoring history never needs a replay.
      const progress = Math.min(1, y / Math.max(160, navigationHeight + readoutHeight));
      const eased = progress * progress * (3 - 2 * progress);
      root.current?.style.setProperty("--board-readout-shift", `${navigationHeight * eased}px`);
      root.current?.style.setProperty("--board-navigation-shift", `${-readoutHeight * eased}px`);
      root.current?.style.setProperty("--board-navigation-opacity", String(1 - 0.84 * Math.sin(Math.PI * eased)));
      sheet.style.setProperty("--board-rail-height", `${readoutHeight + navigationHeight}px`);
      setRegistration({
        width: Math.round(bounds.width),
        y,
        progress: Math.min(100, Math.round(y / Math.max(1, bounds.height - window.innerHeight) * 100)),
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(sheet);
    if (readout.current) observer?.observe(readout.current);
    if (navigation.current) observer?.observe(navigation.current);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("pageshow", schedule);
    document.fonts?.ready.then(() => { if (!disposed) schedule(); });
    measure();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      sheet.style.removeProperty("--board-rail-height");
    };
  }, []);

  return <>
    <div className={styles.edgeRuler} aria-hidden="true" />
    <div ref={root} className={styles.registration}>
      <div ref={readout} className={styles.readout} aria-hidden="true">
        <div className={styles.coordinates}>
          <span>[{pad(0)}, {pad(registration.y)}]</span>
          <span className={styles.coordinateUnits}>Sheet coordinates / px</span>
          <span>{String(registration.progress).padStart(2, "0")}% <b>/</b> [{pad(registration.width)}, {pad(registration.y)}]</span>
        </div>
        <div className={styles.topRuler}>
          {Array.from({ length: Math.floor(registration.width / 80) }, (_, index) => <span key={index} style={{ left: (index + 1) * 80 }}>{pad((index + 1) * 80)}</span>)}
        </div>
      </div>
      <div ref={navigation} className={styles.navigation}>{children}</div>
    </div>
  </>;
}
