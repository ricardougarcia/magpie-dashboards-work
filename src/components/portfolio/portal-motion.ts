"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const portalAnchors = [0, .14, .28, .42, .55, .68, .82, 1];
const focusPoints = [[465, 255, .82], [315, 265, .88], [490, 202, 1], [830, 202, 1], [725, 440, .95], [360, 546, .95], [555, 300, .78], [555, 300, .76]];
const routePoints = [0, .1, .334, .527, .78, .97, 1, 1];
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function scrollGeometry(field: HTMLElement, pinned: HTMLElement) {
  const openingHeight = Math.max(window.innerHeight, parseFloat(getComputedStyle(field).getPropertyValue("--portal-opening-height")) || pinned.offsetHeight);
  return { lead: openingHeight - window.innerHeight, distance: field.offsetHeight - openingHeight };
}

/** Native page scrolling drives the approved Atlas camera; it never consumes wheel input. */
export function usePortalMotion() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const atlas = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const playback = useRef(0);
  const reducedRef = useRef(false);
  const [step, setStep] = useState(0);
  const [percent, setPercent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [lessMotion, setLessMotion] = useState(false);

  const stop = useCallback(() => {
    cancelAnimationFrame(playback.current);
    playback.current = 0;
    setPlaying(false);
  }, []);

  const move = useCallback((value: number) => {
    const field = track.current;
    const pinned = stage.current;
    if (!field || !pinned) return;
    const start = window.scrollY + field.getBoundingClientRect().top;
    const { lead, distance } = scrollGeometry(field, pinned);
    window.scrollTo({ top: start + (value > 0 ? lead : 0) + clamp(value) * distance, behavior: "instant" });
  }, []);

  const go = useCallback((index: number) => { stop(); move(portalAnchors[index]); }, [move, stop]);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      const value = preference.matches || lessMotion;
      reducedRef.current = value;
      setReduced(value);
      if (value) stop();
    };
    change();
    preference.addEventListener("change", change);
    return () => preference.removeEventListener("change", change);
  }, [lessMotion, stop]);

  useEffect(() => {
    const field = track.current!;
    const pinned = stage.current!;
    const surface = atlas.current!;
    const map = surface.querySelector<HTMLElement>(".map-window")!;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Let the entire opening scroll into view before advancing the Atlas.
      // The denominator stays stable when the opening's taller stage closes.
      const { lead, distance } = scrollGeometry(field, pinned);
      const p = clamp((-field.getBoundingClientRect().top - lead) / distance);
      progress.current = p;
      setPercent(Math.round(p * 100));
      let nearest = 0;
      portalAnchors.forEach((anchor, index) => {
        if (Math.abs(p - anchor) < Math.abs(p - portalAnchors[nearest])) nearest = index;
      });
      setStep(nearest);
      const camera = reducedRef.current ? portalAnchors[nearest] : p;
      let index = 0;
      while (index < portalAnchors.length - 2 && camera > portalAnchors[index + 1]) index++;
      const t = clamp((camera - portalAnchors[index]) / (portalAnchors[index + 1] - portalAnchors[index]));
      const mix = (a: number, b: number) => a + (b - a) * t;
      const focus = focusPoints[index].map((v, j) => mix(v, focusPoints[index + 1][j]));
      const phone = surface.clientWidth <= 600;
      const scale = phone ? .78 : focus[2];
      let [fx, fy] = focus;
      if (phone && nearest === 4) fx -= 25;
      if (phone && nearest === 5) fy -= 10;
      surface.style.setProperty("--map-x", `${map.clientWidth * .5 - fx * scale}px`);
      surface.style.setProperty("--map-y", `${map.clientHeight * .49 - fy * scale}px`);
      surface.style.setProperty("--map-scale", String(scale));
      surface.style.setProperty("--p", String(mix(routePoints[index], routePoints[index + 1])));
      surface.style.setProperty("--local", String(clamp(p / .08)));
      surface.style.setProperty("--progress", String(p));
      const source = nearest === 0 ? surface.querySelector(".context-sheet") : nearest === 1 ? surface.querySelector(".research-sheet") : nearest === 6 ? surface.querySelector(".launch-sheet") : surface.querySelector(`.atlas-station[data-stop="${nearest}"] .atlas-document, .atlas-station[data-stop="${nearest}"] .atlas-service-ledger`);
      const target = surface.querySelector(".work-panel");
      const connector = surface.querySelector<SVGSVGElement>(".work-connector");
      if (source && target && connector && !phone && nearest !== 7) {
        const rect = surface.getBoundingClientRect(), a = source.getBoundingClientRect(), b = target.getBoundingClientRect();
        const x1 = a.right - rect.left, y1 = a.top - rect.top + a.height / 2;
        const x2 = b.left - rect.left, y2 = b.top - rect.top + 42, middle = x1 + (x2 - x1) * .55;
        connector.setAttribute("viewBox", `0 0 ${surface.clientWidth} ${surface.clientHeight}`);
        connector.querySelector("path")!.setAttribute("d", `M${x1},${y1}H${middle}V${y2}H${x2}`);
        connector.querySelector("circle")!.setAttribute("cx", String(x1));
        connector.querySelector("circle")!.setAttribute("cy", String(y1));
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule);
    resize.observe(map); resize.observe(pinned);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame); resize.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
    };
  }, [reduced]);

  useEffect(() => {
    const surface = atlas.current!;
    if (reduced || step === 7) {
      surface.getAnimations?.({ subtree: true }).forEach(animation => animation.cancel());
      return;
    }
    const options = { duration: 520, easing: "cubic-bezier(.16,1,.3,1)" };
    const animation = surface.querySelector(".work-panel")?.animate?.([
      { opacity: .5, transform: "translateY(18px)", clipPath: "inset(0 0 14% 0)" },
      { opacity: 1, transform: "none", clipPath: "inset(0)" },
    ], options);
    return () => animation?.cancel();
  }, [step, reduced]);

  useEffect(() => {
    const interrupt = (event: Event) => {
      // The toggle owns its pause/resume action; do not reset it before its click.
      if (event.target instanceof Element && event.target.closest("[data-portal-play]")) return;
      stop();
    };
    const visibility = () => { if (document.hidden) stop(); };
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    events.forEach(name => window.addEventListener(name, interrupt, { passive: true }));
    document.addEventListener("visibilitychange", visibility);
    return () => {
      events.forEach(name => window.removeEventListener(name, interrupt));
      document.removeEventListener("visibilitychange", visibility);
      cancelAnimationFrame(playback.current);
    };
  }, [stop]);

  const play = () => {
    if (reduced || playing) { stop(); return; }
    const field = track.current;
    const pinned = stage.current;
    if (!field || !pinned) return;
    const fieldTop = window.scrollY + field.getBoundingClientRect().top;
    const { lead, distance } = scrollGeometry(field, pinned);
    const from = progress.current > .995 ? 0 : Math.max(0, window.scrollY - fieldTop);
    const end = lead + distance;
    const start = performance.now();
    setPlaying(true);
    const tick = (time: number) => {
      const elapsed = clamp((time - start) / 40000);
      window.scrollTo({ top: fieldTop + from + (end - from) * elapsed, behavior: "instant" });
      if (elapsed < 1) playback.current = requestAnimationFrame(tick);
      else stop();
    };
    playback.current = requestAnimationFrame(tick);
  };
  return { track, stage, atlas, step, percent, playing, reduced, lessMotion, setLessMotion, stop, go, move, play };
}
