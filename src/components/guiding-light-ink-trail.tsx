"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  GUIDING_LIGHT_INK_DRIP_SPEED_THRESHOLD,
  GUIDING_LIGHT_INK_PARTICLE_CAP,
  GUIDING_LIGHT_INK_SPACING,
  createAdvanceDrip,
  createInkParticle,
  dripEmissionProbability,
  headExtensionRatio,
  nibResponseFactor,
  particleVertexRadius,
  resolveInkParticleVisual,
  sampleInkSegment,
  type InkParticle,
  type InkPoint,
} from "@/lib/guiding-light-ink";

type GuidingLightInkTrailProps = {
  trackRef: RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  coreColor?: string;
};

type Surface = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
};

type ForwardDeformation = {
  direction: InkPoint;
  extension: number;
};

const CORE_COLOR = "#282828";
const RESIDUE_COLOR = "#d6d5d0";
const NOMINAL_FRAME_MS = 1000 / 60;
const MAX_POINTER_SAMPLES = 96;

function createBufferSurface(): Surface | null {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  return context ? { canvas, context } : null;
}

function drawParticle(
  context: CanvasRenderingContext2D,
  particle: InkParticle,
  morphTime: number,
  scale: number,
  opacity: number,
  deformation?: ForwardDeformation,
) {
  const vertexCount = particle.radialProfile.length;
  const directionMagnitude = deformation
    ? Math.hypot(deformation.direction.x, deformation.direction.y) || 1
    : 1;
  const directionX = deformation ? deformation.direction.x / directionMagnitude : 0;
  const directionY = deformation ? deformation.direction.y / directionMagnitude : 0;
  const points = particle.radialProfile.map((_, index) => {
    const angle = (index / vertexCount) * Math.PI * 2;
    const radius = particleVertexRadius(particle, index, morphTime, scale);
    const normalX = Math.cos(angle);
    const normalY = Math.sin(angle);
    const forwardWeight = deformation
      ? Math.max(0, normalX * directionX + normalY * directionY) ** 1.45
      : 0;
    const forwardOffset = deformation ? deformation.extension * forwardWeight : 0;
    return {
      x: particle.x + normalX * radius + directionX * forwardOffset,
      y: particle.y + normalY * radius + directionY * forwardOffset,
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

export function GuidingLightInkTrail({ trackRef, disabled = false, coreColor = CORE_COLOR }: GuidingLightInkTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (canvas) canvas.hidden = disabled;
    if (!track || !canvas || disabled) return;

    let visibleContext: CanvasRenderingContext2D | null = null;
    let coreSurface: Surface | null = null;
    let residueSurface: Surface | null = null;
    let frame: number | null = null;
    let pointerInside = false;
    let pointerTarget: InkPoint | null = null;
    let nibPoint: InkPoint | null = null;
    let headParticle: InkParticle | null = null;
    let previousDirection: InkPoint = { x: 1, y: 0 };
    let pointerSamples: InkPoint[] = [];
    let needsInitialDeposit = false;
    let distanceCarry = 0;
    let lastFrameAt: number | null = null;
    let morphTime = 0;
    let cssWidth = 0;
    let cssHeight = 0;
    let pixelRatio = 1;
    const particles: InkParticle[] = [];
    const particlePool: InkParticle[] = [];

    const configureContext = (context: CanvasRenderingContext2D) => {
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.imageSmoothingEnabled = true;
      context.globalAlpha = 1;
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

    const deposit = (point: InkPoint, now: number, radiusScale = 1) => {
      const next = createInkParticle(point, now);
      next.radius *= radiusScale;
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
    };

    const depositNibSegment = (from: InkPoint, to: InkPoint, now: number) => {
      const sampled = sampleInkSegment(from, to, GUIDING_LIGHT_INK_SPACING, distanceCarry);
      sampled.points.forEach((point) => deposit(point, now));
      distanceCarry = sampled.carry;
    };

    const render = (now: number) => {
      frame = null;
      if (!visibleContext || !coreSurface || !residueSurface) return;

      const deltaMs = lastFrameAt === null
        ? NOMINAL_FRAME_MS
        : Math.min(50, Math.max(1, now - lastFrameAt));
      lastFrameAt = now;
      morphTime += deltaMs;
      let frameSpeed = 0;

      if (pointerInside && pointerTarget && nibPoint) {
        const frameStart = nibPoint;
        const targets = pointerSamples.length > 0 ? pointerSamples.splice(0) : [pointerTarget];
        const subDelta = deltaMs / Math.max(1, targets.length);

        targets.forEach((target) => {
          if (!nibPoint) return;
          const response = nibResponseFactor(subDelta);
          const nextNib = {
            x: nibPoint.x + (target.x - nibPoint.x) * response,
            y: nibPoint.y + (target.y - nibPoint.y) * response,
          };
          depositNibSegment(nibPoint, nextNib, now);
          nibPoint = nextNib;
        });

        if (needsInitialDeposit) {
          deposit(nibPoint, now);
          needsInitialDeposit = false;
        }

        const velocity = {
          x: nibPoint.x - frameStart.x,
          y: nibPoint.y - frameStart.y,
        };
        const frameDistance = Math.hypot(velocity.x, velocity.y);
        frameSpeed = frameDistance / (deltaMs / 1000);
        if (frameDistance > 0.01) {
          previousDirection = {
            x: velocity.x / frameDistance,
            y: velocity.y / frameDistance,
          };
        }

        if (
          frameSpeed > GUIDING_LIGHT_INK_DRIP_SPEED_THRESHOLD
          && Math.random() < dripEmissionProbability(frameSpeed, deltaMs)
        ) {
          const drip = createAdvanceDrip(nibPoint, previousDirection, headParticle?.radius ?? 20);
          deposit({
            x: Math.min(cssWidth, Math.max(0, drip.point.x)),
            y: Math.min(cssHeight, Math.max(0, drip.point.y)),
          }, now, drip.radiusScale);
        }

        if (headParticle) {
          headParticle.x = nibPoint.x;
          headParticle.y = nibPoint.y;
        }
      }

      coreSurface.context.setTransform(1, 0, 0, 1, 0, 0);
      coreSurface.context.filter = "none";
      coreSurface.context.clearRect(0, 0, coreSurface.canvas.width, coreSurface.canvas.height);
      residueSurface.context.setTransform(1, 0, 0, 1, 0, 0);
      residueSurface.context.filter = "none";
      residueSurface.context.clearRect(0, 0, residueSurface.canvas.width, residueSurface.canvas.height);
      configureContext(coreSurface.context);
      configureContext(residueSurface.context);
      coreSurface.context.fillStyle = coreColor;
      residueSurface.context.fillStyle = RESIDUE_COLOR;
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
          const residuePresence = Math.sqrt(Math.min(1, visual.residueOpacity / particle.residuePeak));
          drawParticle(residueContext, particle, morphTime, visual.residueScale * residuePresence, 1);
        }
        if (visual.coreOpacity > 0) {
          const corePresence = 0.42 + Math.sqrt(visual.coreOpacity) * 0.58;
          drawParticle(coreContext, particle, morphTime, visual.coreScale * corePresence, 1);
        }
      });

      if (pointerInside && pointerTarget && nibPoint && headParticle) {
        const targetGap = Math.hypot(pointerTarget.x - nibPoint.x, pointerTarget.y - nibPoint.y);
        const extensionRatio = headExtensionRatio(frameSpeed);
        const forwardExtension = Math.max(0, targetGap + headParticle.radius * (extensionRatio - 1));
        drawParticle(coreContext, headParticle, morphTime, 1, 1, {
          direction: previousDirection,
          extension: forwardExtension,
        });
      }

      visibleContext.setTransform(1, 0, 0, 1, 0, 0);
      visibleContext.filter = "none";
      visibleContext.clearRect(0, 0, canvas.width, canvas.height);
      visibleContext.filter = "blur(1.55px)";
      visibleContext.globalAlpha = 0.34;
      visibleContext.drawImage(residueSurface.canvas, 0, 0);
      visibleContext.filter = "blur(1.15px)";
      visibleContext.globalAlpha = 1;
      visibleContext.drawImage(coreSurface.canvas, 0, 0);
      visibleContext.filter = "none";

      if (pointerInside || particles.length > 0) frame = window.requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (frame !== null || !ensureSurfaces()) return;
      lastFrameAt = null;
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

    const collectPointerSamples = (event: PointerEvent) => {
      const coalesced = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [];
      const source = coalesced.length > 0 ? [...coalesced, event] : [event];
      const points = source.map(localPoint);
      const deduplicated = points.filter((point, index) => (
        index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y
      ));
      pointerSamples.push(...deduplicated);
      if (pointerSamples.length > MAX_POINTER_SAMPLES) {
        pointerSamples.splice(0, pointerSamples.length - MAX_POINTER_SAMPLES);
      }
      return deduplicated[deduplicated.length - 1] ?? localPoint(event);
    };

    const initializePointer = (point: InkPoint) => {
      pointerInside = true;
      pointerTarget = point;
      nibPoint = point;
      headParticle = createInkParticle(point, 0);
      headParticle.radius = 20;
      pointerSamples = [];
      needsInitialDeposit = true;
      distanceCarry = 0;
    };

    const onPointerEnter = (event: PointerEvent) => {
      if (!acceptsPointer(event)) return;
      initializePointer(localPoint(event));
      startLoop();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!acceptsPointer(event)) return;
      const point = collectPointerSamples(event);
      if (!pointerInside || !nibPoint) initializePointer(point);
      pointerInside = true;
      pointerTarget = point;
      startLoop();
    };
    const onPointerLeave = (event: PointerEvent) => {
      if (!acceptsPointer(event)) return;
      if (nibPoint) deposit(nibPoint, performance.now());
      pointerInside = false;
      pointerTarget = null;
      nibPoint = null;
      headParticle = null;
      pointerSamples = [];
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
  }, [disabled, trackRef, coreColor]);

  return <canvas ref={canvasRef} className="guiding-light-ink-canvas" aria-hidden="true" />;
}
