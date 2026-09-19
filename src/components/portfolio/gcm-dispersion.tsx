"use client";

import { useEffect, useId, useRef } from "react";
import { clamp, dispersionDuration, dispersionFallback, dispersionPoints, dispersionPosition, smooth } from "./gcm-dispersion-geometry";
import styles from "./gcm-dispersion.module.css";

export function GcmDispersion() {
  const root = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    const field = root.current;
    const article = field?.closest<HTMLElement>('[data-gcm-entry="gcm"]');
    const canvas = field?.querySelector('canvas');
    const trigger = field?.querySelector('button');
    const tooltip = field?.querySelector<HTMLElement>('[role="tooltip"]');
    if (!field || !article || !canvas || !trigger || !tooltip) return;
    const context = canvas.getContext('2d');
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const ink = getComputedStyle(field).getPropertyValue('--ink').trim() || '#282828';
    let width = 0, height = 0, phase = 0, frame = 0, previous = 0;
    let hovered = false, focused = false, pinned = false, dismissed = false, visible = true;
    field.dataset.canvasReady = String(!!context);
    const active = () => visible && !dismissed && (hovered || focused || pinned);

    const paint = () => {
      const arrival = smooth((phase - .8) / .055);
      const red = smooth((phase - .85) / .055);
      const formula = smooth((phase - .905) / .095);
      field.style.setProperty('--gcm-convergence', String(phase));
      field.style.setProperty('--gcm-scatter-opacity', String(1 - arrival));
      field.style.setProperty('--gcm-arrival-opacity', String(arrival));
      field.style.setProperty('--gcm-red-opacity', String(red));
      field.style.setProperty('--gcm-formula-opacity', String(formula));
      field.style.setProperty('--gcm-formula-offset', `${6 * (1 - formula)}px`);
      tooltip.setAttribute('aria-hidden', String(formula === 0));
      trigger.setAttribute('aria-expanded', String(formula > 0));
      if (!context || !width || !height) return;
      context.clearRect(0, 0, width, height);
      context.fillStyle = ink;
      context.globalAlpha = .57 * (1 - arrival);
      context.beginPath();
      for (const point of dispersionPoints) {
        const p = dispersionPosition(point, phase);
        const x = p.x < .5 ? 26 + (width * .5 - 26) * p.x / .5 : width * .5 + (width * .5 - 26) * (p.x - .5) / .5;
        const y = p.y < .58 ? 26 + (height * .58 - 26) * p.y / .58 : height * .58 + (height * .42 - 39) * (p.y - .58) / .42;
        context.moveTo(x + p.radius, y);
        context.arc(x, y, p.radius, 0, Math.PI * 2);
      }
      context.fill();
      context.globalAlpha = 1;
    };
    const tick = (now: number) => {
      const elapsed = previous ? Math.min(48, now - previous) : 0;
      previous = now;
      phase = clamp(phase + (active() ? elapsed / dispersionDuration : -elapsed / 650));
      paint();
      frame = (active() ? phase < 1 : phase > 0) ? requestAnimationFrame(tick) : 0;
      if (!frame) previous = 0;
    };
    const update = () => {
      article.dataset.gcmMotionActive = String(active());
      if (document.hidden) return;
      if (preference.matches || !context) {
        cancelAnimationFrame(frame); frame = 0; previous = 0;
        phase = active() ? 1 : 0; paint(); return;
      }
      if (!frame && (active() ? phase < 1 : phase > 0)) frame = requestAnimationFrame(tick);
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') { hovered = true; dismissed = false; update(); }
    };
    const leave = () => { hovered = false; update(); };
    const focus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.matches(':focus-visible')) {
        focused = true;
        if (!(event.relatedTarget instanceof Node) || !article.contains(event.relatedTarget)) dismissed = false;
        update();
      }
    };
    const blur = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node) || !article.contains(event.relatedTarget)) { focused = false; pinned = false; update(); }
    };
    const play = () => { if (phase === 1) phase = 0; pinned = true; dismissed = false; previous = 0; update(); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { dismissed = true; pinned = false; update(); } };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !article.contains(event.target)) { hovered = false; focused = false; pinned = false; update(); }
    };
    const resize = () => {
      const rect = field.getBoundingClientRect(); width = rect.width; height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context?.setTransform(ratio, 0, 0, ratio, 0, 0); paint();
    };
    const preferenceChanged = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; update(); };
    const visibilityChanged = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; if (!document.hidden) update(); };
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    resizeObserver?.observe(field);
    const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        hovered = focused = pinned = false; phase = 0;
        cancelAnimationFrame(frame); frame = 0; previous = 0; paint();
      }
      update();
    });
    intersection?.observe(article);
    article.addEventListener('pointerenter', enter); article.addEventListener('pointerleave', leave);
    article.addEventListener('focusin', focus); article.addEventListener('focusout', blur);
    document.addEventListener('keydown', escape); trigger.addEventListener('click', play);
    document.addEventListener('pointerdown', outside); document.addEventListener('visibilitychange', visibilityChanged);
    preference.addEventListener?.('change', preferenceChanged);
    window.addEventListener('resize', resize, { passive: true });
    resize(); update();
    return () => {
      cancelAnimationFrame(frame); resizeObserver?.disconnect(); intersection?.disconnect();
      article.removeEventListener('pointerenter', enter); article.removeEventListener('pointerleave', leave);
      article.removeEventListener('focusin', focus); article.removeEventListener('focusout', blur);
      document.removeEventListener('keydown', escape); trigger.removeEventListener('click', play);
      document.removeEventListener('pointerdown', outside); document.removeEventListener('visibilitychange', visibilityChanged);
      preference.removeEventListener?.('change', preferenceChanged); window.removeEventListener('resize', resize);
      delete article.dataset.gcmMotionActive;
    };
  }, []);

  return <div ref={root} className={styles.field} data-gcm-dispersion data-canvas-ready="false">
    <div className={styles.axes} aria-hidden="true"><span>y</span><span>x</span></div>
    <svg className={styles.fallback} viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true"><path d={dispersionFallback} /></svg>
    <canvas aria-hidden="true" />
    <span className={styles.endpoint} aria-hidden="true"><i /></span>
    <span className={styles.caption}>Illustrative dispersion</span>
    <button type="button" className={styles.trigger} aria-label="Explore the model: animate GCM dispersion and reveal Bayes’ theorem" aria-describedby={tooltipId} aria-expanded="false"><span>Explore the model <span>[Animate]</span></span></button>
    <div id={tooltipId} className={styles.formula} role="tooltip" aria-hidden="true">
      <span className={styles.formulaLabel}>Bayes’ theorem</span>
      <span className={styles.equation} aria-hidden="true"><span>P(A|B) =</span><span className={styles.fraction}><span>P(B|A) P(A)</span><span>P(B)</span></span></span>
      <span className={styles.srOnly}>P of A given B equals P of B given A times P of A divided by P of B, where P of B is greater than zero.</span>
    </div>
  </div>;
}
