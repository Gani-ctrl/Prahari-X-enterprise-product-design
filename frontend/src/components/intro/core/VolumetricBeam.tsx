import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AI_COLORS } from "../aiIntroConfig";

// ----------------------------------------------------------------------------
// The single volumetric energy beam connecting the projection platform up
// into the floating globe — three concentric additive cylinders of
// increasing radius and decreasing opacity, stacked so the falloff from
// bright column to soft haze reads as volumetric light without the cost of
// a raymarched shader. Spans a fixed vertical range (bottomY..topY) so it
// visibly bridges the platform disc and the globe rather than floating
// disconnected from either. Pulses on two combined sine harmonics — never
// a single mechanical beat — so it stays "elegant," per spec, not jittery.
// Not part of any pointer-reactive group: like the platform, this stays
// perfectly still and centered on the vertical axis at all times.
// ----------------------------------------------------------------------------

function BeamLayer({
  radius,
  opacity,
  bottomY,
  topY,
  pulseSpeedA,
  pulseSpeedB,
}: {
  radius: number;
  opacity: number;
  bottomY: number;
  topY: number;
  pulseSpeedA: number;
  pulseSpeedB: number;
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const height = topY - bottomY;
  const centerY = (topY + bottomY) / 2;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const wave = Math.sin(t * pulseSpeedA) * 0.6 + Math.sin(t * pulseSpeedB + 1.2) * 0.4;
    if (matRef.current) matRef.current.opacity = opacity + wave * opacity * 0.22;
  });
  return (
    <mesh position={[0, centerY, 0]}>
      <cylinderGeometry args={[radius * 0.3, radius, height, 32, 1, true]} />
      <meshBasicMaterial
        ref={matRef}
        color={AI_COLORS.glow300}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

interface VolumetricBeamProps {
  bottomY?: number;
  topY?: number;
}

export function VolumetricBeam({ bottomY = -1.85, topY = 1.3 }: VolumetricBeamProps) {
  return (
    <group>
      <BeamLayer radius={0.16} opacity={0.32} bottomY={bottomY} topY={topY} pulseSpeedA={1.3} pulseSpeedB={0.7} />
      <BeamLayer radius={0.38} opacity={0.15} bottomY={bottomY} topY={topY} pulseSpeedA={0.9} pulseSpeedB={0.5} />
      <BeamLayer radius={0.7} opacity={0.06} bottomY={bottomY} topY={topY} pulseSpeedA={0.6} pulseSpeedB={0.35} />
    </group>
  );
}
