"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

/** One shared playhead for the whole sample; exit fades without snapping the sheets. */
export function MarketplaceBoardMotion(props: ComponentPropsWithoutRef<"article">) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = preference.matches;
    let hovered = false, focused = false, active = false;
    let phase = 0, opacity = 0, frame = 0, previous = 0;

    const paint = () => {
      const spread = Math.sin(Math.PI * Math.pow(phase, .55));
      element.style.setProperty("--marketplace-sheet-a", `translate(${-10 * spread + 2 * phase}px, ${-6 * spread + 3 * phase}px)`);
      element.style.setProperty("--marketplace-sheet-b", `translate(${10 * spread + 4 * phase}px, ${8 * spread + 6 * phase}px)`);
      element.style.setProperty("--marketplace-hover-opacity", String(opacity));
      const journey = Math.min(1, Math.max(0, (phase - .14) / .7));
      element.style.setProperty("--marketplace-trace-offset", String(8 - journey * 108));
      element.style.setProperty("--marketplace-endpoint-opacity", String(Math.min(1, Math.max(0, (phase - .72) / .2)) * opacity));
    };
    const tick = (now: number) => {
      const elapsed = previous ? Math.min(64, now - previous) : 0;
      previous = now;
      if (active) {
        phase = Math.min(1, phase + elapsed / 900);
        opacity = Math.min(1, opacity + elapsed / 140);
      } else {
        opacity = Math.max(0, opacity - elapsed / 220);
        if (!opacity) phase = 0;
      }
      paint();
      frame = (active ? phase < 1 || opacity < 1 : opacity > 0) ? requestAnimationFrame(tick) : 0;
    };
    const update = () => {
      active = hovered || focused;
      element.dataset.marketplaceActive = String(active);
      if (reduced || frame || (active ? phase === 1 && opacity === 1 : opacity === 0)) return;
      previous = 0;
      frame = requestAnimationFrame(tick);
    };
    const enter = (event: PointerEvent) => { if (event.pointerType === "mouse") { hovered = true; update(); } };
    const leave = () => { hovered = false; update(); };
    const focus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.matches(":focus-visible")) { focused = true; update(); }
    };
    const blur = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node) || !element.contains(event.relatedTarget)) { focused = false; update(); }
    };
    const preferenceChanged = () => {
      reduced = preference.matches;
      cancelAnimationFrame(frame);
      frame = 0;
      phase = 0;
      opacity = 0;
      paint();
      update();
    };
    element.addEventListener("pointerenter", enter);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("focusin", focus);
    element.addEventListener("focusout", blur);
    preference.addEventListener("change", preferenceChanged);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("pointerenter", enter);
      element.removeEventListener("pointerleave", leave);
      element.removeEventListener("focusin", focus);
      element.removeEventListener("focusout", blur);
      preference.removeEventListener("change", preferenceChanged);
    };
  }, []);

  return <article {...props} ref={root} data-marketplace-active="false" />;
}
