"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import styles from "./gcm.module.css";

/** Native-flow evidence, an outgoing intro, and a content-only fade below the sticky index. */
export function GcmContentSheet({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const sheet = root.current!;
    const hero = sheet.parentElement?.querySelector<HTMLElement>("[data-gcm-arrival]");
    if (!hero) return;
    const nav = sheet.querySelector<HTMLElement>("[data-gcm-section-nav]");
    const article = sheet.querySelector<HTMLElement>("[data-gcm-reading-content]");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let printing = false;
    let frame = 0;
    let needsMeasure = false;
    let start = 0;
    let end = 0;
    let previous = -1;
    let sheetBottom = 0;
    let articleTop = 0;
    let navHeight = 0;
    let previousReading = -1;

    const resetIntro = () => {
      delete hero.dataset.gcmDepth;
      hero.style.removeProperty("--gcm-intro-offset");
      previous = -1;
    };
    const distance = () => Math.min(Math.max(window.scrollY - start, 0), Math.max(end - start, 0));
    const readingPosition = () => Math.min(window.scrollY, sheetBottom);
    const resetReading = () => {
      article?.style.removeProperty("--gcm-fade-y");
      previousReading = -1;
    };
    const paintReading = () => {
      if (!nav || !article || printing) return;
      const position = readingPosition();
      if (position === previousReading) return;
      previousReading = position;
      // Align the pinned panel's grid with the scrolling paper. Geometry is
      // cached on resize, so scrolling performs no repeated layout reads.
      const navTop = Math.min(Math.max(end, position), sheetBottom - navHeight);
      nav.style.setProperty("--gcm-nav-paper-y", `${-(navTop % 28)}px`);
      if (!reduced.matches) {
        // The feather enters from above the article as the index approaches
        // the top. There is no on/off opacity change at the sticky boundary.
        article.style.setProperty("--gcm-fade-y", `${Math.max(-192, position + navHeight - articleTop)}px`);
      }
    };
    const paint = () => {
      paintReading();
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
      sheetBottom = end + bounds.height;
      if (nav && article) {
        navHeight = nav.getBoundingClientRect().height;
        articleTop = article.getBoundingClientRect().top + window.scrollY;
        sheet.style.setProperty("--gcm-nav-height", `${navHeight}px`);
      }
      // Let a tall intro be read with native scrolling before it is overtaken.
      start = Math.max(0, end - (window.visualViewport?.height ?? window.innerHeight));
      sheet.style.setProperty("--gcm-sheet-left", `${-bounds.left}px`);
      sheet.style.setProperty("--gcm-sheet-width", `${document.documentElement.clientWidth}px`);
      sheet.style.setProperty("--gcm-paper-y", `${-(end % 28)}px`);
      sheet.dataset.gcmSheetReady = "true";
      previous = -1;
      previousReading = -1;
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
      // The reading fade continues after the intro has finished its travel.
      if (!printing && ((!reduced.matches && distance() !== previous) ||
        (nav && article && readingPosition() !== previousReading))) queue();
    };
    const onResize = () => queue(true);
    const onPreference = () => { cancelAnimationFrame(frame); frame = 0; resetReading(); measure(); };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else queue(true);
    };
    const beforePrint = () => {
      printing = true;
      cancelAnimationFrame(frame);
      frame = 0;
      resetIntro();
      resetReading();
    };
    const afterPrint = () => { printing = false; queue(true); };
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onResize);
    resize?.observe(hero);
    resize?.observe(sheet);
    if (nav) resize?.observe(nav);
    if (article) resize?.observe(article);
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
      resetReading();
      nav?.style.removeProperty("--gcm-nav-paper-y");
    };
  }, []);

  return <div ref={root} className={styles.contentSheet} data-gcm-content-sheet>{children}</div>;
}
