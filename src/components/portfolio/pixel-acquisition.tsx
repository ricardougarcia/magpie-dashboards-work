"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import styles from "./region.module.css";

const SIZE = 4;
const INK = "#282828";
const TONES = [INK, "#303030", "#383838", "#424242"];

function noise(index: number, salt: number) {
  let value = Math.imul(index + 1 + salt * 97, 0x9e3779b1);
  value ^= value >>> 16;
  return (Math.imul(value, 0x85ebca6b) >>> 0) / 0xffffffff;
}

/** Fixed-size cells, independent of the annotation's aspect ratio. */
export function PixelAcquisition({ active }: { active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const phase = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const surface = canvas.current;
    if (!surface || reduceMotion) return;
    let frame = 0;
    let width = 0, height = 0;
    let context: CanvasRenderingContext2D | null = null;
    const target = active ? 1 : 0;
    const from = phase.current;
    const duration = (active ? 900 : 600) * Math.abs(target - from);
    let started: number | null = null;

    const paint = () => {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      if (phase.current === 0) return;
      if (phase.current === 1) {
        context.fillStyle = INK;
        context.fillRect(0, 0, width, height);
        return;
      }
      const columns = Math.floor(width / SIZE), rows = Math.floor(height / SIZE);
      // Center complete cells; never stretch or clip a cell into a rectangle.
      const xInset = (width - columns * SIZE) / 2, yInset = (height - rows * SIZE) / 2;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const index = y * columns + x;
          const start = x / Math.max(1, columns - 1) * .58 + noise(index, 1) * .17;
          const progress = Math.min(1, Math.max(0, (phase.current - start) / .25));
          if (!progress) continue;
          context.globalAlpha = Math.ceil(progress * 4) / 4;
          context.fillStyle = progress === 1 ? INK : TONES[Math.floor(noise(index, 2) * TONES.length)];
          context.fillRect(xInset + x * SIZE, yInset + y * SIZE, SIZE, SIZE);
        }
      }
      context.globalAlpha = 1;
    };
    const resize = () => {
      const bounds = surface.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      if (!width || !height) return;
      context ??= surface.getContext("2d");
      if (!context) return;
      const density = window.devicePixelRatio || 1;
      surface.width = Math.round(width * density);
      surface.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      paint();
    };
    const tick = (time: number) => {
      started ??= time;
      const progress = duration ? Math.min(1, (time - started) / duration) : 1;
      phase.current = from + (target - from) * progress;
      paint();
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    resize();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(surface);
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); };
  }, [active, reduceMotion]);

  return <canvas ref={canvas} className={styles.acquisition} aria-hidden="true" data-pixel-size={SIZE} />;
}
