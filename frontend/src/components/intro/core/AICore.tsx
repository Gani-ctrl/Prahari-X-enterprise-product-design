import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { AI_COLORS, CORE_WORDMARK } from "../aiIntroConfig";
import { HolographicPlatform } from "./HolographicPlatform";
import { VolumetricBeam } from "./VolumetricBeam";
import { TacticalGlobe } from "./TacticalGlobe";
import { OrbitRings } from "./OrbitRings";

// Polish-pass fake "atmospheric glow" halo: a single large, soft,
// additive-blended sphere sitting behind the globe. With no EffectComposer
// in this scene (removed deliberately -- see note below), there is no
// screen-space bloom pass, so a big dim emissive sphere standing in for a
// bloom halo is the same "fake it with real geometry" technique already
// used everywhere else in this reactor (VolumetricBeam's stacked
// cylinders, the Fresnel rim shaders, etc.) rather than a new mechanism.
// Final pass: slightly larger and a touch brighter so the atmospheric
// bloom reads more clearly around the globe without becoming a visible
// hard-edged sphere of its own.
function AtmosphereHalo() {
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[3.7, 32, 32]} />
      <meshBasicMaterial
        color={AI_COLORS.glow600}
        transparent
        opacity={0.065}
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Extremely subtle floating dust/holographic-fragment atmosphere -- a
// single sparse, slow, low-opacity particle field spanning the whole
// scene depth, distinct from OrbitRings' two tighter/brighter particle
// fields and TacticalGlobe's internal one. Meant to be almost
// subliminal: it should read as "the reactor is projecting into a living
// space" rather than as a visible effect on its own.
function DustAtmosphere() {
  return <Sparkles count={36} scale={[9, 7, 4]} size={0.9} speed={0.06} color={AI_COLORS.ink0} opacity={0.18} noise={1} />;
}

// ----------------------------------------------------------------------------
// The hero element: a Tactical AI Reactor -- entirely a React Three Fiber
// scene, with NO DOM/CSS layer of any kind around it, and NO postprocessing
// EffectComposer either: the EffectComposer/Bloom/Vignette/Noise stack this
// used to run through composites to an intermediate render target whose
// alpha channel doesn't reliably survive the pass chain, which is what was
// actually painting a solid rectangle behind the reactor (not the DOM
// overlay removed in an earlier pass, and not the Canvas's own clear color
// -- `gl.setClearColor(..., 0)` below is correct and was always being
// undone downstream by the composer). Removing EffectComposer entirely and
// rendering straight to the Canvas's own transparent framebuffer is the
// only way to *guarantee* a transparent background here. Glow is carried
// entirely by emissive materials, additive blending, and the custom
// Fresnel shader already used throughout TacticalGlobe/OrbitRings/
// HolographicPlatform/VolumetricBeam -- no screen-space bloom pass needed.
//
// This component's own root div is `h-full w-full` -- it has no opinion on
// its own size. CoreStage.tsx is what makes that resolve to the FULL
// viewport now (`absolute inset-0`, no width/height cap), not a small
// `min(56vw, 56vh, 640px)` box like before. That box was the other real
// source of "a visible square": a <canvas> element clips its own drawing
// to its own box no matter how transparent the background is, so any ring
// sized to extend past that box's edge was being hard-cut there. With a
// fullscreen canvas, the camera below is framed with extra headroom
// (fov 40 / distance 9.5) so the whole ring system -- including the
// outermost rings, which intentionally reach out much further than the
// globe itself -- sits comfortably inside the frustum with room to spare,
// rather than right up against a visible edge of any kind.
//
// Layer stack, bottom to top:
//   1. HolographicPlatform -- ground disc + 4 concentric rings + energy-flow
//      dashes + 2 ripple waves. Fixed in place, never rotates as a whole.
//   2. VolumetricBeam -- 3-layer additive column connecting the platform to
//      the globe. Also fixed in place.
//   3. TacticalGlobe -- the procedural dark-glass globe (lat/long grid, hex
//      cell bands, geodesic shell, network nodes, data streams, a
//      GSAP-eased scan pulse, and a custom-GLSL Fresnel rim). This is the
//      ONLY layer with any cursor reactivity, and it's a small local tilt
//      that never changes the globe's position -- see TacticalGlobe.tsx.
//   4. OrbitRings -- ~28 independently-animated segmented rings, arcs, thin
//      circles, tick bezels, pulse rings, scan markers, and two particle
//      fields, all purely autonomous (time-based, zero pointer input).
//
// Nothing in this file (or any of its children) applies a pointer-driven
// transform to a parent group that contains the whole assembly -- that's
// deliberate: a rig-level pointer-rotation is exactly what would read as
// "the core drifting off center." Every ring here only ever rotates around
// its own local origin at its own fixed, autonomous speed, and the globe's
// small cursor tilt never moves its position, so the reactor is
// mathematically centered on the canvas at all times regardless of mouse
// position. Centering the reactor on the page is otherwise a layout
// concern owned by CinematicIntro.tsx/CoreStage.tsx, not this file -- see
// CinematicIntro.tsx for why the AI Core is deliberately rendered outside
// the page's whole-HUD cursor-tilt wrapper, and CoreStage.tsx for the
// scrollbar-immune, hack-free centering technique used there.
//
// Centering root cause, Three.js side: every layer below is mounted inside
// a single ROOT_GROUP whose position is explicitly [0, 0, 0] -- not
// "effectively zero because nothing sets it," but a literal, auditable
// identity transform, so there is exactly one place to check for any
// future accidental offset. The camera is created at [0, 0, 9.5] with no
// rotation of its own, which already points it at the world origin by
// construction (a camera with identity rotation looks down its local -Z
// axis, and with X = Y = 0 that axis passes exactly through (0,0,0)) --
// `camera.lookAt(0, 0, 0)` below makes that explicit instead of relying on
// the implicit default, so the projection center is provably, not just
// coincidentally, the world origin. With the root group at X = 0 and the
// camera's optical axis passing through that same X = 0 point, the
// reactor's horizontal screen position is pinned to the exact horizontal
// center of the canvas by construction -- and CoreStage.tsx's canvas
// wrapper is itself pinned to the exact horizontal center of the page, so
// the two compose to put the globe on the page's true center line.
// ----------------------------------------------------------------------------

export function AICore() {
  return (
    <div className="h-full w-full">
      <Canvas
        dpr={[1, 1.8]}
        camera={{ fov: 40, position: [0, 0, 9.5] }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor("#000000", 0);
          camera.lookAt(0, 0, 0);
        }}
      >
        <fog attach="fog" args={[AI_COLORS.base, 6, 16]} />
        {/* Multiple layers of illumination instead of one uniform green
            glow: a dim ambient fill, a strong front key light, a cooler
            mint rim/back light, a warm-white specular kicker so the glass
            core's clearcoat has something bright and non-green to catch,
            and a soft under-light from the platform so the beam/platform
            faintly influence the globe and nearby rings from below. */}
        <ambientLight intensity={0.35} color={AI_COLORS.glow700} />
        <pointLight position={[0, 0, 4]} intensity={6} color={AI_COLORS.glow400} distance={12} decay={2} />
        <pointLight position={[-3, 2, 3]} intensity={1.5} color={AI_COLORS.glow300} distance={10} decay={2} />
        <pointLight position={[3, 1.5, 2.5]} intensity={1.1} color={AI_COLORS.glow200} distance={10} decay={2} />
        <pointLight position={[0, -2.4, 2]} intensity={1.4} color={AI_COLORS.glow500} distance={8} decay={2} />
        <pointLight position={[0, 0.5, 6]} intensity={0.5} color={AI_COLORS.ink0} distance={9} decay={2} />
        {/* Deep-emerald fill from below/behind -- rounds out the color
            blend requested (deep black / dark emerald / forest green /
            mint / white) with a tone none of the other five lights carry. */}
        <pointLight position={[-2, -1, -3]} intensity={0.9} color={AI_COLORS.glow700} distance={9} decay={2} />

        <Suspense fallback={null}>
          {/* Explicit identity root group -- X (and Y, Z) hard-pinned to 0.
              Nothing in this tree ever sets a position on this group; it
              exists purely so "the root group's X position is 0" is a
              literal, greppable fact about the code rather than an
              emergent property of nobody having touched it yet. */}
          <group position={[0, 0, 0]}>
            <AtmosphereHalo />
            <DustAtmosphere />
            <HolographicPlatform />
            <VolumetricBeam />
            <TacticalGlobe />
            <OrbitRings />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}

export const CORE_WORDMARK_TEXT = CORE_WORDMARK;
