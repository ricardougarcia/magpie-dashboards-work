"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import styles from "./gcm.module.css";

/** Native scroll holds fitting reading stages; only outgoing ink fades below the index. */
export function GcmContentSheet({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const sheet = root.current!;
    const hero = sheet.parentElement?.querySelector<HTMLElement>("[data-gcm-arrival]");
    if (!hero) return;
    const nav = sheet.querySelector<HTMLElement>("[data-gcm-section-nav]");
    const article = sheet.querySelector<HTMLElement>("[data-gcm-reading-content]");

    const stages = [...sheet.querySelectorAll<HTMLElement>("[data-gcm-reading-section]")].map(element => ({
      element,
      stage: element.querySelector<HTMLElement>("[data-gcm-reading-stage]")!,
      steps: Number(element.dataset.gcmSteps) || 1,
      start: 0, travel: 0, height: 0, index: -1,
    }));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let printing = false;
    let printPosition = 0;
    let restorePrint = false;
    let frame = 0;
    let needsMeasure = false;
    let start = 0;
    let end = 0;
    let previous = -1;
    let sheetBottom = 0;
    let articleTop = 0;
    let navHeight = 0;
    let previousReading = -1;
    let lastStagePosition = window.scrollY;
    let measured = false;

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
    const paintStages = (position: number) => {
      const moved = Math.abs(position - lastStagePosition) > .5;
      lastStagePosition = position;
      let featherLift = 0;
      for (const item of stages) {
        const distance = position - item.start;
        const holding = item.travel > 0 && distance >= 0 && distance <= item.travel;
        item.element.dataset.gcmHolding = String(holding);
        if (!item.travel) continue;
        // Ease the feather out of the reading area as the section arrives,
        // then return it continuously only after the final reading interval.
        const protection = Math.max(0, Math.min(1, (distance + 176) / 176, (item.travel + 176 - distance) / 176));
        featherLift = Math.max(featherLift, protection * 176);
        if (item.steps < 2 || (item.index < 0 && distance < 0)) continue;
        const index = Math.max(0, Math.min(item.steps - 1, Math.floor(distance / item.travel * item.steps)));
        if ((moved || item.index < 0) && index !== item.index) {
          item.index = index;
          item.element.dispatchEvent(new CustomEvent("gcm-scroll-behavior", { detail: index }));
        }
      }
      return featherLift;
    };
    const paintReading = () => {
      if (!nav || !article || printing) return;
      const position = readingPosition();
      if (position === previousReading) return;
      previousReading = position;
      const featherLift = paintStages(position);
      // Align the pinned panel's grid with the scrolling paper. Geometry is
      // cached on resize, so scrolling performs no repeated layout reads.
      const navTop = Math.min(Math.max(end, position), sheetBottom - navHeight);
      nav.style.setProperty("--gcm-nav-paper-y", `${-(navTop % 28)}px`);
      if (!reduced.matches) {
        // The feather enters from above the article as the index approaches
        // the top. There is no on/off opacity change at the sticky boundary.
        article.style.setProperty("--gcm-fade-y", `${Math.max(-192, position + navHeight - articleTop - featherLift)}px`);
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
      let bounds = sheet.getBoundingClientRect();
      const oldPosition = window.scrollY;
      const previousStages = stages.map(item => ({ start: item.start, travel: item.travel, height: item.height }));
      navHeight = nav?.getBoundingClientRect().height ?? 0;
      const viewport = Math.min(window.innerHeight, window.visualViewport?.height ?? window.innerHeight);
      const stageTop = navHeight + 24;
      for (const item of stages) {
        item.height = item.stage.getBoundingClientRect().height;
        const fits = item.height > 0 && item.height <= viewport - stageTop - 12;
        item.travel = fits && !reduced.matches && !printing
          ? item.steps > 1 ? Math.max(180, viewport * .32) * item.steps : Math.max(180, viewport * .35)
          : 0;
        item.element.style.setProperty("--gcm-stage-height", `${item.height}px`);
        item.element.style.setProperty("--gcm-stage-travel", `${item.travel}px`);
        item.element.style.setProperty("--gcm-stage-top", `${stageTop}px`);
        item.element.dataset.gcmPinned = String(item.travel > 0);
      }
      for (const item of stages) item.start = item.element.getBoundingClientRect().top + window.scrollY - stageTop;
      // Resizing, zoom, or opening a disclosure can remove a runway. Keep the
      // reader at the same section instead of jumping into later content.
      if (measured && !printing && !restorePrint) {
        let adjustment = 0;
        for (let i = 0; i < stages.length; i++) {
          const old = previousStages[i], item = stages[i];
          if (old.travel && oldPosition >= old.start && oldPosition <= old.start + old.travel) {
            adjustment = item.start + (oldPosition - old.start) / old.travel * item.travel - oldPosition;
            break;
          }
          if (!old.travel && item.travel && oldPosition >= old.start && oldPosition < old.start + old.height) {
            adjustment = item.start - oldPosition;
            break;
          }
          if (oldPosition > old.start + old.travel) adjustment += item.travel - old.travel;
        }
        if (Math.abs(adjustment) > 1) window.scrollTo({ top: Math.max(0, oldPosition + adjustment), behavior: "instant" });
      }
      if (restorePrint) {
        window.scrollTo({ top: printPosition, behavior: "instant" });
        restorePrint = false;
      }
      measured = true;
      lastStagePosition = window.scrollY;
      bounds = sheet.getBoundingClientRect();
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
    const chooseBehavior = (event: Event) => {
      const item = stages.find(stage => stage.steps > 1 && stage.element === event.target);
      const index = (event as CustomEvent<number>).detail;
      if (!item?.travel || !Number.isInteger(index) || index < 0 || index >= item.steps) return;
      item.index = index;
      // Explicit focus/click can visit any item without working through earlier
      // scroll stops. Native scrolling resumes from that selected interval.
      window.scrollTo({ top: Math.max(0, item.start + item.travel * index / item.steps), behavior: "instant" });
      lastStagePosition = window.scrollY;
      queue();
    };
    const onPreference = () => { cancelAnimationFrame(frame); frame = 0; resetReading(); measure(); };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else queue(true);
    };
    const beforePrint = () => {
      printPosition = window.scrollY;
      printing = true;
      cancelAnimationFrame(frame);
      frame = 0;
      resetIntro();
      resetReading();
      stages.forEach(item => { item.element.dataset.gcmPinned = "false"; item.element.dataset.gcmHolding = "false"; });
    };
    const afterPrint = () => { printing = false; restorePrint = true; queue(true); };
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onResize);
    resize?.observe(hero);
    resize?.observe(sheet);
    if (nav) resize?.observe(nav);
    if (article) resize?.observe(article);
    stages.forEach(item => resize?.observe(item.stage));
    sheet.addEventListener("gcm-select-behavior", chooseBehavior);
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
      sheet.removeEventListener("gcm-select-behavior", chooseBehavior);
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
      stages.forEach(item => {
        delete item.element.dataset.gcmPinned;
        delete item.element.dataset.gcmHolding;
        ["--gcm-stage-height", "--gcm-stage-travel", "--gcm-stage-top"].forEach(property => item.element.style.removeProperty(property));
      });
    };
  }, []);

  return <div ref={root} className={styles.contentSheet} data-gcm-content-sheet>{children}</div>;
}
