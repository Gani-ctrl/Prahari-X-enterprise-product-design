import { useRef } from "react";
import { extend, useFrame, type ThreeElements } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { AI_COLORS } from "../aiIntroConfig";

// ----------------------------------------------------------------------------
// The single volumetric energy beam connecting the projection platform up
// into the floating globe -- three concentric additive cylinders of
// increasing radius and decreasing opacity, stacked so the falloff from
// bright column to soft haze reads as volumetric light without the cost of
// a raymarched shader. Spans a fixed vertical range (bottomY..topY) so it
// visibly bridges the platform disc and the globe rather than floating
// disconnected from either. Not part of any pointer-reactive group: like
// the platform, this stays perfectly still and centered on the vertical
// axis at all times.
//
// Final polish-pass notes: the previous version used a plain
// meshBasicMaterial with a uniform opacity across the whole cylinder,
// which is exactly what read as "too cylindrical" -- a flat-toned tube
// with a hard top/bottom edge. This custom BeamGlowMaterial (same
// shaderMaterial + extend + ThreeElements-augmentation technique already
// used for TacticalGlobe's Fresnel rim) instead fades each layer's alpha
// to zero at both the bottom (blending into the platform) and the top
// (blending into the globe) via vUv.y, and adds a slow vertically-moving
// sine stripe so the column visibly has energy flowing upward through it
// rather than just glowing statically. The geometry/architecture (3
// stacked additive cylinders of increasing radius + decreasing base
// opacity, tapering from wide at the platform to narrow at the globe) is
// unchanged -- only the material feeding each cylinder changed.
// ----------------------------------------------------------------------------

const BeamGlowMaterial = shaderMaterial(
  { uColor: new THREE.Color(AI_COLORS.glow300), uOpacity: 0.3, uTime: 0, uFlowSpeed: 1.4 },
  /* vertex */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uTime;
    uniform float uFlowSpeed;
    varying vec2 vUv;
    void main() {
      float edgeFade = smoothstep(0.0, 0.16, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
      float flow = 0.55 + 0.45 * sin(vUv.y * 16.0 - uTime * uFlowSpeed);
      float alpha = uOpacity * edgeFade * flow;
      gl_FragColor = vec4(uColor, alpha);
    }
  `
);
extend({ BeamGlowMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    beamGlowMaterial: ThreeElements["shaderMaterial"] & {
      uColor?: THREE.ColorRepresentation;
      uOpacity?: number;
      uTime?: number;
      uFlowSpeed?: number;
    };
  }
}

function BeamLayer({
  radius,
  opacity,
  bottomY,
  topY,
  pulseSpeedA,
  pulseSpeedB,
  flowSpeed,
}: {
  radius: number;
  opacity: number;
  bottomY: number;
  topY: number;
  pulseSpeedA: number;
  pulseSpeedB: number;
  flowSpeed: number;
}) {
  const matRef = useRef<InstanceType<typeof BeamGlowMaterial>>(null);
  const height = topY - bottomY;
  const centerY = (topY + bottomY) / 2;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const wave = Math.sin(t * pulseSpeedA) * 0.6 + Math.sin(t * pulseSpeedB + 1.2) * 0.4;
    if (matRef.current) {
      matRef.current.uOpacity = opacity + wave * opacity * 0.22;
      matRef.current.uTime = t;
    }
  });
  return (
    <mesh position={[0, centerY, 0]}>
      <cylinderGeometry args={[radius * 0.28, radius, height, 40, 1, true]} />
      <beamGlowMaterial
        ref={matRef}
        uColor={AI_COLORS.glow300}
        uOpacity={opacity}
        uFlowSpeed={flowSpeed}
        transparent
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

// Polish pass: matches HolographicPlatform's lower PLATFORM_Y (-2.6) and
// extends a little further so the beam feels longer and more elegant
// between the platform and the globe, per spec.
export function VolumetricBeam({ bottomY = -2.6, topY = 1.7 }: VolumetricBeamProps) {
  return (
    <group>
      <BeamLayer radius={0.14} opacity={0.34} bottomY={bottomY} topY={topY} pulseSpeedA={1.3} pulseSpeedB={0.7} flowSpeed={1.8} />
      <BeamLayer radius={0.34} opacity={0.16} bottomY={bottomY} topY={topY} pulseSpeedA={0.9} pulseSpeedB={0.5} flowSpeed={1.2} />
      <BeamLayer radius={0.62} opacity={0.07} bottomY={bottomY} topY={topY} pulseSpeedA={0.6} pulseSpeedB={0.35} flowSpeed={0.8} />
    </group>
  );
}
