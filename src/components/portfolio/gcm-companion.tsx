"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gcmPmfHref } from "@/data/gcm";
import base from "./gcm.module.css";
import styles from "./gcm-companion.module.css";

export function GcmCompanion() {
  const sectionRef = useRef<HTMLElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const originRef = useRef<SVGCircleElement>(null);
  const destinationRef = useRef<SVGCircleElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const question = questionRef.current;
    const link = linkRef.current;
    if (!section || !question || !link) return;

    let disposed = false;
    let inView = false;
    let frame = 0;
    const updateActivity = () => {
      section.dataset.playing = String(inView && document.visibilityState !== "hidden");
    };
    const measure = () => {
      if (disposed) return;
      const bounds = section.getBoundingClientRect();
      const start = question.getBoundingClientRect();
      const end = link.getBoundingClientRect();
      const stacked = end.top >= start.bottom && end.left < start.right;
      let x1: number, y1: number, x2: number, y2: number, path: string;
      if (stacked) {
        x1 = start.left - bounds.left + 18;
        y1 = start.bottom - bounds.top + 10;
        x2 = end.left - bounds.left + 48;
        y2 = end.top - bounds.top - 8;
        const middle = (y1 + y2) / 2;
        path = `M ${x1} ${y1} L ${x1} ${middle} L ${x2} ${middle} L ${x2} ${y2}`;
      } else {
        x1 = start.right - bounds.left + 16;
        y1 = start.top - bounds.top + start.height / 2;
        x2 = end.left - bounds.left - 12;
        y2 = end.top - bounds.top + end.height / 2;
        const middle = (x1 + x2) / 2;
        path = `M ${x1} ${y1} L ${middle} ${y1} L ${middle} ${y2} L ${x2} ${y2}`;
      }
      pathRef.current?.setAttribute("d", path);
      originRef.current?.setAttribute("cx", String(x1));
      originRef.current?.setAttribute("cy", String(y1));
      destinationRef.current?.setAttribute("cx", String(x2));
      destinationRef.current?.setAttribute("cy", String(y2));
      section.dataset.measured = String(bounds.width > 0 && start.width > 0 && end.width > 0);
    };
    const requestMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const resize = typeof ResizeObserver !== "undefined" ? new ResizeObserver(requestMeasure) : null;
    resize?.observe(section);
    resize?.observe(question);
    resize?.observe(link);
    const visibility = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting);
      updateActivity();
    }, { threshold: 0.15 }) : null;
    visibility?.observe(section);
    document.addEventListener("visibilitychange", updateActivity);
    window.addEventListener("resize", requestMeasure);
    document.fonts?.ready.then(() => { if (!disposed) requestMeasure(); });
    requestMeasure();
    updateActivity();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize?.disconnect();
      visibility?.disconnect();
      document.removeEventListener("visibilitychange", updateActivity);
      window.removeEventListener("resize", requestMeasure);
    };
  }, []);

  return <section ref={sectionRef} className={styles.companion} aria-labelledby="gcm-pmf-heading" data-gcm-companion data-paused={paused}>
    <div className={styles.question}>
      <p className={base.meta}>Before the MVP / Separate work sample</p>
      <h3 ref={questionRef} id="gcm-pmf-heading">How did we decide<br />what was worth building?</h3>
      <button type="button" className={styles.motionControl} aria-pressed={paused} onClick={() => setPaused(value => !value)}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">{paused ? <path d="M 3 2 L 9 6 L 3 10 Z" /> : <path d="M 4 2 V 10 M 8 2 V 10" />}</svg>
        {paused ? "Resume connector motion" : "Pause connector motion"}
      </button>
    </div>
    <a ref={linkRef} href={gcmPmfHref} className={styles.study}>
      <span className={styles.thumbnail}><Image src="/portfolio/pmf/market-overview.png" alt="" fill sizes="(max-width: 420px) 86px, 132px" /></span>
      <span className={styles.studyText}><span className={styles.title}>Product Market Fit…<br />with no product</span><span className={base.meta}>Research work sample / SaferData</span></span>
    </a>
    <svg className={styles.connector} aria-hidden="true" focusable="false">
      <path ref={pathRef} pathLength="1" />
      <circle ref={originRef} r="2" />
      <circle ref={destinationRef} r="2" />
    </svg>
  </section>;
}
