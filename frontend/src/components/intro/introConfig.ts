// ----------------------------------------------------------------------------
// PRAHARI X — Cinematic Intro: shared config.
//
// Every color here mirrors a token in styles/globals.css exactly (same hex),
// so the intro reads as the same product as the rest of the app rather than
// a bolted-on demo with its own palette.
//
// This is the lightweight DOM/CSS + GSAP + Motion version of the intro —
// there is no WebGL/Three.js/React Three Fiber anywhere in this subsystem.
// Everything visual here is a styled <div>/<svg>, animated with GSAP
// timelines and Motion, chosen specifically for build stability and
// predictable performance over a full 3D scene.
// ----------------------------------------------------------------------------

export const INTRO_COLORS = {
  base: "#05070a",
  sentinel50: "#eef6f1",
  sentinel200: "#b7dbc4",
  sentinel400: "#5cb98c",
  sentinel500: "#39a06e",
  sentinel600: "#2c7d57",
  sentinel700: "#205c40",
  amber400: "#ffbf47",
  amber500: "#ffb020",
  danger400: "#ff7a92",
  danger500: "#ff5470",
  steel400: "#7c8aa3",
  ink0: "#f4f6fb",
  ink3: "#6b7488",
} as const;

/** Named phases of the intro, in strict order. Deliberately short: the
 * whole auto-advancing sequence (void → title) totals ~6s, matching the
 * "5-7 second boot sequence" requirement. "ready" and "dissolving" are
 * user-driven (scroll), not timer-driven. */
export type IntroPhase =
  | "void" // 0. pure black, ambient audio only
  | "boot" // 1. scanlines, tactical grid, telemetry text, hex/coordinate readouts, radar sweep
  | "reveal" // 2. smoke parts, atmosphere settles just before the title
  | "title" // 3. PRAHARI X materializes through smoke + light rays
  | "ready" // 4. HUD indicators + "Scroll to Enter" active, fully interactive
  | "dissolving"; // 5. user is scrolling — everything dissolves into the real homepage

export const PHASE_ORDER: IntroPhase[] = ["void", "boot", "reveal", "title", "ready", "dissolving"];

/** How long each auto-advancing phase holds before moving to the next, in
 * ms. Sums to 6000ms for the full-quality path. */
export const PHASE_DURATIONS_MS: Record<Exclude<IntroPhase, "ready" | "dissolving">, number> = {
  void: 900,
  boot: 2200,
  reveal: 1100,
  title: 1800,
};

/** Reduced-motion / low-power devices skip straight past the choreography. */
export const REDUCED_MOTION_SKIP_MS = 500;

/** Effect budget — DOM node / particle counts, scaled down automatically on
 * touch/low-core devices in useDeviceTier.ts. Everything here is cheap
 * CSS-animated markup (no WebGL), so these numbers are intentionally small;
 * the visual density comes from layering and motion, not particle count. */
export const QUALITY_TIERS = {
  high: { smokeBlobs: 6, embers: 22, hexColumns: 3 },
  medium: { smokeBlobs: 4, embers: 12, hexColumns: 2 },
  low: { smokeBlobs: 2, embers: 0, hexColumns: 0 },
} as const;

export const AOI_TITLE = "PRAHARI X";
export const AOI_SUBTITLE = "MILITARY INTELLIGENCE PLATFORM";
export const AOI_TAGLINE = "// SECURE. STRATEGIZE. SURVIVE.";

/** Classified-looking telemetry lines for the boot sequence. Entirely
 * fictional — no real coordinates, frequencies, or callsigns. */
export const BOOT_LINES = [
  ">> SYSTEM INITIALIZING...",
  ">> PRAHARI OS v7.2.4",
  ">> SECURE CONNECTION... ESTABLISHED",
  ">> SATELLITE LINK... ACTIVE",
  ">> ENCRYPTION KEY... VERIFIED",
  ">> GPS COORDINATES",
  "   LAT 28.6139° N",
  "   LON 77.2090° E",
  ">> TARGET ACQUISITION... STANDBY",
  ">> RADIO FREQUENCY 145.680 MHZ",
  ">> BIOMETRIC SCAN... OK",
  ">> MISSION STATUS: CLASSIFIED",
  ">> AWAITING OPERATOR INPUT_",
];

/** Status chips shown once the intro reaches "ready" — deliberately
 * matching the exact indicator names requested: subtle, holographic-green,
 * sequential reveal rather than a dense dashboard. */
export const HUD_INDICATORS = [
  { label: "Mission Status", value: "ACTIVE" },
  { label: "Threat Level", value: "ELEVATED" },
  { label: "Secure Connection", value: "ENCRYPTED" },
  { label: "Radio Signal", value: "STRONG" },
  { label: "System Online", value: "100%" },
  { label: "Tactical Scan", value: "SCANNING" },
] as const;

/** Fictional hex/coordinate readout lines used as background set-dressing
 * during "boot"/"reveal" — pure flavor text, regenerated with random hex
 * digits at render time (see BootOverlay.tsx). */
export const HEX_PREFIXES = ["0x7F3A", "0xC91E", "0x4B02", "0x88D6", "0x1A5F", "0xE730"];
