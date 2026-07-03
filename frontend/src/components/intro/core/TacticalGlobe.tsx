import { useEffect, useMemo, useRef } from "react";
import { extend, useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import { shaderMaterial, Sparkles } from "@react-three/drei";
import { gsap } from "gsap";
import * as THREE from "three";
import { AI_COLORS } from "../aiIntroConfig";

// ----------------------------------------------------------------------------
// The reactor's centerpiece: a procedural "tactical globe" -- NOT a solid
// glowing ball and NOT a realistic Earth texture. A dark glass sphere core,
// wrapped in a latitude/longitude wireframe grid, a hexagonal cell mesh, a
// low-opacity geodesic ("triangular topology") shell, pulsing network
// nodes joined by animated data-link lines, data points traveling along
// meridian lines, an internal particle field, a vertically-sweeping scan
// pulse (driven by GSAP, not a raw sine, for genuinely eased, never-
// snapping motion), a fixed HDR-style specular glint, and two layered
// custom-GLSL Fresnel rim shaders (a broad green glow + a tight white/mint
// highlight) for the edge lighting.
//
// Final polish-pass notes (this file only changes MATERIAL TUNING and adds
// MORE of the same kinds of layers that already existed -- no architecture
// change): the glass core was darkened/thickened further toward a true
// "black crystal" read, and a specularIntensity/specularColor pair was
// added to the physical material -- without a real HDRI environment map
// (deliberately avoided; see VolumetricBeam/AICore notes on why), these
// let the built-in specular lobe catch the scene's point lights as small
// bright highlights. A single fixed SpecularHotspot glint was added on top
// as the classic "fake HDR reflection" trick. Lat/long line counts, data
// links, and data streams were all increased slightly for a richer
// interior, and the internal particle count nudges toward the top of the
// requested 60-80 range.
//
// This whole group only ever gets TWO kinds of motion: a slow constant
// self-rotation + a tiny idle float (both autonomous, time-based), and a
// small independent cursor-reactive tilt local to this component alone.
// Nothing here ever repositions the group -- it stays at the world origin
// always, which is what keeps the reactor mathematically centered even
// while this one layer visibly reacts to the pointer.
// ----------------------------------------------------------------------------

const R = 1.0;

// --- Custom GLSL Fresnel rim shader --------------------------------------
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
      {/* Final polish: darker base (closer to true black at the center),
          slightly more transmission/thickness for a denser "black crystal"
          read, plus specularIntensity/specularColor -- without a real HDRI
          environment map (avoided for network-fetch-risk reasons), these
          two properties are what let meshPhysicalMaterial's built-in
          specular lobe catch the scene's point lights as small bright
          HDR-like glints rather than flat diffuse highlights. */}
      <meshPhysicalMaterial
        color="#010b06"
        transparent
        opacity={0.9}
        roughness={0.05}
        metalness={0.18}
        clearcoat={1}
        clearcoatRoughness={0.03}
        transmission={0.34}
        thickness={0.95}
        ior={1.5}
        envMapIntensity={0.6}
        specularIntensity={1}
        specularColor={AI_COLORS.glow50}
      />
    </mesh>
  );
}

function SpecularHotspot() {
  // A small, fixed, additive-blended bright glint near one edge of the
  // globe -- the classic "fake HDR reflection" trick for glass/metal
  // materials with no real environment map: a tiny bright highlight that
  // reads as a specular reflection catching a light source. Very gently
  // pulses so it doesn't look like a static sticker.
  const ref = useRef<THREE.Mesh>(null);
  const basePos = useMemo(() => sphericalPoint(58, -35, R * 1.01), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) ref.current.scale.setScalar(0.85 + Math.sin(t * 1.7) * 0.15);
  });
  return (
    <mesh ref={ref} position={basePos}>
      <sphereGeometry args={[0.05, 12, 12]} />
      <meshBasicMaterial color={AI_COLORS.glow50} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

function FresnelRim() {
  return (
    <mesh scale={1.02}>
      <sphereGeometry args={[R, 48, 48]} />
      <fresnelGlowMaterial uColor={AI_COLORS.glow400} uPower={3.6} uIntensity={1.15} transparent depthWrite={false} side={THREE.FrontSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function FresnelHighlight() {
  return (
    <mesh scale={1.008}>
      <sphereGeometry args={[R, 48, 48]} />
      <fresnelGlowMaterial uColor={AI_COLORS.glow50} uPower={7} uIntensity={0.9} transparent depthWrite={false} side={THREE.FrontSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function InnerCoreGlow() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const s = 0.22 + Math.sin(t * 1.3) * 0.03 + Math.sin(t * 2.7 + 1) * 0.015;
    if (meshRef.current) meshRef.current.scale.setScalar(s);
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshBasicMaterial color={AI_COLORS.glow50} transparent opacity={0.9} toneMapped={false} />
    </mesh>
  );
}

function LatitudeLines() {
  const latitudes = useMemo(() => [10, 20, 40, 60, 80, 100, 120, 140, 160, 170], []);
  return (
    <group>
      {latitudes.map((polarDeg, i) => {
        const polar = (polarDeg * Math.PI) / 180;
        const y = R * Math.cos(polar);
        const ringRadius = R * Math.sin(polar);
        if (ringRadius < 0.05) return null;
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ringRadius, 0.0035, 6, 48]} />
            <meshBasicMaterial color={AI_COLORS.glow400} transparent opacity={0.4} />
          </mesh>
        );
      })}
    </group>
  );
}

function LongitudeLines() {
  const azimuths = useMemo(() => [0, 18, 36, 54, 72, 90, 108, 126, 144, 162], []);
  return (
    <group>
      {azimuths.map((azimuthDeg, i) => (
        <mesh key={i} rotation={[0, (azimuthDeg * Math.PI) / 180, 0]}>
          <torusGeometry args={[R, 0.0035, 6, 48]} />
          <meshBasicMaterial color={AI_COLORS.glow300} transparent opacity={0.3} />
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
  { polar: 35, azimuth: 160, phase: 0.6 },
  { polar: 150, azimuth: 60, phase: 0.2 },
  { polar: 80, azimuth: 30, phase: 0.85 },
  { polar: 110, azimuth: 280, phase: 0.35 },
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
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color={AI_COLORS.glow200} transparent opacity={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function DataLink({ from, to, phase }: { from: number; to: number; phase: number }) {
  // A couple of extremely thin animated lines joining two network nodes --
  // "data flowing between intelligence points" rather than a static wire.
  // Built as a real THREE.Line object (geometry + material assembled once
  // via useMemo) and mounted with <primitive>, rather than the bare
  // `<line>` JSX intrinsic -- in this project's tsconfig, the plain JSX tag
  // `<line>` resolves against the DOM/SVG JSX typings (SVGLineElement)
  // instead of R3F's three.js Line element, which fails to type-check even
  // though it renders the same underlying object either way.
  const lineRef = useRef<THREE.Line>(null);
  const line = useMemo(() => {
    const a = NETWORK_NODES[from];
    const b = NETWORK_NODES[to];
    const fromVec = sphericalPoint(a.polar, a.azimuth, R * 1.015);
    const toVec = sphericalPoint(b.polar, b.azimuth, R * 1.015);
    const geometry = new THREE.BufferGeometry().setFromPoints([fromVec, toVec]);
    const material = new THREE.LineBasicMaterial({ color: AI_COLORS.glow300, transparent: true, opacity: 0.15 });
    return new THREE.Line(geometry, material);
  }, [from, to]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const material = lineRef.current?.material as THREE.LineBasicMaterial | undefined;
    if (material) material.opacity = 0.12 + Math.max(0, Math.sin(t * 1.1 + phase * 6)) * 0.28;
  });
  return <primitive ref={lineRef} object={line} />;
}

function DataStream({ azimuthDeg, speed, phase }: { azimuthDeg: number; speed: number; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + phase;
    const polarDeg = ((t % 1) + 1) % 1 * 360;
    const pos = sphericalPoint(polarDeg, azimuthDeg, R * 1.02);
    if (ref.current) ref.current.position.copy(pos);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.032, 8, 8]} />
      <meshBasicMaterial color={AI_COLORS.glow200} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  );
}

function ScanPulse() {
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
    globeRef.current.rotation.y += 0.05 * delta;
    globeRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5 + floatPhase.current) * 0.045;

    const damp = 1 - Math.exp(-3 * delta);
    globeRef.current.rotation.x += (-pointer.y * 0.08 - globeRef.current.rotation.x) * damp;
    globeRef.current.rotation.z += (pointer.x * 0.05 - globeRef.current.rotation.z) * damp;
  });

  return (
    <group ref={globeRef}>
      <InnerCoreGlow />
      <GlassCore />
      <FresnelRim />
      <FresnelHighlight />
      <LatitudeLines />
      <LongitudeLines />
      <HexCellBand polarDeg={70} count={9} speed={0.12} />
      <HexCellBand polarDeg={110} count={9} speed={-0.16} />
      <TriangularTopologyShell />
      <NetworkNodes />
      <DataLink from={0} to={3} phase={0.1} />
      <DataLink from={2} to={7} phase={0.5} />
      <DataLink from={1} to={5} phase={0.3} />
      <DataLink from={4} to={9} phase={0.65} />
      <DataStream azimuthDeg={30} speed={0.09} phase={0.1} />
      <DataStream azimuthDeg={120} speed={-0.07} phase={0.6} />
      <DataStream azimuthDeg={210} speed={0.11} phase={0.35} />
      <DataStream azimuthDeg={300} speed={-0.085} phase={0.8} />
      <DataStream azimuthDeg={45} speed={0.06} phase={0.2} />
      <ScanPulse />
      <SpecularHotspot />
      <Sparkles count={78} scale={[R * 2.1, R * 2.1, R * 2.1]} size={1.1} speed={0.22} color={AI_COLORS.glow300} opacity={0.5} noise={0.7} />
    </group>
  );
}
