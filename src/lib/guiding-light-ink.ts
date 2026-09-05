export const GUIDING_LIGHT_INK_SPACING = 5;
export const GUIDING_LIGHT_INK_PARTICLE_CAP = 520;
export const GUIDING_LIGHT_INK_NIB_RESPONSE = 0.24;
export const GUIDING_LIGHT_INK_DRIP_SPEED_THRESHOLD = 72;

export type InkPoint = {
  x: number;
  y: number;
};

export type InkParticle = InkPoint & {
  bornAt: number;
  radius: number;
  coreHold: number;
  coreFade: number;
  residueStart: number;
  residueFade: number;
  residuePeak: number;
  seed: number;
  radialProfile: number[];
};

export type InkParticleVisual = {
  alive: boolean;
  coreOpacity: number;
  coreScale: number;
  residueOpacity: number;
  residueScale: number;
};

export type SegmentSample = {
  points: InkPoint[];
  carry: number;
};

export type InkDrip = {
  point: InkPoint;
  radiusScale: number;
};

const clampUnit = (value: number) => Math.min(1, Math.max(0, value));

export function easeOutCubic(value: number) {
  const t = clampUnit(value);
  return 1 - (1 - t) ** 3;
}

export function nibResponseFactor(
  deltaMs: number,
  responseAt60Fps = GUIDING_LIGHT_INK_NIB_RESPONSE,
) {
  const frameUnits = Math.min(3, Math.max(0, deltaMs / (1000 / 60)));
  return 1 - (1 - responseAt60Fps) ** frameUnits;
}

export function headExtensionRatio(speed: number) {
  if (speed <= GUIDING_LIGHT_INK_DRIP_SPEED_THRESHOLD * 0.45) return 0;
  return 0.5 + clampUnit((speed - GUIDING_LIGHT_INK_DRIP_SPEED_THRESHOLD) / 620) * 0.5;
}

export function dripEmissionProbability(speed: number, deltaMs: number) {
  if (speed <= GUIDING_LIGHT_INK_DRIP_SPEED_THRESHOLD || deltaMs <= 0) return 0;
  const ratePerSecond = 1.05 + clampUnit((speed - GUIDING_LIGHT_INK_DRIP_SPEED_THRESHOLD) / 900) * 1.55;
  return clampUnit(ratePerSecond * (deltaMs / 1000));
}

export function createAdvanceDrip(
  origin: InkPoint,
  direction: InkPoint,
  stampRadius: number,
  random: () => number = Math.random,
): InkDrip {
  const magnitude = Math.hypot(direction.x, direction.y) || 1;
  const unitX = direction.x / magnitude;
  const unitY = direction.y / magnitude;
  const distance = stampRadius * (1 + random() * 2);
  const lateral = stampRadius * (random() - 0.5);
  return {
    point: {
      x: origin.x + unitX * distance - unitY * lateral,
      y: origin.y + unitY * distance + unitX * lateral,
    },
    radiusScale: 0.3 + random() * 0.3,
  };
}

export function sampleInkSegment(
  from: InkPoint,
  to: InkPoint,
  spacing = GUIDING_LIGHT_INK_SPACING,
  carry = 0,
): SegmentSample {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || spacing <= 0) return { points: [], carry };

  const normalizedCarry = ((carry % spacing) + spacing) % spacing;
  const firstDistance = normalizedCarry === 0 ? spacing : spacing - normalizedCarry;
  const points: InkPoint[] = [];
  for (let offset = firstDistance; offset <= distance; offset += spacing) {
    const ratio = offset / distance;
    points.push({ x: from.x + dx * ratio, y: from.y + dy * ratio });
  }

  return {
    points,
    carry: (normalizedCarry + distance) % spacing,
  };
}

export function createInkParticle(
  point: InkPoint,
  bornAt: number,
  random: () => number = Math.random,
): InkParticle {
  const lifetimeJitter = 0.82 + random() * 0.36;
  const coreHold = (500 + random() * 200) * lifetimeJitter;
  const coreFade = (900 + random() * 300) * lifetimeJitter;
  const residueStart = coreHold + coreFade * (0.56 + random() * 0.08);
  const residueFade = (1800 + random() * 600) * lifetimeJitter;
  const vertexCount = 14 + Math.floor(random() * 5);
  const rawProfile = Array.from({ length: vertexCount }, () => 0.68 + random() * 0.64);
  const radialProfile = rawProfile.map((value, index) => {
    const previous = rawProfile[(index - 1 + vertexCount) % vertexCount];
    const next = rawProfile[(index + 1) % vertexCount];
    return previous * 0.22 + value * 0.56 + next * 0.22;
  });

  return {
    ...point,
    bornAt,
    radius: 15 + random() * 10,
    coreHold,
    coreFade,
    residueStart,
    residueFade,
    residuePeak: 0.35 + random() * 0.1,
    seed: random() * Math.PI * 2,
    radialProfile,
  };
}

export function resolveInkParticleVisual(particle: InkParticle, now: number): InkParticleVisual {
  const age = Math.max(0, now - particle.bornAt);
  const coreProgress = clampUnit((age - particle.coreHold) / particle.coreFade);
  const coreEase = easeOutCubic(coreProgress);
  const residueProgress = clampUnit((age - particle.residueStart) / particle.residueFade);
  const residueRise = easeOutCubic(residueProgress / 0.24);
  const residueFall = 1 - easeOutCubic((residueProgress - 0.24) / 0.76);
  const residueOpacity = age < particle.residueStart
    ? 0
    : particle.residuePeak * Math.min(residueRise, residueFall);
  const expiresAt = particle.residueStart + particle.residueFade;

  return {
    alive: age < expiresAt,
    coreOpacity: age <= particle.coreHold ? 1 : 1 - coreEase,
    coreScale: age <= particle.coreHold ? 1 : 1 - coreEase * 0.48,
    residueOpacity,
    residueScale: 1.04 + easeOutCubic(residueProgress) * 0.32,
  };
}

export function particleVertexRadius(
  particle: InkParticle,
  vertexIndex: number,
  morphTime: number,
  scale: number,
) {
  const vertexCount = particle.radialProfile.length;
  const angle = (vertexIndex / vertexCount) * Math.PI * 2;
  const slowMorph = Math.sin(angle * 2 + particle.seed + morphTime * 0.00105) * 0.145;
  const secondaryMorph = Math.sin(angle * 3 - particle.seed * 0.7 - morphTime * 0.00071) * 0.075;
  return particle.radius * scale * particle.radialProfile[vertexIndex] * (1 + slowMorph + secondaryMorph);
}
