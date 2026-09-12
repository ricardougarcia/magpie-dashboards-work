"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import styles from "./marketplace-opening.module.css";

/** A progressive enhancement: the artifact and its natural dimensions never change. */
export function MarketplaceOpening({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const replay = useRef<HTMLButtonElement>(null);
  const stageId = useId();

  useEffect(() => {
    const element = root.current!;
    const surface = stage.current!;
    const button = replay.current!;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | null = null;
    let frame = 0;
    let timer = 0;
    let run = 0;
    let introduced = false;
    let disposed = false;

    const cancelPending = () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      frame = 0;
      timer = 0;
    };
    const disconnect = () => {
      observer?.disconnect();
      observer = null;
    };
    const settle = () => {
      if (disposed) return;
      introduced = true;
      disconnect();
      cancelPending();
      element.dataset.openingState = "open";
    };
    const begin = () => {
      if (disposed) return;
      if (preference.matches || surface.contains(document.activeElement) || document.hidden) {
        settle();
        return;
      }
      cancelPending();
      element.dataset.openingRun = String(++run);
      element.dataset.openingState = "opening";
      // Also settle if transitionend is lost to navigation, resizing, or browser throttling.
      timer = window.setTimeout(settle, 1250);
    };
    const replayOpening = () => {
      if (disposed || preference.matches || surface.contains(document.activeElement)) return;
      introduced = true;
      disconnect();
      cancelPending();
      element.dataset.openingState = "armed";
      // Commit the two paper gates before moving them; repeated requests replace this work.
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          begin();
        });
      });
    };
    const onPreference = () => {
      element.dataset.reducedMotion = String(preference.matches);
      button.setAttribute("aria-disabled", String(preference.matches));
      if (preference.matches) settle();
    };
    const onVisibility = () => { if (document.hidden) settle(); };

    element.dataset.openingReady = "true";
    button.hidden = false;
    onPreference();
    surface.addEventListener("focusin", settle);
    surface.addEventListener("pointerdown", settle);
    button.addEventListener("click", replayOpening);
    preference.addEventListener("change", onPreference);
    window.addEventListener("hashchange", settle);
    document.addEventListener("visibilitychange", onVisibility);

    const belowViewport = surface.getBoundingClientRect().top >= window.innerHeight;
    // Hydrating an already visible artifact or a deep link must never cover it again.
    if (!preference.matches && belowViewport && !window.location.hash && !document.hidden
      && !surface.contains(document.activeElement) && typeof IntersectionObserver !== "undefined") {
      element.dataset.openingState = "armed";
      observer = new IntersectionObserver((entries) => {
        if (!disposed && !introduced && entries.some((entry) => entry.isIntersecting)) {
          introduced = true;
          disconnect();
          begin();
        }
      }, { threshold: 0, rootMargin: "0px 0px -16% 0px" });
      observer.observe(surface);
    } else {
      settle();
    }

    return () => {
      disposed = true;
      disconnect();
      cancelPending();
      surface.removeEventListener("focusin", settle);
      surface.removeEventListener("pointerdown", settle);
      button.removeEventListener("click", replayOpening);
      preference.removeEventListener("change", onPreference);
      window.removeEventListener("hashchange", settle);
      document.removeEventListener("visibilitychange", onVisibility);
      element.dataset.openingState = "open";
      element.dataset.openingReady = "false";
      button.hidden = true;
    };
  }, []);

  return <div ref={root} className={styles.opening} data-marketplace-opening data-opening-state="open" data-opening-run="0" data-opening-ready="false">
    <div ref={stage} id={stageId} className={styles.stage} data-opening-stage>
      <div className={styles.artifact} data-opening-artifact>{children}</div>
      <div className={`${styles.gate} ${styles.educator}`} aria-hidden="true" data-opening-gate="educator">
        <span className={styles.label}><span className={styles.index}>01 / Educators</span><span>Find tools<br />with confidence.</span></span>
        <span className={styles.registration} />
      </div>
      <div className={`${styles.gate} ${styles.provider}`} aria-hidden="true" data-opening-gate="provider">
        <span className={styles.label}><span className={styles.index}>02 / Providers</span><span>Make the right<br />connection.</span></span>
        <span className={styles.registration} />
      </div>
    </div>
    <div className={styles.controls}>
      <button ref={replay} type="button" hidden aria-label="Replay the Marketplace opening" aria-controls={stageId}>Replay opening <span aria-hidden="true">↗</span></button>
    </div>
  </div>;
}
