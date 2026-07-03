import { useMemo } from "react";
import { PARTICLE_TIERS } from "./aiIntroConfig";

export type QualityTier = keyof typeof PARTICLE_TIERS;

/** Cheap, synchronous heuristic — no benchmarking, just device signals
 * that are reliably available up front, so the intro never has to
 * "discover" it's underpowered mid-animation and stutter while adjusting. */
function detectTier(): QualityTier {
  if (typeof window === "undefined") return "medium";

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return "low";

  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
  const narrow = window.innerWidth < 768;

  if (coarsePointer && (narrow || cores <= 4 || memory <= 4)) return "low";
  if (coarsePointer || cores <= 4 || memory <= 4) return "medium";
  return "high";
}

export function useDeviceTier() {
  return useMemo(() => {
    const tier = detectTier();
    return {
      tier,
      budget: PARTICLE_TIERS[tier],
      prefersReducedMotion: typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    };
  }, []);
}
