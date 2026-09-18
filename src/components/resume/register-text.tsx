"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import styles from "./register-text.module.css";

type RegisterTextProps = {
  children: string;
  delay?: number;
  step?: number;
};

const QUADRANT_DURATION = 260;
const QUADRANT_STEP = 20;
const MAX_STAGGER = 380;

/** Native text owns layout and accessibility; the temporary pieces are decorative. */
export function RegisterText({ children, delay = 0, step = 14 }: RegisterTextProps) {
  const root = useRef<HTMLSpanElement>(null);
  const native = useRef<HTMLSpanElement>(null);
  const construction = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const element = root.current;
    const original = native.current;
    const overlay = construction.current;
    const text = original?.firstChild;
    if (!element || !original || !overlay || !text || text.nodeType !== Node.TEXT_NODE) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches || !children.trim()
      || !window.matchMedia("(scripting: enabled)").matches
      || typeof Intl.Segmenter !== "function" || typeof ResizeObserver !== "function") return;

    const animate = () => {
      let timer = 0;
      let finished = false;
      const finish = () => {
        finished = true;
        delete element.dataset.registerMotion;
        overlay.replaceChildren();
        window.clearTimeout(timer);
      };

      const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      const characters = [...segmenter.segment(children)].filter(({ segment }) => !/^\s+$/.test(segment));
      const initialDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0;
      const characterStep = Math.min(
        Number.isFinite(step) ? Math.max(0, step) : 14,
        MAX_STAGGER / Math.max(1, characters.length - 1),
      );
      const duration = initialDelay + Math.max(0, characters.length - 1) * characterStep
        + QUADRANT_DURATION + QUADRANT_STEP * 3;
      const fragment = document.createDocumentFragment();
      const range = document.createRange();

      // Range coordinates retain the original string's wrapping, spacing, and
      // kerning. Separate inline-block letters must not determine text layout.
      const pieces = characters.map(({ segment, index }, characterIndex) => {
        range.setStart(text, index);
        range.setEnd(text, index + segment.length);
        const target = range.getBoundingClientRect();
        const glyph = document.createElement("span");
        glyph.className = styles.glyph;
        glyph.style.setProperty("--register-delay", `${initialDelay + characterIndex * characterStep}ms`);
        const sizing = document.createElement("span");
        sizing.className = styles.sizing;
        sizing.textContent = segment;
        glyph.append(sizing);

        for (let quadrant = 0; quadrant < 4; quadrant += 1) {
          const piece = document.createElement("span");
          piece.className = styles.quadrant;
          piece.dataset.quadrant = String(quadrant);
          piece.textContent = segment;
          glyph.append(piece);
        }
        fragment.append(glyph);
        return { glyph, sizing, target };
      });
      overlay.append(fragment);
      const origin = overlay.getBoundingClientRect();

      // Calibrate against each clone's actual font metrics, not an assumed ascent
      // or line height. Batch reads before writes to avoid per-letter layouts.
      const positions = pieces.map(({ glyph, sizing, target }) => {
        range.selectNodeContents(sizing);
        const ink = range.getBoundingClientRect();
        const box = glyph.getBoundingClientRect();
        return {
          glyph,
          left: target.left - origin.left - (ink.left - box.left),
          top: target.top - origin.top - (ink.top - box.top),
        };
      });
      for (const { glyph, left, top } of positions) {
        glyph.style.left = `${left}px`;
        glyph.style.top = `${top}px`;
      }
      element.dataset.registerMotion = "building";
      timer = window.setTimeout(finish, duration + 16);

      const onPreference = () => { if (preference.matches) finish(); };
      const onVisibility = () => { if (document.hidden) finish(); };
      preference.addEventListener("change", onPreference);
      document.addEventListener("visibilitychange", onVisibility);
      document.fonts?.addEventListener("loadingdone", finish);

      // If the containing dialog reflows while drawing, resolve to native text
      // immediately instead of letting measured pieces drift away from it.
      let initialSize = true;
      const observer = new ResizeObserver(() => {
        if (initialSize) { initialSize = false; return; }
        if (!finished) finish();
      });
      observer.observe(element);

      return () => {
        finish();
        observer.disconnect();
        preference.removeEventListener("change", onPreference);
        document.removeEventListener("visibilitychange", onVisibility);
        document.fonts?.removeEventListener("loadingdone", finish);
      };
    };

    // Native dialogs are initially display:none until their parent opens them.
    // One cancellable frame lets showModal establish measurable text geometry.
    let frame = 0;
    let cleanup: (() => void) | undefined;
    if (original.getClientRects().length) cleanup = animate();
    else frame = requestAnimationFrame(() => {
      if (original.getClientRects().length) cleanup = animate();
    });

    return () => {
      cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, [children, delay, step]);

  return (
    <span ref={root} className={styles.root} style={{ "--register-duration": `${QUADRANT_DURATION}ms` } as CSSProperties}>
      <span ref={native} className={styles.native}>{children}</span>
      <span ref={construction} className={styles.construction} aria-hidden="true" />
    </span>
  );
}
