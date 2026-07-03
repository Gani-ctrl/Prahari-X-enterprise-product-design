// ----------------------------------------------------------------------------
// PRAHARI X — Cinematic Intro: AI Intelligence Core edition.
//
// Full creative pivot: the hero element is now an abstract AI Intelligence
// Core (concentric holographic rings, scanning circles, hex structures) —
// no soldier, character, weapon, or battlefield anywhere in this subsystem.
// This file is the single source of truth for every phase duration, every
// line of on-screen copy, and every HUD data point, so the presentational
// components (BootTerminal, AICore, HUD panels, TitleReveal) stay pure and
// data-driven.
// ----------------------------------------------------------------------------

export const AI_COLORS = {
  base: "#020403",
  glow50: "#eafff2",
  glow200: "#9dfbc4",
  glow300: "#5cf5a0",
  glow400: "#2eea82",
  glow500: "#17c766",
  glow600: "#0f9a4e",
  glow700: "#0b6f39",
  amber400: "#ffbf47",
  danger400: "#ff5470",
  ink0: "#eef7f1",
  ink2: "#8fa398",
  ink3: "#5c6b62",
} as const;

/** Named phases of the intro, in strict order. Auto-advancing phases total
 * ~6.2s (void → title), matching the "approximately 6 seconds" requirement.
 * "ready" and "dissolving" remain scroll-driven, exactly like the previous
 * intro — the page-transition mechanism (scroll dissolve, Skip button,
 * Navbar hiding) is existing infrastructure this pivot does not touch. */
export type IntroPhase = "void" | "boot" | "assemble" | "hud" | "title" | "ready" | "dissolving";

export const PHASE_ORDER: IntroPhase[] = ["void", "boot", "assemble", "hud", "title", "ready", "dissolving"];

export const PHASE_DURATIONS_MS: Record<Exclude<IntroPhase, "ready" | "dissolving">, number> = {
  void: 400,
  boot: 2600,
  assemble: 1400,
  hud: 900,
  title: 900,
};

export const REDUCED_MOTION_SKIP_MS = 400;

export interface BootLine {
  text: string;
  tone?: "default" | "danger";
}

export const BOOT_LINES: BootLine[] = [
  { text: "INITIALIZING SECURE CONNECTION..." },
  { text: "ENCRYPTING DATA STREAM..." },
  { text: "LOADING TACTICAL PROTOCOLS..." },
  { text: "VERIFYING SATELLITE NETWORK..." },
  { text: "AI ENGINE INITIALIZATION..." },
  { text: "ACCESS LEVEL: COMMANDER" },
  { text: "THREAT LEVEL: ELEVATED", tone: "danger" },
  { text: "SYSTEM ONLINE" },
  { text: "PRAHARI X CORE ACTIVATED" },
];

export const BOOT_HEADER = { eyebrow: "PRAHARI X", label: "BOOT SEQUENCE" };

/** The classified intelligence widget under the boot terminal — a small,
 * subtly-animating world-node visualization, not a soldier/map hero. */
export const NODE_WIDGET = {
  id: "PX-CORE_V7.3.2",
  globalNodes: 12,
  active: 12,
};

export const ENCRYPTION_PROGRESS_LABEL = "ENCRYPTION PROGRESS";

/** Labels arranged around the AI Core, compass-style, matching the
 * reference's eight-point layout. `side` picks left/right column for
 * layout purposes; `angleDeg` (0 = up, clockwise) positions the connector
 * line's anchor point on the core's bounding circle. */
export interface CoreLabel {
  label: string;
  value: string;
  side: "left" | "right";
  angleDeg: number;
}

export const CORE_LABELS: CoreLabel[] = [
  { label: "SATELLITE", value: "LINK: STABLE", side: "left", angleDeg: 325 },
  { label: "AI NODE", value: "ONLINE", side: "right", angleDeg: 35 },
  { label: "THERMAL", value: "ONLINE", side: "left", angleDeg: 270 },
  { label: "GPS", value: "SYNCED", side: "right", angleDeg: 90 },
  { label: "RADAR", value: "ACTIVE", side: "left", angleDeg: 215 },
  { label: "DATA STREAM", value: "SECURE", side: "right", angleDeg: 145 },
  { label: "SIGNAL", value: "LOCKED", side: "left", angleDeg: 180 },
  { label: "ENCRYPTION", value: "ACTIVE", side: "right", angleDeg: 200 },
];

export const CORE_WORDMARK = "PX";

export const MISSION_STATUS = { label: "MISSION STATUS", value: "ACTIVE" };

export interface HealthMetric {
  label: string;
  value: number;
}

export const SYSTEM_HEALTH: HealthMetric[] = [
  { label: "CORE", value: 100 },
  { label: "NETWORK", value: 100 },
  { label: "AI_ENGINE", value: 100 },
  { label: "DATABASE", value: 98 },
  { label: "ENCRYPTION", value: 100 },
];

export const SIGNAL_STRENGTH = { freq: "2.4 GHZ", channel: "SECURE CHANNEL" };

export const SYSTEM_CHECK = { label: "SYSTEM CHECK", value: "OK" };

export const TAGLINE = "OBSERVE. ANALYZE. RESPOND.";
export const TITLE = "PRAHARI X";
export const SUBTITLE = "MILITARY INTELLIGENCE PLATFORM";
export const STATUS_BAR_TEXT = "ALL SYSTEMS OPERATIONAL";

/** Particle-field budget by device tier — Canvas2D dust/embers, not a
 * WebGL/GPU point-sprite system, so counts are kept conservative even at
 * the "high" tier. */
export const PARTICLE_TIERS = {
  high: { count: 90, speed: 1 },
  medium: { count: 55, speed: 0.85 },
  low: { count: 24, speed: 0.7 },
} as const;
