import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AI_COLORS, CORE_WORDMARK } from "../aiIntroConfig";
import { HolographicPlatform } from "./HolographicPlatform";
import { VolumetricBeam } from "./VolumetricBeam";
import { TacticalGlobe } from "./TacticalGlobe";
import { OrbitRings } from "./OrbitRings";

// ----------------------------------------------------------------------------
// The hero element: a Tactical AI Reactor — entirely a React Three Fiber
// scene, with NO DOM/CSS layer of any kind around it, and NO postprocessing
// EffectComposer either: the EffectComposer/Bloom/Vignette/Noise stack this
// used to run through composites to an intermediate render target whose
// alpha channel doesn't reliably survive the pass chain, which is what was
// actually painting a solid rectangle behind the reactor (not the DOM
// overlay removed in an earlier pass, and not the Canvas's own clear color
// — `gl.setClearColor(..., 0)` below is correct and was always being
// undone downstream by the composer). Removing EffectComposer entirely and
// rendering straight to the Canvas's own transparent framebuffer is the
// only way to *guarantee* a transparent background here. Glow is carried
// entirely by emissive materials, additive blending, and the custom
// Fresnel shader already used throughout TacticalGlobe/OrbitRings/
// HolographicPlatform/VolumetricBeam — no screen-space bloom pass needed.
//
// This component's own root div is `h-full w-full` — it has no opinion on
// its own size. CoreStage.tsx is what makes that resolve to the FULL
// viewport now (`absolute inset-0`, no width/height cap), not a small
// `min(56vw, 56vh, 640px)` box like before. That box was the other real
// source of "a visible square": a <canvas> element clips its own drawing
// to its own box no matter how transparent the background is, so any ring
// sized to extend past that box's edge was being hard-cut there. With a
// fullscreen canvas, the camera below is framed with extra headroom
// (fov 40 / distance 9.5) so the whole ring system — including the
// outermost rings, which intentionally reach out much further than the
// globe itself — sits comfortably inside the frustum with room to spare,
// rather than right up against a visible edge of any kind.
//
// Layer stack, bottom to top:
//   1. HolographicPlatform — ground disc + 4 concentric rings + energy-flow
//      dashes + 2 ripple waves. Fixed in place, never rotates as a whole.
//   2. VolumetricBeam — 3-layer additive column connecting the platform to
//      the globe. Also fixed in place.
//   3. TacticalGlobe — the procedural dark-glass globe (lat/long grid, hex
//      cell bands, geodesic shell, network nodes, data streams, a
//      GSAP-eased scan pulse, and a custom-GLSL Fresnel rim). This is the
//      ONLY layer with any cursor reactivity, and it's a small local tilt
//      that never changes the globe's position — see TacticalGlobe.tsx.
//   4. OrbitRings — ~28 independently-animated segmented rings, arcs, thin
//      circles, tick bezels, pulse rings, scan markers, and two particle
//      fields, all purely autonomous (time-based, zero pointer input).
//
// Nothing in this file (or any of its children) applies a pointer-driven
// transform to a parent group that contains the whole assembly — that's
// deliberate: a rig-level pointer-rotation is exactly what would read as
// "the core drifting off center." Every ring here only ever rotates around
// its own local origin at its own fixed, autonomous speed, and the globe's
// small cursor tilt never moves its position, so the reactor is
// mathematically centered on the canvas at all times regardless of mouse
// position. Centering the reactor above the title is otherwise a layout
// concern owned by CinematicIntro.tsx/CoreStage.tsx, not this file — see
// CinematicIntro.tsx for why the AI Core is deliberately rendered outside
// the page's whole-HUD cursor-tilt wrapper.
// ----------------------------------------------------------------------------

export function AICore() {
  return (
    <div className="h-full w-full">
      <Canvas
        dpr={[1, 1.8]}
        camera={{ fov: 40, position: [0, 0, 9.5] }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#000000", 0);
        }}
      >
        <fog attach="fog" args={[AI_COLORS.base, 6, 16]} />
        <ambientLight intensity={0.4} color={AI_COLORS.glow700} />
        <pointLight position={[0, 0, 4]} intensity={6} color={AI_COLORS.glow400} distance={12} decay={2} />
        <pointLight position={[-3, 2, 3]} intensity={1.5} color={AI_COLORS.glow300} distance={10} decay={2} />

        <Suspense fallback={null}>
          <HolographicPlatform />
          <VolumetricBeam />
          <TacticalGlobe />
          <OrbitRings />
        </Suspense>
      </Canvas>
    </div>
  );
}

export const CORE_WORDMARK_TEXT = CORE_WORDMARK;
