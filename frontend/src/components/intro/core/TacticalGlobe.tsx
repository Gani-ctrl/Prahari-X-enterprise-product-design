import { useEffect, useMemo, useRef } from "react";
import { extend, useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { gsap } from "gsap";
import * as THREE from "three";
import { AI_COLORS } from "../aiIntroConfig";

// ----------------------------------------------------------------------------
// The reactor's centerpiece: a procedural "tactical globe" — NOT a solid
// glowing ball and NOT a realistic Earth texture. A dark glass sphere core,
// wrapped in a latitude/longitude wireframe grid, a hexagonal cell mesh, a
// low-opacity geodesic ("triangular topology") shell, a handful of pulsing
// network nodes, two data points traveling along meridian lines, a
// vertically-sweeping scan pulse (driven by GSAP, not a raw sine, for
// genuinely eased, never-snapping motion), and a custom-GLSL Fresnel rim
// shader for the edge glow.
//
// This whole group only ever gets TWO kinds of motion: a slow constant
// self-rotation + a tiny idle float (both autonomous, time-based), and a
// small independent cursor-reactive tilt local to this component alone.
// Nothing here ever repositions the group — it stays at the world origin
// always, which is what keeps the reactor mathematically centered even
// while this one layer visibly reacts to the pointer.
// ----------------------------------------------------------------------------

const R = 1.0;

// --- Custom GLSL Fresnel rim shader --------------------------------------
// A standard view-dependent Fresnel term (pow(1 - N.V, power)) driving an
// additive rim glow — brighter at grazing angles, near-invisible face-on,
// exactly like the edge-lit glass in the reference material.
const FresnelGlowMaterial = shaderMaterial(
  { uColor: new THREE.Color(AI_COLORS.glow300), uPower: 2.4, uIntensity: 1.3 },
  /* vertex */ `
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* fragment */ `
    uniform vec3 uColor;
    uniform float uPower;
    uniform float uIntensity;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0), uPower);
      gl_FragColor = vec4(uColor * fresnel * uIntensity, fresnel);
    }
  `
);
extend({ FresnelGlowMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    fresnelGlowMaterial: ThreeElements["shaderMaterial"] & {
      uColor?: THREE.ColorRepresentation;
      uPower?: number;
      uIntensity?: number;
    };
  }
}

function sphericalPoint(polarDeg: number, azimuthDeg: number, radius: number) {
  const polar = (polarDeg * Math.PI) / 180;
  const azimuth = (azimuthDeg * Math.PI) / 180;
  return new THREE.Vector3(radius * Math.sin(polar) * Math.cos(azimuth), radius * Math.cos(polar), radius * Math.sin(polar) * Math.sin(azimuth));
}

function GlassCore() {
  return (
    <mesh>
      <sphereGeometry args={[R, 64, 64]} />
      <meshPhysicalMaterial
        color="#04140b"
        transparent
        opacity={0.55}
        roughness={0.15}
        metalness={0.2}
        clearcoat={1}
        clearcoatRoughness={0.1}
        transmission={0.15}
        thickness={0.4}
        envMapIntensity={0.6}
      />
    </mesh>
  );
}

function FresnelRim() {
  return (
    <mesh scale={1.02}>
      <sphereGeometry args={[R, 48, 48]} />
      <fresnelGlowMaterial uColor={AI_COLORS.glow300} uPower={2.4} uIntensity={1.3} transparent depthWrite={false} side={THREE.FrontSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function LatitudeLines() {
  const latitudes = useMemo(() => [30, 55, 90, 125, 150], []);
  return (
    <group>
      {latitudes.map((polarDeg, i) => {
        const polar = (polarDeg * Math.PI) / 180;
        const y = R * Math.cos(polar);
        const ringRadius = R * Math.sin(polar);
        if (ringRadius < 0.05) return null;
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ringRadius, 0.004, 6, 48]} />
            <meshBasicMaterial color={AI_COLORS.glow400} transparent opacity={0.45} />
          </mesh>
        );
      })}
    </group>
  );
}

function LongitudeLines() {
  const azimuths = useMemo(() => [0, 30, 60, 90, 120, 150], []);
  return (
    <group>
      {azimuths.map((azimuthDeg, i) => (
        <mesh key={i} rotation={[0, (azimuthDeg * Math.PI) / 180, 0]}>
          <torusGeometry args={[R, 0.004, 6, 48]} />
          <meshBasicMaterial color={AI_COLORS.glow300} transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function HexCellBand({ polarDeg, count, speed }: { polarDeg: number; count: number; speed: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const cells = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const azimuth = (i / count) * 360;
        const pos = sphericalPoint(polarDeg, azimuth, R * 1.01);
        return { pos, lookAtTarget: pos.clone().multiplyScalar(2) };
      }),
    [polarDeg, count]
  );
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += speed * delta;
  });
  return (
    <group ref={groupRef}>
      {cells.map((cell, i) => (
        <mesh key={i} position={cell.pos} lookAt={cell.lookAtTarget}>
          <circleGeometry args={[0.08, 6]} />
          <meshBasicMaterial color={AI_COLORS.glow200} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function TriangularTopologyShell() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += 0.02 * delta;
  });
  return (
    <mesh ref={ref} scale={1.04}>
      <icosahedronGeometry args={[R, 1]} />
      <meshBasicMaterial color={AI_COLORS.glow500} wireframe transparent opacity={0.16} />
    </mesh>
  );
}

const NETWORK_NODES = [
  { polar: 40, azimuth: 20, phase: 0 },
  { polar: 70, azimuth: 100, phase: 0.3 },
  { polar: 100, azimuth: 200, phase: 0.55 },
  { polar: 60, azimuth: 260, phase: 0.15 },
  { polar: 130, azimuth: 320, phase: 0.75 },
  { polar: 90, azimuth: 340, phase: 0.45 },
];

function NetworkNodes() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    NETWORK_NODES.forEach((node, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const pulse = 0.6 + Math.sin(t * 1.8 + node.phase * 10) * 0.4;
      mesh.scale.setScalar(0.5 + pulse * 0.5);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + pulse * 0.5;
    });
  });
  return (
    <group>
      {NETWORK_NODES.map((node, i) => {
        const pos = sphericalPoint(node.polar, node.azimuth, R * 1.015);
        return (
          <mesh key={i} ref={(el) => { refs.current[i] = el; }} position={pos}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial color={AI_COLORS.glow200} transparent opacity={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function DataStream({ azimuthDeg, speed, phase }: { azimuthDeg: number; speed: number; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + phase;
    const polarDeg = ((t % 1) + 1) % 1 * 360; // sweep the full meridian, both hemispheres
    const pos = sphericalPoint(polarDeg, azimuthDeg, R * 1.02);
    if (ref.current) ref.current.position.copy(pos);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.035, 8, 8]} />
      <meshBasicMaterial color={AI_COLORS.glow200} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  );
}

function ScanPulse() {
  // GSAP-tweened progress value (sine.inOut, yoyo, infinite) rather than a
  // raw Math.sin — the eased, physically-soft accel/decel at each turnaround
  // is the whole point ("realistic easing... nothing should snap").
  const progress = useRef({ v: 0 });
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const tween = gsap.to(progress.current, { v: 1, duration: 4.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
    return () => {
      tween.kill();
    };
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.z += 0.3 * delta;
    const y = THREE.MathUtils.lerp(-R * 0.92, R * 0.92, progress.current.v);
    const ringRadius = Math.sqrt(Math.max(0, R * R - y * y));
    if (ringRef.current) {
      ringRef.current.position.y = y;
      ringRef.current.scale.setScalar(Math.max(0.02, ringRadius) / 0.9);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.012, 6, 48]} />
        <meshBasicMaterial color={AI_COLORS.glow200} transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export function TacticalGlobe() {
  const { pointer } = useThree();
  const globeRef = useRef<THREE.Group>(null);
  const floatPhase = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    if (!globeRef.current) return;
    // Autonomous slow spin + gentle idle float — never cursor-driven.
    globeRef.current.rotation.y += 0.05 * delta;
    globeRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5 + floatPhase.current) * 0.045;

    // The ONE piece of cursor reactivity on this layer: a small independent
    // tilt, damped so it never snaps, and small enough that it reads as
    // "this layer nudges toward you" rather than the globe drifting off
    // its centered position (rotation pivots through the group's own
    // origin, which never moves).
    const damp = 1 - Math.exp(-3 * delta);
    globeRef.current.rotation.x += (-pointer.y * 0.08 - globeRef.current.rotation.x) * damp;
    globeRef.current.rotation.z += (pointer.x * 0.05 - globeRef.current.rotation.z) * damp;
  });

  return (
    <group ref={globeRef}>
      <GlassCore />
      <FresnelRim />
      <LatitudeLines />
      <LongitudeLines />
      <HexCellBand polarDeg={70} count={9} speed={0.12} />
      <HexCellBand polarDeg={110} count={9} speed={-0.16} />
      <TriangularTopologyShell />
      <NetworkNodes />
      <DataStream azimuthDeg={30} speed={0.09} phase={0.1} />
      <DataStream azimuthDeg={120} speed={-0.07} phase={0.6} />
      <ScanPulse />
    </group>
  );
}
