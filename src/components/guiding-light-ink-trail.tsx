"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  GUIDING_LIGHT_INK_PARTICLE_CAP,
  GUIDING_LIGHT_INK_SPACING,
  GUIDING_LIGHT_INK_STATIONARY_INTERVAL,
  createInkParticle,
  easeOutCubic,
  particleVertexRadius,
  resolveInkParticleVisual,
  sampleInkSegment,
  type InkParticle,
  type InkPoint,
} from "@/lib/guiding-light-ink";

type GuidingLightInkTrailProps = {
  trackRef: RefObject<HTMLDivElement | null>;
  disabled?: boolean;
};

type Surface = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
};

const CORE_COLOR = "#111311";
const RESIDUE_COLOR = "#d6d5d0";

function createBufferSurface(): Surface | null {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  return context ? { canvas, context } : null;
}

function drawParticle(
  context: CanvasRenderingContext2D,
  particle: InkParticle,
  now: number,
  scale: number,
  opacity: number,
) {
  const vertexCount = particle.radialProfile.length;
  const points = particle.radialProfile.map((_, index) => {
    const angle = (index / vertexCount) * Math.PI * 2;
    const radius = particleVertexRadius(particle, index, now, scale);
    return {
      x: particle.x + Math.cos(angle) * radius,
      y: particle.y + Math.sin(angle) * radius,
    };
  });
  const first = points[0];
  const second = points[1];
  context.beginPath();
  context.moveTo((first.x + second.x) / 2, (first.y + second.y) / 2);
  for (let index = 1; index <= vertexCount; index += 1) {
    const point = points[index % vertexCount];
    const next = points[(index + 1) % vertexCount];
    context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
  }
  context.closePath();
  context.globalAlpha = opacity;
  context.fill();
}

function thresholdSurface(surface: Surface, mode: "core" | "residue") {
  const { canvas, context } = surface;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] / 255;
    const threshold = mode === "core" ? 0.005 : 0.003;
    const range = mode === "core" ? 0.06 : 0.025;
    const level = Math.min(1, Math.max(0, (alpha - threshold) / range));
    if (level === 0) {
      pixels[index + 3] = 0;
      continue;
    }
    const eased = easeOutCubic(level);
    if (mode === "core") {
      pixels[index] = 17;
      pixels[index + 1] = 19;
      pixels[index + 2] = 17;
      pixels[index + 3] = Math.round(eased * 255);
    } else {
      pixels[index] = 214;
      pixels[index + 1] = 213;
      pixels[index + 2] = 208;
      pixels[index + 3] = Math.round(eased * 112);
    }
  }
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.putImageData(image, 0, 0);
}

export function GuidingLightInkTrail({ trackRef, disabled = false }: GuidingLightInkTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas || disabled) return;

    let visibleContext: CanvasRenderingContext2D | null = null;
    let coreSurface: Surface | null = null;
    let residueSurface: Surface | null = null;
    let frame: number | null = null;
    let pointerInside = false;
    let latestPoint: InkPoint | null = null;
    let sampledPoint: InkPoint | null = null;
    let needsInitialDeposit = false;
    let distanceCarry = 0;
    let lastDepositAt = 0;
    let cssWidth = 0;
    let cssHeight = 0;
    let pixelRatio = 1;
    const particles: InkParticle[] = [];
    const particlePool: InkParticle[] = [];

    const configureContext = (context: CanvasRenderingContext2D) => {
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.imageSmoothingEnabled = true;
    };

    const resizeSurface = () => {
      const rect = track.getBoundingClientRect();
      cssWidth = Math.max(0, rect.width);
      cssHeight = Math.max(0, rect.height);
      pixelRatio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const physicalWidth = Math.max(1, Math.round(cssWidth * pixelRatio));
      const physicalHeight = Math.max(1, Math.round(cssHeight * pixelRatio));
      canvas.width = physicalWidth;
      canvas.height = physicalHeight;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      [coreSurface, residueSurface].forEach((surface) => {
        if (!surface) return;
        surface.canvas.width = physicalWidth;
        surface.canvas.height = physicalHeight;
      });
      if (visibleContext) configureContext(visibleContext);
      if (coreSurface) configureContext(coreSurface.context);
      if (residueSurface) configureContext(residueSurface.context);
    };

    const ensureSurfaces = () => {
      if (visibleContext && coreSurface && residueSurface) return true;
      visibleContext = canvas.getContext("2d");
      coreSurface = createBufferSurface();
      residueSurface = createBufferSurface();
      if (!visibleContext || !coreSurface || !residueSurface) return false;
      resizeSurface();
      return true;
    };

    const deposit = (point: InkPoint, now: number) => {
      const next = createInkParticle(point, now);
      const recycled = particlePool.pop();
      if (recycled) {
        Object.assign(recycled, next);
        particles.push(recycled);
      } else {
        particles.push(next);
      }
      if (particles.length > GUIDING_LIGHT_INK_PARTICLE_CAP) {
        particlePool.push(...particles.splice(0, particles.length - GUIDING_LIGHT_INK_PARTICLE_CAP));
      }
      lastDepositAt = now;
    };

    const render = (now: number) => {
      frame = null;
      if (!visibleContext || !coreSurface || !residueSurface) return;

      if (pointerInside && latestPoint) {
        if (!sampledPoint) {
          sampledPoint = latestPoint;
          needsInitialDeposit = true;
        }
        if (needsInitialDeposit) {
          deposit(sampledPoint, now);
          needsInitialDeposit = false;
        }
        if (sampledPoint) {
          const sampled = sampleInkSegment(sampledPoint, latestPoint, GUIDING_LIGHT_INK_SPACING, distanceCarry);
          sampled.points.forEach((point) => deposit(point, now));
          if (sampled.points.length > 0 || sampledPoint.x !== latestPoint.x || sampledPoint.y !== latestPoint.y) {
            sampledPoint = latestPoint;
            distanceCarry = sampled.carry;
          }
        }

        if (now - lastDepositAt >= GUIDING_LIGHT_INK_STATIONARY_INTERVAL) {
          const poolAngle = Math.random() * Math.PI * 2;
          const poolDistance = Math.random() * 3.5;
          deposit({
            x: latestPoint.x + Math.cos(poolAngle) * poolDistance,
            y: latestPoint.y + Math.sin(poolAngle) * poolDistance,
          }, now);
        }
      }

      coreSurface.context.setTransform(1, 0, 0, 1, 0, 0);
      coreSurface.context.clearRect(0, 0, coreSurface.canvas.width, coreSurface.canvas.height);
      residueSurface.context.setTransform(1, 0, 0, 1, 0, 0);
      residueSurface.context.clearRect(0, 0, residueSurface.canvas.width, residueSurface.canvas.height);
      configureContext(coreSurface.context);
      configureContext(residueSurface.context);
      coreSurface.context.fillStyle = CORE_COLOR;
      coreSurface.context.filter = "blur(1px)";
      residueSurface.context.fillStyle = RESIDUE_COLOR;
      residueSurface.context.filter = "blur(1.35px)";
      const coreContext = coreSurface.context;
      const residueContext = residueSurface.context;

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const visual = resolveInkParticleVisual(particles[index], now);
        if (!visual.alive) {
          const [expired] = particles.splice(index, 1);
          particlePool.push(expired);
        }
      }
      particles.forEach((particle) => {
        const visual = resolveInkParticleVisual(particle, now);
        if (visual.residueOpacity > 0) {
          drawParticle(residueContext, particle, now, visual.residueScale, visual.residueOpacity);
        }
        if (visual.coreOpacity > 0) {
          drawParticle(coreContext, particle, now, visual.coreScale, visual.coreOpacity);
        }
      });
      thresholdSurface(residueSurface, "residue");
      thresholdSurface(coreSurface, "core");

      visibleContext.setTransform(1, 0, 0, 1, 0, 0);
      visibleContext.clearRect(0, 0, canvas.width, canvas.height);
      visibleContext.globalAlpha = 1;
      visibleContext.drawImage(residueSurface.canvas, 0, 0);
      visibleContext.globalAlpha = 1;
      visibleContext.drawImage(coreSurface.canvas, 0, 0);

      if (pointerInside || particles.length > 0) frame = window.requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (frame !== null || !ensureSurfaces()) return;
      frame = window.requestAnimationFrame(render);
    };

    const localPoint = (event: PointerEvent): InkPoint => {
      const rect = track.getBoundingClientRect();
      return {
        x: Math.min(rect.width, Math.max(0, event.clientX - rect.left)),
        y: Math.min(rect.height, Math.max(0, event.clientY - rect.top)),
      };
    };

    const acceptsPointer = (event: PointerEvent) => event.isPrimary !== false && event.pointerType !== "touch";

    const onPointerEnter = (event: PointerEvent) => {
      if (!acceptsPointer(event)) return;
      pointerInside = true;
      latestPoint = localPoint(event);
      sampledPoint = latestPoint;
      needsInitialDeposit = true;
      distanceCarry = 0;
      startLoop();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!acceptsPointer(event)) return;
      const point = localPoint(event);
      if (!pointerInside || !sampledPoint) {
        sampledPoint = point;
        needsInitialDeposit = true;
        distanceCarry = 0;
      }
      pointerInside = true;
      latestPoint = point;
      startLoop();
    };
    const onPointerLeave = (event: PointerEvent) => {
      if (!acceptsPointer(event)) return;
      pointerInside = false;
      latestPoint = null;
      sampledPoint = null;
      needsInitialDeposit = false;
      distanceCarry = 0;
      startLoop();
    };

    resizeSurface();
    const observer = new ResizeObserver(resizeSurface);
    observer.observe(track);
    track.addEventListener("pointerenter", onPointerEnter, { passive: true });
    track.addEventListener("pointermove", onPointerMove, { passive: true });
    track.addEventListener("pointerleave", onPointerLeave, { passive: true });
    track.addEventListener("pointercancel", onPointerLeave, { passive: true });

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer.disconnect();
      track.removeEventListener("pointerenter", onPointerEnter);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerleave", onPointerLeave);
      track.removeEventListener("pointercancel", onPointerLeave);
    };
  }, [disabled, trackRef]);

  if (disabled) return null;
  return <canvas ref={canvasRef} className="guiding-light-ink-canvas" aria-hidden="true" />;
}
