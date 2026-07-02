// ============================================================================
// Lightweight DOM marker builder for the Live Operations Map.
//
// Deliberately NOT using per-marker React trees (ReactDOM roots per marker
// get expensive fast once you have dozens of markers rebuilding on every
// poll). Plain DOM + CSS keeps marker creation cheap so the map stays smooth
// even as the roster/asset/mission lists grow — and the shapes below follow
// loose NATO-symbology conventions (circle = personnel, square = equipment,
// diamond = hostile/unknown, ring = command post) rather than literal icons,
// which reads as more authentically "tactical" than a plain icon glyph.
// ============================================================================

export type MarkerShape = "circle" | "square" | "diamond" | "ring";

export interface MarkerOptions {
  shape: MarkerShape;
  color: string;
  glow?: string;
  size?: number;
  pulse?: boolean;
}

export function createMarkerElement({ shape, color, glow, size = 14, pulse = false }: MarkerOptions): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.width = `${size}px`;
  wrapper.style.height = `${size}px`;
  wrapper.style.cursor = "pointer";

  if (pulse) {
    const ring = document.createElement("span");
    ring.className = "animate-pulse-ring";
    ring.style.position = "absolute";
    ring.style.inset = "0";
    ring.style.borderRadius = shape === "square" ? "3px" : "9999px";
    ring.style.border = `1.5px solid ${color}`;
    wrapper.appendChild(ring);
  }

  const core = document.createElement("span");
  core.style.position = "absolute";
  core.style.inset = "0";
  core.style.display = "block";
  core.style.boxShadow = glow ? `0 0 8px 2px ${glow}` : "none";
  core.style.border = `1.5px solid ${color}`;
  core.style.background = shape === "ring" ? "rgba(11,15,20,0.85)" : color;

  if (shape === "circle" || shape === "ring") core.style.borderRadius = "9999px";
  else if (shape === "square") core.style.borderRadius = "3px";
  else if (shape === "diamond") core.style.transform = "rotate(45deg)";

  wrapper.appendChild(core);
  return wrapper;
}
