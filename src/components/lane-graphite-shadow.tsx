"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  createLaneGraphiteTexture,
  LANE_GRAPHITE_ACCENTS,
  laneGraphiteCacheKey,
  laneGraphiteSeed,
  type LaneGraphiteTexture,
} from "@/lib/lane-graphite";
import type { ColorToken } from "@/lib/timeline-types";

const MAX_DEVICE_PIXEL_RATIO = 2;
const MAX_CACHE_ENTRIES = 24;
const textureCache = new Map<string, LaneGraphiteTexture>();

function cachedTexture(
  width: number,
  height: number,
  devicePixelRatio: number,
  seed: number,
  colorToken: ColorToken,
) {
  const key = laneGraphiteCacheKey({
    width,
    height,
    devicePixelRatio,
    seed,
    colorToken,
  });
  const existing = textureCache.get(key);
  if (existing) return { key, texture: existing };

  const texture = createLaneGraphiteTexture({
    width: Math.max(1, Math.round(width * devicePixelRatio)),
    height: Math.max(1, Math.round(height * devicePixelRatio)),
    seed,
    accent: LANE_GRAPHITE_ACCENTS[colorToken],
  });
  textureCache.set(key, texture);
  if (textureCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = textureCache.keys().next().value;
    if (oldestKey) textureCache.delete(oldestKey);
  }
  return { key, texture };
}

export function LaneGraphiteShadow({
  laneName,
  laneIndex,
  colorToken,
}: {
  laneName: string;
  laneIndex: number;
  colorToken: ColorToken;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seed = useMemo(() => laneGraphiteSeed(laneName, laneIndex), [laneIndex, laneName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      const context = canvas.getContext("2d");
      if (!context) return;
      const devicePixelRatio = Math.min(
        MAX_DEVICE_PIXEL_RATIO,
        Math.max(1, window.devicePixelRatio || 1),
      );
      const { key, texture } = cachedTexture(
        width,
        height,
        devicePixelRatio,
        seed,
        colorToken,
      );
      if (canvas.dataset.textureKey === key) return;

      canvas.width = texture.width;
      canvas.height = texture.height;
      const imageData = context.createImageData(texture.width, texture.height);
      imageData.data.set(texture.pixels);
      context.putImageData(imageData, 0, 0);
      canvas.dataset.textureKey = key;
      canvas.dataset.colorToken = colorToken;
    };

    const rect = canvas.getBoundingClientRect();
    render(rect.width, rect.height);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) render(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [colorToken, seed]);

  return (
    <canvas
      ref={canvasRef}
      className="lane-graphite-shadow"
      aria-hidden="true"
      data-lane-graphite={laneName}
    />
  );
}
