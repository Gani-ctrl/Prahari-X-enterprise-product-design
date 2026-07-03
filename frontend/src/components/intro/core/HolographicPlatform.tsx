import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AI_COLORS } from "../aiIntroConfig";

// ----------------------------------------------------------------------------
// The AI Core's projection platform: a glowing ground disc beneath the
// globe, four concentric rotating energy rings, two phase-offset ripple
// waves, and small bright "energy flowing" dashes traveling around two of
// the rings — so the platform doesn't just sit there, it visibly powers
// the reactor above it. The connecting light column itself now lives in
// VolumetricBeam.tsx (shared, single beam spanning platform -> globe), so
// this file only owns the platform's own disc/rings/ripples. Lives inside
// the same R3F Canvas as the rest of the reactor, but is NOT part of any
// pointer-reactive group — the platform stays put as a fixed "floor".
// ----------------------------------------------------------------------------

const PLATFORM_Y = -1.85;

function GroundDisc() {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (matRef.current) matRef.current.opacity = 0.16 + Math.sin(t * 1.2) * 0.04;
  });
  return (
    <mesh position={[0, PLATFORM_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[2.4, 64]} />
      <meshBasicMaterial ref={matRef} color={AI_COLORS.glow400} transparent opacity={0.18} depthWrite={false} />
    </mesh>
  );
}

function RotatingRing({ radius, thickness, speed, opacity }: { radius: number; thickness: number; speed: number; opacity: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += speed * delta;
  });
  return (
    <mesh ref={ref} position={[0, PLATFORM_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, thickness, 8, 80]} />
      <meshStandardMaterial color={AI_COLORS.glow500} emissive={AI_COLORS.glow400} emissiveIntensity={1.2} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function EnergyFlowDashes({ radius, count, speed }: { radius: number; count: number; speed: number }) {
  // A handful of bright chips traveling around the platform ring noticeably
  // faster than the ring's own base rotation — reads as "energy flowing
  // around" the ring rather than the ring simply spinning.
  const groupRef = useRef<THREE.Group>(null);
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return { x: Math.cos(a) * radius, z: Math.sin(a) * radius, rot: a };
      }),
    [count, radius]
  );
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += speed * delta;
  });
  return (
    <group ref={groupRef} position={[0, PLATFORM_Y, 0]}>
      {items.map((item, i) => (
        <mesh key={i} position={[item.x, 0, item.z]} rotation={[0, -item.rot, 0]}>
          <boxGeometry args={[0.09, 0.012, 0.012]} />
          <meshBasicMaterial color={AI_COLORS.glow200} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function RippleWave({ phase = 0 }: { phase?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    const t = (state.clock.elapsedTime * 0.55 + phase) % 1;
    const s = 0.5 + t * 2.2;
    if (ref.current) ref.current.scale.setScalar(s);
    if (matRef.current) matRef.current.opacity = Math.max(0, 0.5 - t * 0.5);
  });
  return (
    <mesh ref={ref} position={[0, PLATFORM_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.75, 0.82, 64]} />
      <meshBasicMaterial ref={matRef} color={AI_COLORS.glow300} transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function HolographicPlatform() {
  return (
    <group>
      <GroundDisc />
      <RotatingRing radius={2.15} thickness={0.01} speed={0.16} opacity={0.45} />
      <RotatingRing radius={1.85} thickness={0.014} speed={-0.22} opacity={0.4} />
      <RotatingRing radius={1.5} thickness={0.018} speed={0.28} opacity={0.5} />
      <RotatingRing radius={1.15} thickness={0.014} speed={-0.34} opacity={0.55} />
      <EnergyFlowDashes radius={1.5} count={4} speed={0.9} />
      <EnergyFlowDashes radius={1.85} count={3} speed={-0.65} />
      {/* Two ripples offset in phase so a new ring is always mid-expansion —
          avoids a visible "reset pop" from a single ripple looping alone. */}
      <RippleWave phase={0} />
      <RippleWave phase={0.5} />
    </group>
  );
}
