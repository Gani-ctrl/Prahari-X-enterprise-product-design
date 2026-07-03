import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { AI_COLORS } from "../aiIntroConfig";

// ----------------------------------------------------------------------------
// The ring system surrounding the tactical globe: ~28 independently
// animated elements — segmented chip rings, plain thin "holographic
// circles", broken arc segments, tick-mark bezels, breathing pulse rings,
// and fast scan markers — plus two particle fields of tiny orbiting data
// motes. Every entry below has its own radius, tilt, speed (sign AND
// magnitude), opacity, and animation kind, so no two rings move
// identically, per spec.
//
// Deliberately NOT a single rotating parent group: each ring only rotates
// itself, around its own local origin, driven purely by elapsed time. There
// is no pointer/cursor input anywhere in this file, so nothing here can
// ever visually displace "the core" as a whole — only the individual
// layers turn in place. (The globe, in TacticalGlobe.tsx, is the one layer
// that gets a small independent cursor tilt; everything here is
// autonomous.)
// ----------------------------------------------------------------------------

const RING_MATERIAL = {
  metalness: 0.4,
  roughness: 0.35,
};

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
  arcDeg?: number; // only for "arc": how much of the circle is populated
}

const SEGMENTED_SPECS: SegmentedSpec[] = [
  { kind: "segmented", radius: 1.35, segments: 30, segmentAngle: 0.11, thickness: 0.024, speed: 0.16, tilt: 0.12, opacity: 0.9, color: AI_COLORS.glow600, emissive: AI_COLORS.glow400 },
  { kind: "segmented", radius: 1.6, segments: 16, segmentAngle: 0.26, thickness: 0.032, speed: -0.24, tilt: -0.42, opacity: 0.85, color: AI_COLORS.glow700, emissive: AI_COLORS.glow300 },
  { kind: "segmented", radius: 1.85, segments: 44, segmentAngle: 0.045, thickness: 0.018, speed: 0.3, tilt: 0.55, opacity: 0.75, color: AI_COLORS.glow500, emissive: AI_COLORS.glow200 },
  { kind: "segmented", radius: 2.05, segments: 22, segmentAngle: 0.09, thickness: 0.026, speed: -0.36, tilt: -0.2, opacity: 0.85, color: AI_COLORS.glow600, emissive: AI_COLORS.glow400 },
  { kind: "segmented", radius: 2.3, segments: 10, segmentAngle: 0.3, thickness: 0.042, speed: 0.42, tilt: 0.34, opacity: 0.95, color: AI_COLORS.glow400, emissive: AI_COLORS.glow200 },
  { kind: "segmented", radius: 2.55, segments: 36, segmentAngle: 0.06, thickness: 0.02, speed: -0.12, tilt: -0.6, opacity: 0.7, color: AI_COLORS.glow700, emissive: AI_COLORS.glow300 },
  { kind: "segmented", radius: 2.75, segments: 18, segmentAngle: 0.13, thickness: 0.03, speed: 0.2, tilt: 0.08, opacity: 0.8, color: AI_COLORS.glow500, emissive: AI_COLORS.glow400 },
  { kind: "segmented", radius: 1.1, segments: 8, segmentAngle: 0.34, thickness: 0.05, speed: -0.5, tilt: 0.0, opacity: 1, color: AI_COLORS.glow400, emissive: AI_COLORS.glow200 },

  { kind: "arc", radius: 1.72, segments: 20, segmentAngle: 0.16, thickness: 0.03, speed: 0.28, tilt: 0.48, opacity: 0.8, color: AI_COLORS.glow600, emissive: AI_COLORS.glow400, arcDeg: 150 },
  { kind: "arc", radius: 2.0, segments: 14, segmentAngle: 0.2, thickness: 0.028, speed: -0.34, tilt: -0.3, opacity: 0.75, color: AI_COLORS.glow500, emissive: AI_COLORS.glow300, arcDeg: 210 },
  { kind: "arc", radius: 2.4, segments: 24, segmentAngle: 0.1, thickness: 0.022, speed: 0.18, tilt: 0.65, opacity: 0.7, color: AI_COLORS.glow700, emissive: AI_COLORS.glow200, arcDeg: 100 },
  { kind: "arc", radius: 2.9, segments: 16, segmentAngle: 0.14, thickness: 0.03, speed: -0.15, tilt: -0.1, opacity: 0.65, color: AI_COLORS.glow600, emissive: AI_COLORS.glow400, arcDeg: 260 },
  { kind: "arc", radius: 1.45, segments: 12, segmentAngle: 0.22, thickness: 0.026, speed: 0.5, tilt: -0.5, opacity: 0.85, color: AI_COLORS.glow400, emissive: AI_COLORS.glow300, arcDeg: 70 },

  // Extra segmented/arc rings so the segmented-ring count alone clears the
  // "20-30 segmented rotating rings" requirement, each still on its own
  // distinct radius/speed/tilt/opacity combination.
  { kind: "segmented", radius: 1.22, segments: 20, segmentAngle: 0.08, thickness: 0.022, speed: -0.28, tilt: 0.45, opacity: 0.8, color: AI_COLORS.glow500, emissive: AI_COLORS.glow300 },
  { kind: "segmented", radius: 1.68, segments: 26, segmentAngle: 0.07, thickness: 0.02, speed: 0.19, tilt: -0.55, opacity: 0.7, color: AI_COLORS.glow700, emissive: AI_COLORS.glow200 },
  { kind: "segmented", radius: 2.15, segments: 12, segmentAngle: 0.25, thickness: 0.036, speed: -0.31, tilt: 0.28, opacity: 0.9, color: AI_COLORS.glow400, emissive: AI_COLORS.glow400 },
  { kind: "arc", radius: 2.5, segments: 18, segmentAngle: 0.12, thickness: 0.024, speed: 0.23, tilt: -0.08, opacity: 0.75, color: AI_COLORS.glow600, emissive: AI_COLORS.glow300, arcDeg: 190 },
  { kind: "arc", radius: 2.95, segments: 10, segmentAngle: 0.18, thickness: 0.03, speed: -0.17, tilt: 0.6, opacity: 0.6, color: AI_COLORS.glow500, emissive: AI_COLORS.glow200, arcDeg: 130 },
  { kind: "segmented", radius: 3.15, segments: 40, segmentAngle: 0.035, thickness: 0.015, speed: 0.07, tilt: -0.42, opacity: 0.55, color: AI_COLORS.glow700, emissive: AI_COLORS.glow300 },
  { kind: "arc", radius: 1.05, segments: 8, segmentAngle: 0.3, thickness: 0.04, speed: 0.62, tilt: 0.35, opacity: 0.9, color: AI_COLORS.glow300, emissive: AI_COLORS.glow200, arcDeg: 300 },
];

function SegmentedOrArcRing({ spec }: { spec: SegmentedSpec }) {
  const groupRef = useRef<THREE.Group>(null);
  const { radius, segments, segmentAngle, thickness, speed, tilt, opacity, color, emissive, arcDeg } = spec;
  const sweep = arcDeg ? (arcDeg * Math.PI) / 180 : Math.PI * 2;

  const items = useMemo(
    () =>
      Array.from({ length: segments }).map((_, i) => {
        const a = segments > 1 ? (i / (segments - (arcDeg ? 1 : 0))) * sweep : 0;
        return { x: Math.cos(a) * radius, y: Math.sin(a) * radius, rot: a };
      }),
    [segments, radius, sweep, arcDeg]
  );

  const chipLength = segmentAngle * radius;

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.z += speed * delta;
  });

  return (
    <group ref={groupRef} rotation={[tilt, 0, 0]}>
      {items.map((item, i) => (
        <mesh key={i} position={[item.x, item.y, 0]} rotation={[0, 0, item.rot]}>
          <boxGeometry args={[thickness, chipLength, thickness]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.1} {...RING_MATERIAL} transparent opacity={opacity} />
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
}

const THIN_SPECS: ThinSpec[] = [
  { radius: 1.5, speed: 0.22, tilt: 0.3, opacity: 0.35, thickness: 0.006, color: AI_COLORS.glow300 },
  { radius: 1.95, speed: -0.18, tilt: -0.45, opacity: 0.3, thickness: 0.005, color: AI_COLORS.glow400 },
  { radius: 2.2, speed: 0.14, tilt: 0.55, opacity: 0.28, thickness: 0.005, color: AI_COLORS.glow200 },
  { radius: 2.65, speed: -0.1, tilt: -0.15, opacity: 0.25, thickness: 0.004, color: AI_COLORS.glow500 },
  { radius: 3.05, speed: 0.08, tilt: 0.2, opacity: 0.22, thickness: 0.004, color: AI_COLORS.glow300 },
];

function ThinRing({ spec }: { spec: ThinSpec }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += spec.speed * delta;
  });
  return (
    <mesh ref={ref} rotation={[spec.tilt, 0, 0]}>
      <torusGeometry args={[spec.radius, spec.thickness, 6, 72]} />
      <meshBasicMaterial color={spec.color} transparent opacity={spec.opacity} depthWrite={false} />
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

function TickRing({ spec }: { spec: TickSpec }) {
  const groupRef = useRef<THREE.Group>(null);
  const { radius, count, speed, tilt, opacity, tickLength, color } = spec;

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
    <group ref={groupRef} rotation={[tilt, 0, 0]}>
      {items.map((item, i) => (
        <mesh key={i} position={[item.x, item.y, 0]} rotation={[0, 0, item.rot]}>
          <boxGeometry args={[0.006, tickLength, 0.006]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
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
];

function PulseRing({ spec }: { spec: PulseSpec }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.z += spec.speed * delta;
    const t = state.clock.elapsedTime / spec.period + spec.phase;
    const breathe = 1 + Math.sin(t * Math.PI * 2) * 0.06;
    if (ref.current) ref.current.scale.setScalar(breathe);
    if (matRef.current) matRef.current.opacity = 0.3 + Math.sin(t * Math.PI * 2) * 0.15;
  });
  return (
    <mesh ref={ref} rotation={[spec.tilt, 0, 0]}>
      <torusGeometry args={[spec.radius, 0.01, 6, 64]} />
      <meshBasicMaterial ref={matRef} color={spec.color} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
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
];

function ScanMarker({ spec }: { spec: MarkerSpec }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += spec.speed * delta;
  });
  return (
    <group rotation={[spec.tilt, 0, 0]}>
      <mesh ref={ref} position={[spec.radius, 0, 0]}>
        <boxGeometry args={[0.02, 0.18, 0.02]} />
        <meshBasicMaterial color={spec.color} transparent opacity={0.85} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export function OrbitRings() {
  return (
    <group>
      {SEGMENTED_SPECS.map((spec, i) => (
        <SegmentedOrArcRing key={i} spec={spec} />
      ))}
      {THIN_SPECS.map((spec, i) => (
        <ThinRing key={i} spec={spec} />
      ))}
      {TICK_SPECS.map((spec, i) => (
        <TickRing key={i} spec={spec} />
      ))}
      {PULSE_SPECS.map((spec, i) => (
        <PulseRing key={i} spec={spec} />
      ))}
      {MARKER_SPECS.map((spec, i) => (
        <ScanMarker key={i} spec={spec} />
      ))}
      <Sparkles count={90} scale={[7.5, 7.5, 2.5]} size={2.2} speed={0.28} color={AI_COLORS.glow400} opacity={0.5} noise={0.4} />
      <Sparkles count={50} scale={[4, 4, 4]} size={1.3} speed={0.5} color={AI_COLORS.glow200} opacity={0.4} noise={0.6} />
    </group>
  );
}
