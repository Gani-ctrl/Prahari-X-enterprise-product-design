// ============================================================================
// Deterministic geo helpers for the Live Operations Map.
//
// Nothing in this fictional dataset carries real lat/lng — every region and
// entity location is a human-readable string (e.g. "Himalayan Frontier Post").
// These helpers hash those strings into stable, repeatable coordinates
// inside a fixed fictional area of operations, so the same soldier/base
// always renders in the same spot on every reload/poll instead of jumping
// around. The AOI is anchored on India's geographic centroid and sized to
// cover most of the country, giving the fictional Indian theatre (frontier
// posts, coastal commands, desert sectors, island bases) room to feel
// genuinely spread out rather than clustered in one corner of the map.
// ============================================================================

export const AOI_CENTER: [number, number] = [78.9629, 20.5937];

// Roughly spans mainland India at the default zoom.
export const AOI_SPAN = 12.0;

function hash(seed: string, salt = 17): number {
  let h = salt >>> 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic [lng, lat] for a named region/location string. */
export function locationToCoords(label: string): [number, number] {
  const h = hash(label, 101);
  const angle = (h % 360) * (Math.PI / 180);
  const dist = 0.3 + (((h >> 8) % 100) / 100) * (AOI_SPAN / 2 - 0.3);
  return [AOI_CENTER[0] + Math.cos(angle) * dist, AOI_CENTER[1] + Math.sin(angle) * dist * 0.72];
}

/** Small deterministic offset around a base coordinate — spreads entities
 * stationed at the same region instead of stacking them on one point. */
export function jitterCoords(seed: string, base: [number, number], radiusDeg = 0.045): [number, number] {
  const h = hash(seed, 233);
  const angle = (h % 360) * (Math.PI / 180);
  const dist = (radiusDeg * ((h >> 10) % 100)) / 100;
  return [base[0] + Math.cos(angle) * dist, base[1] + Math.sin(angle) * dist];
}

/** Approximate circle polygon (equirectangular — fine at demo zoom/scale) for zone/threat-radius fills. */
export function circlePolygon(center: [number, number], radiusKm: number, points = 48) {
  const coords: [number, number][] = [];
  const latRad = (center[1] * Math.PI) / 180;
  const kmPerDegLat = 110.574;
  const kmPerDegLng = 111.32 * Math.cos(latRad);
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    coords.push([center[0] + (Math.cos(angle) * radiusKm) / kmPerDegLng, center[1] + (Math.sin(angle) * radiusKm) / kmPerDegLat]);
  }
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [coords] },
    properties: {},
  };
}

export type ReadinessLevel = "green" | "yellow" | "orange" | "red";

export const READINESS_META: Record<ReadinessLevel, { label: string; color: string; glow: string }> = {
  green: { label: "Nominal", color: "#2ECC8F", glow: "rgba(46,204,143,0.6)" },
  yellow: { label: "Elevated", color: "#FFB020", glow: "rgba(255,176,32,0.55)" },
  orange: { label: "High Alert", color: "#FF8A3D", glow: "rgba(255,138,61,0.6)" },
  red: { label: "Critical", color: "#FF5470", glow: "rgba(255,84,112,0.65)" },
};
