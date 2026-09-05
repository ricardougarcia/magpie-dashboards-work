import { describe, expect, it } from "vitest";
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
} from "@/lib/guiding-light-ink";

describe("Guiding Light ink simulation", () => {
  it("keeps frame-rate independent nib smoothing within the requested response range", () => {
    const fullFrame = nibResponseFactor(1000 / 60);
    const halfFrame = nibResponseFactor(1000 / 120);
    const twoHalfFrames = 1 - (1 - halfFrame) ** 2;

    expect(fullFrame).toBeCloseTo(0.24, 5);
    expect(twoHalfFrames).toBeCloseTo(fullFrame, 5);
    expect(GUIDING_LIGHT_INK_SPACING).toBeLessThanOrEqual(15 * 0.4);
  });

  it("extends the wet head only while moving and keeps it within one radius", () => {
    expect(headExtensionRatio(0)).toBe(0);
    expect(headExtensionRatio(GUIDING_LIGHT_INK_DRIP_SPEED_THRESHOLD)).toBe(0.5);
    expect(headExtensionRatio(10_000)).toBe(1);
  });

  it("emits sparse, speed-gated drips one to three radii ahead with bounded lateral offset", () => {
    expect(dripEmissionProbability(GUIDING_LIGHT_INK_DRIP_SPEED_THRESHOLD - 1, 16)).toBe(0);
    expect(dripEmissionProbability(280, 16)).toBeGreaterThan(0);
    expect(dripEmissionProbability(900, 16)).toBeGreaterThan(dripEmissionProbability(280, 16));

    let index = 0;
    const values = [0.5, 1, 0];
    const drip = createAdvanceDrip({ x: 10, y: 10 }, { x: 4, y: 0 }, 20, () => values[index++]);
    expect(drip.point.x).toBe(50);
    expect(drip.point.y).toBe(20);
    expect(drip.radiusScale).toBe(0.3);
  });

  it("interpolates fast pointer movement at a fixed spatial interval across event boundaries", () => {
    const first = sampleInkSegment({ x: 0, y: 0 }, { x: 35, y: 0 }, 10);
    expect(first.points.map((point) => point.x)).toEqual([10, 20, 30]);
    expect(first.carry).toBe(5);

    const second = sampleInkSegment({ x: 35, y: 0 }, { x: 50, y: 0 }, 10, first.carry);
    expect(second.points.map((point) => point.x)).toEqual([40, 50]);
    expect(second.carry).toBe(0);
  });

  it("overlaps the residue with the receding core and expires without permanent residue", () => {
    const particle = createInkParticle({ x: 20, y: 12 }, 100, () => 0.5);
    const fresh = resolveInkParticleVisual(particle, 100);
    expect(fresh).toMatchObject({ alive: true, coreOpacity: 1, coreScale: 1, residueOpacity: 0 });

    const overlap = resolveInkParticleVisual(particle, particle.bornAt + particle.residueStart + 40);
    expect(overlap.alive).toBe(true);
    expect(overlap.coreOpacity).toBeGreaterThan(0);
    expect(overlap.residueOpacity).toBeGreaterThan(0);

    const expired = resolveInkParticleVisual(
      particle,
      particle.bornAt + particle.residueStart + particle.residueFade + 1,
    );
    expect(expired.alive).toBe(false);
    expect(expired.coreOpacity).toBe(0);
    expect(expired.residueOpacity).toBe(0);
  });

  it("jitter-seeds non-circular particle profiles and keeps the live-particle budget bounded", () => {
    let cursor = 0;
    const values = [0.08, 0.82, 0.24, 0.68, 0.16, 0.91, 0.32, 0.74];
    const particle = createInkParticle({ x: 0, y: 0 }, 0, () => values[(cursor += 1) % values.length]);
    const radii = particle.radialProfile.map((_, index) => particleVertexRadius(particle, index, 0, 1));

    expect(new Set(radii.map((radius) => radius.toFixed(3))).size).toBeGreaterThan(4);
    expect(particle.radialProfile.length).toBeGreaterThanOrEqual(14);
    expect(particle.radialProfile.length).toBeLessThanOrEqual(18);
    expect(GUIDING_LIGHT_INK_PARTICLE_CAP).toBeGreaterThanOrEqual(400);
    expect(GUIDING_LIGHT_INK_PARTICLE_CAP).toBeLessThanOrEqual(600);
  });

  it("uses one shared frame clock for edge morphing rather than particle birth time", () => {
    const first = createInkParticle({ x: 0, y: 0 }, 0, () => 0.5);
    const second = createInkParticle({ x: 0, y: 0 }, 50_000, () => 0.5);
    expect(particleVertexRadius(first, 3, 1250, 1)).toBeCloseTo(
      particleVertexRadius(second, 3, 1250, 1),
      8,
    );
    expect(particleVertexRadius(first, 3, 1266, 1)).not.toBe(
      particleVertexRadius(first, 3, 1250, 1),
    );
  });

  it("varies total dry-out time between independently born particles", () => {
    const short = createInkParticle({ x: 0, y: 0 }, 0, () => 0);
    const long = createInkParticle({ x: 0, y: 0 }, 0, () => 0.999);
    const shortLifetime = short.residueStart + short.residueFade;
    const longLifetime = long.residueStart + long.residueFade;

    expect(longLifetime).toBeGreaterThan(shortLifetime * 1.8);
    expect(shortLifetime).toBeGreaterThan(2000);
    expect(longLifetime).toBeLessThan(5000);
  });
});
