"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import styles from "./gcm.module.css";

/** The evidence sheet stays in native flow; only the outgoing intro changes depth. */
export function GcmContentSheet({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const sheet = root.current!;
    const hero = sheet.parentElement?.querySelector<HTMLElement>("[data-gcm-arrival]");
    if (!hero) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let printing = false;
    let frame = 0;
    let needsMeasure = false;
    let start = 0;
    let end = 0;
    let previous = -1;

    const resetIntro = () => {
      delete hero.dataset.gcmDepth;
      hero.style.removeProperty("--gcm-intro-offset");
      previous = -1;
    };
    const distance = () => Math.min(Math.max(window.scrollY - start, 0), Math.max(end - start, 0));
    const paint = () => {
      if (reduced.matches || printing) {
        resetIntro();
        return;
      }
      const travel = distance();
      if (travel === previous) return;
      previous = travel;
      hero.dataset.gcmDepth = travel > 0 && window.scrollY < end ? "moving" : "resting";
      hero.style.setProperty("--gcm-intro-offset", `${travel * .65}px`);
    };
    const measure = () => {
      // The foreground is never transformed, so these coordinates cannot feed
      // the outgoing intro's translation back into the next measurement.
      const bounds = sheet.getBoundingClientRect();
      end = Math.max(0, bounds.top + window.scrollY);
      // Let a tall intro be read with native scrolling before it is overtaken.
      start = Math.max(0, end - (window.visualViewport?.height ?? window.innerHeight));
      sheet.style.setProperty("--gcm-sheet-left", `${-bounds.left}px`);
      sheet.style.setProperty("--gcm-sheet-width", `${document.documentElement.clientWidth}px`);
      sheet.style.setProperty("--gcm-paper-y", `${-(end % 28)}px`);
      sheet.dataset.gcmSheetReady = "true";
      previous = -1;
      paint();
    };
    const queue = (remeasure = false) => {
      needsMeasure ||= remeasure;
      if (frame || disposed || document.hidden || printing) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (disposed) return;
        if (needsMeasure) { needsMeasure = false; measure(); }
        else paint();
      });
    };
    const onScroll = () => {
      // Once covered, there is no animation work until scrolling back into the intro.
      if (!reduced.matches && !printing && distance() !== previous) queue();
    };
    const onResize = () => queue(true);
    const onPreference = () => { cancelAnimationFrame(frame); frame = 0; measure(); };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else queue(true);
    };
    const beforePrint = () => {
      printing = true;
      cancelAnimationFrame(frame);
      frame = 0;
      resetIntro();
    };
    const afterPrint = () => { printing = false; queue(true); };
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onResize);
    resize?.observe(hero);
    resize?.observe(sheet);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("pageshow", onResize);
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onPreference);
    document.fonts?.ready.then(() => { if (!disposed) queue(true); });
    measure();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("pageshow", onResize);
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onPreference);
      resetIntro();
    };
  }, []);

  return <div ref={root} className={styles.contentSheet} data-gcm-content-sheet>{children}</div>;
}
