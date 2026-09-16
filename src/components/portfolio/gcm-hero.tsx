"use client";

import { useLayoutEffect, useRef } from "react";
import styles from "./gcm.module.css";
import motion from "./gcm-arrival.module.css";

const countDelay = 1100;
const countDuration = 1300;

/** The static value stays in the accessibility tree throughout the visual count. */
export function GcmHero() {
  const root = useRef<HTMLElement>(null);
  const trust = useRef<HTMLSpanElement>(null);
  const counter = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const element = root.current!;
    const value = counter.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let countFinished = false;
    const finishCount = () => {
      countFinished = true;
      clearTimeout(timer);
      timer = undefined;
      cancelAnimationFrame(frame);
      value.textContent = "97%";
      element.dataset.countSettled = "true";
    };
    const settle = () => {
      finishCount();
      element.dataset.arrivalSettled = "true";
    };
    const bounds = element.getBoundingClientRect();
    // Anchor visits and restored page positions must never restart the opening.
    if (reduced.matches || document.hidden || window.scrollY > 20 ||
      bounds.bottom <= 0 || bounds.top >= window.innerHeight ||
      (window.location.hash && window.location.hash !== "#portfolio-main")) {
      settle();
      return;
    }

    // CSS starts the question at first paint, before hydration. Align the count
    // with that existing timeline rather than restarting it when JS arrives.
    const elapsed = Number(trust.current?.getAnimations?.()[0]?.currentTime ?? 0);
    const begins = performance.now() + Math.max(0, countDelay - elapsed);
    const alreadyElapsed = Math.max(0, elapsed - countDelay);
    const tick = (now: number) => {
      if (countFinished) return;
      const progress = Math.min(1, Math.max(0, (now - begins + alreadyElapsed) / countDuration));
      value.textContent = `${Math.floor(97 * (1 - Math.pow(1 - progress, 3)))}%`;
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finishCount();
    };
    // The headline has a longer arrival than the metric. Normal completion
    // restores the static number without finishing the headline's fade early.
    if (elapsed >= countDelay + countDuration) finishCount();
    else timer = setTimeout(() => { frame = requestAnimationFrame(tick); }, Math.max(0, countDelay - elapsed));
    const preferenceChanged = () => { if (reduced.matches) settle(); };
    const visibilityChanged = () => { if (document.hidden) settle(); };
    const restored = (event: PageTransitionEvent) => { if (event.persisted) settle(); };
    reduced.addEventListener("change", preferenceChanged);
    document.addEventListener("visibilitychange", visibilityChanged);
    window.addEventListener("beforeprint", settle);
    window.addEventListener("pageshow", restored);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      reduced.removeEventListener("change", preferenceChanged);
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("beforeprint", settle);
      window.removeEventListener("pageshow", restored);
    };
  }, []);

  return <header ref={root} className={`${styles.hero} ${motion.hero}`} data-gcm-arrival>
    <div>
      <p className={styles.register}>Generative Consumer Model / MVP</p>
      <h1>What makes an AI answer<br /><span ref={trust} className={motion.trust}>worth trusting?</span></h1>
      <div className={styles.scope}><p className={styles.role}>Sole product lead</p><p>I shaped the demo, planned the integration, and defined how we would evaluate its answers.</p></div>
    </div>
    <div className={styles.heroProof}><strong className={motion.proofValue}><span className={motion.finalValue}>97%</span><span ref={counter} aria-hidden="true" className={motion.counter} data-gcm-counter>0%</span></strong><div><p>Alignment in evaluation tests.</p><span className={styles.meta}>Reported outcome</span></div></div>
    <noscript className={motion.noScript}><style>{`[data-gcm-arrival] [data-gcm-counter]{display:none!important}[data-gcm-arrival] span{animation:none!important;opacity:1!important;clip-path:none!important;transform:none!important}`}</style></noscript>
  </header>;
}
