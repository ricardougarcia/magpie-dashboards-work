"use client";

import { useEffect, useRef, type RefObject } from "react";
import { createInkParticle, particleVertexRadius, sampleInkSegment, type InkParticle, type InkPoint } from "@/lib/guiding-light-ink";
import styles from "./gcm-impact.module.css";

export const IMPACT_INK_RADIUS = 34;
export const IMPACT_INK_SIZE = 320;
export const IMPACT_INK_TRAIL_MS = 220;
const MAX_TRAIL = 48;
const MAX_TRAIL_DISTANCE = 88;
const RESPONSE_MS = 20;
type Deposit = InkPoint & { bornAt: number };

/** Same organic ink contour, with a bounded drawing surface and shorter response. */
export function GcmImpactInk({ trackRef }: { trackRef: RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const track = trackRef.current, canvas = canvasRef.current;
    if (!track || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0, previousTime = 0, geometryDirty = true;
    let inside = false, target: InkPoint | null = null, nib: InkPoint | null = null;
    let shape: InkParticle | null = null;
    let trail: Deposit[] = [];
    let carry = 0, documentLeft = 0, documentTop = 0, width = 0, height = 0;
    let dpr = 1;

    const measure = () => {
      const bounds = track.getBoundingClientRect();
      documentLeft = bounds.left + window.scrollX;
      documentTop = bounds.top + window.scrollY;
      width = bounds.width; height = bounds.height;
      // An opaque, precisely registered paper layer gives difference blending
      // a backdrop inside the article's mask. It matches the paper below it.
      track.style.setProperty("--gcm-ink-grid-x", `${-(documentLeft % 28)}px`);
      track.style.setProperty("--gcm-ink-grid-y", `${-(documentTop % 28)}px`);
      const nextDpr = Math.min(2, window.devicePixelRatio || 1);
      if (nextDpr !== dpr || canvas.width !== IMPACT_INK_SIZE * nextDpr) {
        dpr = nextDpr;
        canvas.width = IMPACT_INK_SIZE * dpr;
        canvas.height = IMPACT_INK_SIZE * dpr;
      }
      geometryDirty = false;
    };
    const localTarget = () => target && ({ x: target.x + window.scrollX - documentLeft, y: target.y + window.scrollY - documentTop });
    const draw = (point: InkPoint, scale: number, now: number) => {
      if (!shape || !nib || scale <= 0) return;
      const count = shape.radialProfile.length;
      const points = shape.radialProfile.map((_, index) => {
        const angle = index / count * Math.PI * 2;
        const radius = particleVertexRadius(shape!, index, now, scale);
        return { x: IMPACT_INK_SIZE / 2 + point.x - nib!.x + Math.cos(angle) * radius,
          y: IMPACT_INK_SIZE / 2 + point.y - nib!.y + Math.sin(angle) * radius };
      });
      context.beginPath();
      context.moveTo((points[0].x + points[1].x) / 2, (points[0].y + points[1].y) / 2);
      for (let index = 1; index <= count; index++) {
        const point = points[index % count], next = points[(index + 1) % count];
        context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
      }
      context.closePath(); context.fill();
    };
    const render = (now: number) => {
      frame = 0;
      if (geometryDirty) measure();
      const elapsed = previousTime ? Math.min(50, Math.max(0, now - previousTime)) : 1000 / 60;
      previousTime = now;
      const destination = localTarget();
      if (inside && destination && nib) {
        // Follow the latest input once per frame; replaying an event backlog
        // made response depend on pointer sampling density and added drag.
        const response = 1 - Math.exp(-elapsed / RESPONSE_MS);
        const next = { x: nib.x + (destination.x - nib.x) * response, y: nib.y + (destination.y - nib.y) * response };
        const segment = sampleInkSegment(nib, next, 7, carry);
        segment.points.forEach(point => trail.push({ ...point, bornAt: now }));
        carry = segment.carry;
        nib = next;
        if (destination.x < 0 || destination.y < 0 || destination.x > width || destination.y > height) inside = false;
      }
      if (!nib) return;
      trail = trail.filter(point => now - point.bornAt < IMPACT_INK_TRAIL_MS && Math.hypot(point.x - nib!.x, point.y - nib!.y) < MAX_TRAIL_DISTANCE).slice(-MAX_TRAIL);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, IMPACT_INK_SIZE, IMPACT_INK_SIZE);
      // White difference-blends the actual rendered text and paper underneath:
      // no copied text, approximate hit regions, or React updates on movement.
      context.fillStyle = "#fff";
      trail.forEach(point => draw(point, Math.pow(Math.max(0, 1 - (now - point.bornAt) / IMPACT_INK_TRAIL_MS), 1.4), now));
      if (inside) draw(nib, 1, now);
      canvas.style.transform = `translate3d(${nib.x - IMPACT_INK_SIZE / 2}px, ${nib.y - IMPACT_INK_SIZE / 2}px, 0)`;
      canvas.hidden = !inside && trail.length === 0;
      if (inside || trail.length) frame = requestAnimationFrame(render);
      else previousTime = 0;
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(render); };
    const accept = (event: PointerEvent) => event.pointerType !== "touch" && event.isPrimary !== false;
    const enter = (event: PointerEvent) => {
      if (!accept(event)) return;
      measure();
      target = { x: event.clientX, y: event.clientY };
      nib = localTarget();
      shape = createInkParticle(nib!, 0); shape.radius = IMPACT_INK_RADIUS;
      trail = []; carry = 0; previousTime = 0; inside = true;
      queue();
    };
    const move = (event: PointerEvent) => {
      if (!accept(event)) return;
      if (!inside || !nib) { enter(event); return; }
      target = { x: event.clientX, y: event.clientY };
      queue();
    };
    const leave = (event: PointerEvent) => {
      if (!accept(event)) return;
      if (nib) trail.push({ ...nib, bornAt: performance.now() });
      inside = false; target = null; queue();
    };
    const invalidate = () => { geometryDirty = true; if (inside || trail.length) queue(); };
    const scroll = () => { if (inside || trail.length) queue(); };
    const observer = new ResizeObserver(invalidate);
    observer.observe(track);
    const sheet = track.closest("[data-gcm-content-sheet]");
    if (sheet) observer.observe(sheet);
    measure();
    track.dataset.inkReady = "true";
    track.addEventListener("pointerenter", enter, { passive: true });
    track.addEventListener("pointermove", move, { passive: true });
    track.addEventListener("pointerleave", leave, { passive: true });
    track.addEventListener("pointercancel", leave, { passive: true });
    window.addEventListener("resize", invalidate);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      track.removeEventListener("pointerenter", enter); track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerleave", leave); track.removeEventListener("pointercancel", leave);
      window.removeEventListener("resize", invalidate); window.removeEventListener("scroll", scroll);
      delete track.dataset.inkReady;
      track.style.removeProperty("--gcm-ink-grid-x"); track.style.removeProperty("--gcm-ink-grid-y");
    };
  }, [trackRef]);

  return <canvas ref={canvasRef} className={styles.ink} width={IMPACT_INK_SIZE} height={IMPACT_INK_SIZE} hidden aria-hidden="true" />;
}
