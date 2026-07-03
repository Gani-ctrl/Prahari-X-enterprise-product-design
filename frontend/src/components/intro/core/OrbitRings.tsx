import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { AI_COLORS } from "../aiIntroConfig";

// ----------------------------------------------------------------------------
// The ring system surrounding the tactical globe: ~28 independently
// animated elements -- segmented chip rings, plain thin "holographic
// circles" (including a couple of extra-soft, wide, low-opacity ones that
// read as "blurred" without a real blur pass), broken arc segments,
// tick-mark bezels, breathing pulse rings, and fast scan markers -- plus
// two particle fields of tiny orbiting data motes. Every entry below has
// its own radius, tilt, speed (sign AND magnitude), opacity, and animation
// kind, so no two rings move identically.
//
// Final polish-pass notes (this file only tunes numbers/adds variety -- no
// new architecture):
//   - RING_SCALE (0.74) shrinks the whole system a further ~15% on top of
//     the previous pass's 0.87, so the reactor reads as clearly supporting
//     the globe rather than competing with the HUD's side columns.
//   - radialFalloff()'s curve was pulled in and deepened (start/end moved
//     inward, floor lowered) so outer rings fade further into darkness --
//     "the viewer should never feel where the reactor ends."
//   - A handful of rings (both segmented/arc and thin) now carry an
//     optional `wobble` frequency: instead of a constant angular velocity,
//     their effective spin speed is itself modulated by a slow sine, so
//     those rings visibly speed up and slow down as they turn -- a
//     different EASING per ring, not just a different constant speed.
//     Rings without `wobble` keep their original constant-speed rotation.
// Metalness/roughness vary per segmented ring (some near-metallic and
// sharp, some diffuse and soft/"holographic"), and each ring group gets a
// small deterministic starting rotation offset (golden-angle spaced) so
// none of them ever share the same phase at rest.
//
// Deliberately NOT a single rotating parent group: each ring only rotates
// itself, around its own local origin, driven purely by elapsed time. There
// is no pointer/cursor input anywhere in this file, so nothing here can
// ever visually displace "the core" as a whole -- only the individual
// layers turn in place. (The globe, in TacticalGlobe.tsx, is the one layer
// that gets a small independent cursor tilt; everything here is
// autonomous.)
// ----------------------------------------------------------------------------

const RING_SCALE = 0.74;
const GOLDEN_ANGLE = 2.399963; // radians -- even angular spacing with no repeats

function ringPhase(index: number) {
  return (index * GOLDEN_ANGLE) % (Math.PI * 2);
}

/** Smoothly dims a ring's opacity based on how far out its (scaled) radius
 * sits, so the composition fades into darkness rather than ending on a
 * hard edge. Rings inside `start` are unaffected; rings past `end` are
 * dimmed to `floor` of their own base opacity. */
function radialFalloff(radius: number, start = 1.3, end = 2.3, floor = 0.16) {
  const t = THREE.MathUtils.clamp((radius - start) / (end - start), 0, 1);
  const eased = t * t * (3 - 2 * t); // smoothstep -- no hard knee
  return 1 - eased * (1 - floor);
}

/** Effective angular speed for a ring: constant, unless a `wobble`
 * frequency is present, in which case the base speed is sinusoidally
 * modulated over time -- gives some rings a genuinely different easing
 * feel (speeding up/slowing down) rather than every ring spinning at one
 * flat rate. */
function wobbleSpeed(baseSpeed: number, wobble: number | undefined, phase: number, t: number) {
  if (!wobble) return baseSpeed;
  return baseSpeed * (1 + 0.35 * Math.sin(t * wobble + phase));
}

interface SegmentedSpec {
  kind: "segmented" | "arc";
  radius: number;
  segments: number;
  segmentAngle: number;
  thickness: number;
  speed: number;
  tilt: number;
  opacity: number;
  color: string;
  emissive: string;
  metalness: number;
  roughness: number;
  arcDeg?: number; // only for "arc": how much of the circle is populated
  wobble?: number; // optional sinusoidal speed-modulation frequency
}

const SEGMENTED_SPECS: SegmentedSpec[] = [
  { kind: "segmented", radius: 1.35, segments: 30, segmentAngle: 0.11, thickness: 0.024, speed: 0.16, tilt: 0.12, opacity: 0.9, color: AI_COLORS.glow600, emissive: AI_COLORS.glow400, metalness: 0.75, roughness: 0.15 },
  { kind: "segmented", radius: 1.6, segments: 16, segmentAngle: 0.26, thickness: 0.032, speed: -0.24, tilt: -0.42, opacity: 0.85, color: AI_COLORS.glow700, emissive: AI_COLORS.glow300, metalness: 0.2, roughness: 0.65, wobble: 0.5 },
  { kind: "segmented", radius: 1.85, segments: 44, segmentAngle: 0.045, thickness: 0.018, speed: 0.3, tilt: 0.55, opacity: 0.75, color: AI_COLORS.glow500, emissive: AI_COLORS.glow200, metalness: 0.55, roughness: 0.3 },
  { kind: "segmented", radius: 2.05, segments: 22, segmentAngle: 0.09, thickness: 0.026, speed: -0.36, tilt: -0.2, opacity: 0.85, color: AI_COLORS.glow600, emissive: AI_COLORS.glow400, metalness: 0.8, roughness: 0.12 },
  { kind: "segmented", radius: 2.3, segments: 10, segmentAngle: 0.3, thickness: 0.042, speed: 0.42, tilt: 0.34, opacity: 0.95, color: AI_COLORS.glow400, emissive: AI_COLORS.glow200, metalness: 0.15, roughness: 0.7, wobble: 0.35 },
  { kind: "segmented", radius: 2.55, segments: 36, segmentAngle: 0.06, thickness: 0.02, speed: -0.12, tilt: -0.6, opacity: 0.7, color: AI_COLORS.glow700, emissive: AI_COLORS.glow300, metalness: 0.4, roughness: 0.4 },
  { kind: "segmented", radius: 2.75, segments: 18, segmentAngle: 0.13, thickness: 0.03, speed: 0.2, tilt: 0.08, opacity: 0.8, color: AI_COLORS.glow500, emissive: AI_COLORS.glow400, metalness: 0.7, roughness: 0.2 },
  { kind: "segmented", radius: 1.1, segments: 8, segmentAngle: 0.34, thickness: 0.05, speed: -0.5, tilt: 0.0, opacity: 1, color: AI_COLORS.glow400, emissive: AI_COLORS.glow200, metalness: 0.3, roughness: 0.55 },

  { kind: "arc", radius: 1.72, segments: 20, segmentAngle: 0.16, thickness: 0.03, speed: 0.28, tilt: 0.48, opacity: 0.8, color: AI_COLORS.glow600, emissive: AI_COLORS.glow400, metalness: 0.6, roughness: 0.25, wobble: 0.6 },
  { kind: "arc", radius: 2.0, segments: 14, segmentAngle: 0.2, thickness: 0.028, speed: -0.34, tilt: -0.3, opacity: 0.75, color: AI_COLORS.glow500, emissive: AI_COLORS.glow300, metalness: 0.25, roughness: 0.6 },
  { kind: "arc", radius: 2.4, segments: 24, segmentAngle: 0.1, thickness: 0.022, speed: 0.18, tilt: 0.65, opacity: 0.7, color: AI_COLORS.glow700, emissive: AI_COLORS.glow200, metalness: 0.5, roughness: 0.35 },
  { kind: "arc", radius: 2.9, segments: 16, segmentAngle: 0.14, thickness: 0.03, speed: -0.15, tilt: -0.1, opacity: 0.65, color: AI_COLORS.glow600, emissive: AI_COLORS.glow400, metalness: 0.8, roughness: 0.1 },
  { kind: "arc", radius: 1.45, segments: 12, segmentAngle: 0.22, thickness: 0.026, speed: 0.5, tilt: -0.5, opacity: 0.85, color: AI_COLORS.glow400, emissive: AI_COLORS.glow300, metalness: 0.2, roughness: 0.65 },

  // Extra segmented/arc rings so the segmented-ring count alone clears the
  // "20-30 segmented rotating rings" requirement, each still on its own
  // distinct radius/speed/tilt/opacity/material combination.
  { kind: "segmented", radius: 1.22, segments: 20, segmentAngle: 0.08, thickness: 0.022, speed: -0.28, tilt: 0.45, opacity: 0.8, color: AI_COLORS.glow500, emissive: AI_COLORS.glow300, metalness: 0.65, roughness: 0.22, wobble: 0.42 },
  { kind: "segmented", radius: 1.68, segments: 26, segmentAngle: 0.07, thickness: 0.02, speed: 0.19, tilt: -0.55, opacity: 0.7, color: AI_COLORS.glow700, emissive: AI_COLORS.glow200, metalness: 0.15, roughness: 0.7 },
  { kind: "segmented", radius: 2.15, segments: 12, segmentAngle: 0.25, thickness: 0.036, speed: -0.31, tilt: 0.28, opacity: 0.9, color: AI_COLORS.glow400, emissive: AI_COLORS.glow400, metalness: 0.75, roughness: 0.14 },
  { kind: "arc", radius: 2.5, segments: 18, segmentAngle: 0.12, thickness: 0.024, speed: 0.23, tilt: -0.08, opacity: 0.75, color: AI_COLORS.glow600, emissive: AI_COLORS.glow300, metalness: 0.35, roughness: 0.45 },
  { kind: "arc", radius: 2.95, segments: 10, segmentAngle: 0.18, thickness: 0.03, speed: -0.17, tilt: 0.6, opacity: 0.6, color: AI_COLORS.glow500, emissive: AI_COLORS.glow200, metalness: 0.55, roughness: 0.3 },
  { kind: "segmented", radius: 3.15, segments: 40, segmentAngle: 0.035, thickness: 0.015, speed: 0.07, tilt: -0.42, opacity: 0.55, color: AI_COLORS.glow700, emissive: AI_COLORS.glow300, metalness: 0.2, roughness: 0.6 },
  { kind: "arc", radius: 1.05, segments: 8, segmentAngle: 0.3, thickness: 0.04, speed: 0.62, tilt: 0.35, opacity: 0.9, color: AI_COLORS.glow300, emissive: AI_COLORS.glow200, metalness: 0.3, roughness: 0.5, wobble: 0.75 },
];

function SegmentedOrArcRing({ spec, index }: { spec: SegmentedSpec; index: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { segments, segmentAngle, thickness, speed, tilt, opacity, color, emissive, metalness, roughness, arcDeg, wobble } = spec;
  const radius = spec.radius * RING_SCALE;
  const sweep = arcDeg ? (arcDeg * Math.PI) / 180 : Math.PI * 2;
  const startPhase = useMemo(() => ringPhase(index), [index]);

  // Each chip is a thin box, not a cylinder: a box's local Y axis rotated by
  // `a` around Z lands exactly on the tangent direction at that point on the
  // circle, so a single rotation.z = a aligns it correctly.
  const items = useMemo(
    () =>
      Array.from({ length: segments }).map((_, i) => {
        const a = segments > 1 ? (i / (segments - (arcDeg ? 1 : 0))) * sweep : 0;
        return { x: Math.cos(a) * radius, y: Math.sin(a) * radius, rot: a };
      }),
    [segments, radius, sweep, arcDeg]
  );

  const chipLength = segmentAngle * radius;
  const finalOpacity = opacity * radialFalloff(radius);

  useFrame((state, delta) => {
    if (groupRef.current) groupRef.current.rotation.z += wobbleSpeed(speed, wobble, startPhase, state.clock.elapsedTime) * delta;
  });

  return (
    <group ref={groupRef} rotation={[tilt, 0, startPhase]}>
      {items.map((item, i) => (
        <mesh key={i} position={[item.x, item.y, 0]} rotation={[0, 0, item.rot]}>
          <boxGeometry args={[thickness, chipLength, thickness]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.1} metalness={metalness} roughness={roughness} transparent opacity={finalOpacity} />
        </mesh>
      ))}
    </group>
  );
}

interface ThinSpec {
  radius: number;
  speed: number;
  tilt: number;
  opacity: number;
  thickness: number;
  color: string;
  wobble?: number;
}

const THIN_SPECS: ThinSpec[] = [
  { radius: 1.5, speed: 0.22, tilt: 0.3, opacity: 0.35, thickness: 0.006, color: AI_COLORS.glow300 },
  { radius: 1.95, speed: -0.18, tilt: -0.45, opacity: 0.3, thickness: 0.005, color: AI_COLORS.glow400, wobble: 0.3 },
  { radius: 2.2, speed: 0.14, tilt: 0.55, opacity: 0.28, thickness: 0.005, color: AI_COLORS.glow200 },
  { radius: 2.65, speed: -0.1, tilt: -0.15, opacity: 0.25, thickness: 0.004, color: AI_COLORS.glow500 },
  { radius: 3.05, speed: 0.08, tilt: 0.2, opacity: 0.22, thickness: 0.004, color: AI_COLORS.glow300 },
  // Extra-wide, extra-soft -- no real gaussian blur, but a wide low-opacity
  // tube reads as "softly blurred" next to the crisp thin rings above.
  { radius: 1.9, speed: -0.05, tilt: 0.7, opacity: 0.14, thickness: 0.045, color: AI_COLORS.glow500, wobble: 0.22 },
  { radius: 2.45, speed: 0.04, tilt: -0.7, opacity: 0.12, thickness: 0.05, color: AI_COLORS.glow400 },
];

function ThinRing({ spec, index }: { spec: ThinSpec; index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const radius = spec.radius * RING_SCALE;
  const startPhase = useMemo(() => ringPhase(index + 7), [index]);
  const finalOpacity = spec.opacity * radialFalloff(radius);
  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.z += wobbleSpeed(spec.speed, spec.wobble, startPhase, state.clock.elapsedTime) * delta;
  });
  return (
    <mesh ref={ref} rotation={[spec.tilt, 0, startPhase]}>
      <torusGeometry args={[radius, spec.thickness, 6, 72]} />
      <meshBasicMaterial color={spec.color} transparent opacity={finalOpacity} depthWrite={false} />
    </mesh>
  );
}

interface TickSpec {
  radius: number;
  count: number;
  speed: number;
  tilt: number;
  opacity: number;
  tickLength: number;
  color: string;
}

const TICK_SPECS: TickSpec[] = [
  { radius: 2.45, count: 48, speed: 0.09, tilt: 0.4, opacity: 0.5, tickLength: 0.06, color: AI_COLORS.glow300 },
  { radius: 2.85, count: 32, speed: -0.07, tilt: -0.25, opacity: 0.4, tickLength: 0.08, color: AI_COLORS.glow400 },
];

function TickRing({ spec, index }: { spec: TickSpec; index: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { count, speed, tilt, opacity, tickLength, color } = spec;
  const radius = spec.radius * RING_SCALE;
  const startPhase = useMemo(() => ringPhase(index + 14), [index]);
  const finalOpacity = opacity * radialFalloff(radius);

  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return { x: Math.cos(a) * radius, y: Math.sin(a) * radius, rot: a };
      }),
    [count, radius]
  );

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.z += speed * delta;
  });

  return (
    <group ref={groupRef} rotation={[tilt, 0, startPhase]}>
      {items.map((item, i) => (
        <mesh key={i} position={[item.x, item.y, 0]} rotation={[0, 0, item.rot]}>
          <boxGeometry args={[0.006, tickLength, 0.006]} />
          <meshBasicMaterial color={color} transparent opacity={finalOpacity} />
        </mesh>
      ))}
    </group>
  );
}

interface PulseSpec {
  radius: number;
  tilt: number;
  speed: number;
  period: number;
  phase: number;
  color: string;
}

const PULSE_SPECS: PulseSpec[] = [
  { radius: 1.4, tilt: 0.2, speed: 0.1, period: 3.4, phase: 0, color: AI_COLORS.glow400 },
  { radius: 2.1, tilt: -0.35, speed: -0.06, period: 5.1, phase: 0.4, color: AI_COLORS.glow300 },
  { radius: 2.6, tilt: 0.5, speed: 0.05, period: 4.3, phase: 0.75, color: AI_COLORS.glow500 },
  { radius: 1.78, tilt: -0.6, speed: -0.08, period: 6.2, phase: 0.2, color: AI_COLORS.glow200 },
];

function PulseRing({ spec }: { spec: PulseSpec }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const radius = spec.radius * RING_SCALE;
  const baseOpacity = 0.35 * radialFalloff(radius);
  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.z += spec.speed * delta;
    const t = state.clock.elapsedTime / spec.period + spec.phase;
    const breathe = 1 + Math.sin(t * Math.PI * 2) * 0.06;
    if (ref.current) ref.current.scale.setScalar(breathe);
    if (matRef.current) matRef.current.opacity = baseOpacity + Math.sin(t * Math.PI * 2) * baseOpacity * 0.4;
  });
  return (
    <mesh ref={ref} rotation={[spec.tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.01, 6, 64]} />
      <meshBasicMaterial ref={matRef} color={spec.color} transparent opacity={baseOpacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

interface MarkerSpec {
  radius: number;
  tilt: number;
  speed: number;
  color: string;
}

const MARKER_SPECS: MarkerSpec[] = [
  { radius: 1.28, tilt: -0.3, speed: 0.9, color: AI_COLORS.glow200 },
  { radius: 2.15, tilt: 0.15, speed: -0.7, color: AI_COLORS.glow300 },
  { radius: 2.6, tilt: 0.4, speed: 0.55, color: AI_COLORS.glow400 },
];

function ScanMarker({ spec }: { spec: MarkerSpec }) {
  const ref = useRef<THREE.Mesh>(null);
  const radius = spec.radius * RING_SCALE;
  const opacity = 0.85 * radialFalloff(radius);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += spec.speed * delta;
  });
  return (
    <group rotation={[spec.tilt, 0, 0]}>
      <mesh ref={ref} position={[radius, 0, 0]}>
        <boxGeometry args={[0.02, 0.18, 0.02]} />
        <meshBasicMaterial color={spec.color} transparent opacity={opacity} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export function OrbitRings() {
  return (
    <group>
      {SEGMENTED_SPECS.map((spec, i) => (
        <SegmentedOrArcRing key={i} spec={spec} index={i} />
      ))}
      {THIN_SPECS.map((spec, i) => (
        <ThinRing key={i} spec={spec} index={i} />
      ))}
      {TICK_SPECS.map((spec, i) => (
        <TickRing key={i} spec={spec} index={i} />
      ))}
      {PULSE_SPECS.map((spec, i) => (
        <PulseRing key={i} spec={spec} />
      ))}
      {MARKER_SPECS.map((spec, i) => (
        <ScanMarker key={i} spec={spec} />
      ))}
      <Sparkles count={90} scale={[5.4, 5.4, 1.9]} size={2.0} speed={0.28} color={AI_COLORS.glow400} opacity={0.45} noise={0.4} />
      <Sparkles count={50} scale={[2.9, 2.9, 2.9]} size={1.2} speed={0.5} color={AI_COLORS.glow200} opacity={0.38} noise={0.6} />
    </group>
  );
}
