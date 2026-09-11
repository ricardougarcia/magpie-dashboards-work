"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import styles from "./region.module.css";

const SIZE = 4;
const ACQUISITION_DURATION = 1150;
const SETTLE_DURATION = 180;
const DURATION = ACQUISITION_DURATION + SETTLE_DURATION;
const EMPTY = "linear-gradient(transparent, transparent)";

// Same seeded noise and staggered timing as Magpie's lane acquisition.
function noise(index: number, seed: number, salt: number) {
  let value = Math.imul(index + 1 + salt * 97, 0x9e3779b1) ^ Math.imul(seed + 11, 0x5f356495);
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b);
  value ^= value >>> 13;
  return (value >>> 0) / 0xffffffff;
}

/** One mask reveals the new ink backing and real DOM text together. */
export function PixelAcquisition({ active, id, seed = 0, children }: {
  active: boolean; id?: string; seed?: number; children?: ReactNode;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const phase = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const surface = layer.current;
    if (!surface) return;
    const target = active ? 1 : 0;
    if (reduceMotion) {
      phase.current = target;
      surface.style.removeProperty("--inspection-mask");
      return;
    }
    const canvas = document.createElement("canvas");
    let context: CanvasRenderingContext2D | null = null;
    let frame = 0;
    let width = 0, height = 0;
    let cellSize = SIZE;
    let cells: { x: number; y: number; delay: number; duration: number }[] = [];
    const from = phase.current;
    // Resume from the current field on reversal; never restart or flash solid.
    const duration = (active ? DURATION : 850) * Math.abs(target - from);
    let started: number | null = null;

    const paint = () => {
      if (phase.current === 0) {
        surface.style.setProperty("--inspection-mask", EMPTY);
        return;
      }
      if (!context) return;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#fff";
      for (const cell of cells) {
        const progress = Math.min(1, Math.max(0, (phase.current * DURATION - cell.delay) / cell.duration));
        if (!progress) continue;
        context.globalAlpha = Math.floor(progress * 4) / 4;
        context.fillRect(cell.x, cell.y, cellSize, cellSize);
      }
      // Fill only the remaining transparency; acquired pixels stay opaque.
      const settle = Math.min(1, Math.max(0, (phase.current * DURATION - ACQUISITION_DURATION) / SETTLE_DURATION));
      if (settle > 0) {
        context.globalAlpha = settle * settle * (3 - 2 * settle);
        context.fillRect(0, 0, width, height);
      }
      context.globalAlpha = 1;
      surface.style.setProperty("--inspection-mask", `url("${canvas.toDataURL()}")`);
    };
    const resize = () => {
      const bounds = surface.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      context ??= canvas.getContext("2d");
      if (!context) {
        surface.style.setProperty("--inspection-mask", active ? "none" : EMPTY);
        return;
      }
      const density = window.devicePixelRatio || 1;
      width = canvas.width = Math.round(bounds.width * density);
      height = canvas.height = Math.round(bounds.height * density);
      // Work in integer backing pixels. Fractional DPR must not antialias
      // neighboring cell edges into transparent seams.
      cellSize = Math.max(1, Math.round(SIZE * density));
      const columns = Math.floor(width / cellSize), rows = Math.floor(height / cellSize);
      const xInset = Math.floor((width - columns * cellSize) / 2), yInset = Math.floor((height - rows * cellSize) / 2);
      cells = Array.from({ length: columns * rows }, (_, index) => ({
        x: xInset + index % columns * cellSize,
        y: yInset + Math.floor(index / columns) * cellSize,
        delay: index % columns / Math.max(1, columns - 1) * 510 + noise(index, seed, 1) * 190,
        duration: 190 + noise(index, seed, 2) * 260,
      }));
      paint();
    };
    const tick = (time: number) => {
      started ??= time;
      const progress = duration ? Math.min(1, (time - started) / duration) : 1;
      phase.current = from + (target - from) * progress;
      paint();
      if (progress < 1) frame = requestAnimationFrame(tick);
      // Keep the final opaque mask. Removing it changes edge compositing at
      // fractional display scales; a static mask needs no additional frames.
    };
    resize();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(surface);
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener("resize", resize); };
  }, [active, reduceMotion, seed]);

  return <div ref={layer} id={id} className={styles.insight} aria-hidden={!active} data-inactive={!active} data-pixel-size={SIZE}>{children}</div>;
}
