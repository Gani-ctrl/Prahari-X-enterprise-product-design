import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { motion } from "motion/react";

// ----------------------------------------------------------------------------
// "Volumetric-looking smoke" without any WebGL: a handful of large, heavily
// blurred radial-gradient blobs, each independently drifted and breathed in
// scale/opacity by GSAP on an infinite yoyo loop. Layering a few of these at
// different sizes/speeds/opacities is what actually sells depth — a single
// blob just looks like a blurred circle, four or five overlapping ones read
// as roiling smoke. Embers are a separate, much cheaper Motion-driven layer
// (a handful of small glowing dots rising and fading), the same pattern
// BootOverlay's DustMotes already uses.
//
// Deliberately DOM/CSS only: no canvas, no particle-per-pixel simulation —
// this is the "optimized layered gradients and particles" approach the brief
// asks for instead of a shader-based smoke volume.
// ----------------------------------------------------------------------------

interface SmokeLayerProps {
  blobCount: number;
  emberCount: number;
  /** 0 (calm/thin) .. 1 (fully rolled in) — lets the caller drive overall
   * smoke presence across phases without re-mounting this component. */
  intensity: number;
}

interface BlobConfig {
  key: number;
  left: string;
  top: string;
  size: number;
  hue: "sentinel" | "steel";
  baseOpacity: number;
  duration: number;
  driftX: number;
  driftY: number;
}

export function SmokeLayer({ blobCount, emberCount, intensity }: SmokeLayerProps) {
  const blobs = useMemo<BlobConfig[]>(
    () =>
      Array.from({ length: blobCount }).map((_, i) => ({
        key: i,
        left: `${10 + Math.random() * 80}%`,
        top: `${20 + Math.random() * 65}%`,
        size: 380 + Math.random() * 420,
        hue: i % 3 === 0 ? "steel" : "sentinel",
        baseOpacity: 0.16 + Math.random() * 0.14,
        duration: 9 + Math.random() * 7,
        driftX: (Math.random() - 0.5) * 140,
        driftY: (Math.random() - 0.5) * 90,
      })),
    [blobCount]
  );

  const embers = useMemo(
    () =>
      Array.from({ length: emberCount }).map((_, i) => ({
        key: i,
        left: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 3,
        duration: 5 + Math.random() * 5,
        delay: Math.random() * 5,
      })),
    [emberCount]
  );

  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      blobRefs.current.forEach((el, i) => {
        if (!el) return;
        const cfg = blobs[i];
        gsap.to(el, {
          x: cfg.driftX,
          y: cfg.driftY,
          scale: 1.15,
          duration: cfg.duration,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.4,
        });
      });
    });
    return () => ctx.revert();
    // blobs is stable per blobCount via useMemo; re-running this effect on
    // every render would restart every tween, so it's intentionally scoped
    // to blobCount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blobCount]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: 0.4 + intensity * 0.6 }}>
      {blobs.map((cfg, i) => (
        <div
          key={cfg.key}
          ref={(el) => {
            blobRefs.current[i] = el;
          }}
          className="absolute rounded-full"
          style={{
            left: cfg.left,
            top: cfg.top,
            width: cfg.size,
            height: cfg.size,
            transform: "translate(-50%, -50%)",
            opacity: cfg.baseOpacity,
            filter: "blur(48px)",
            background:
              cfg.hue === "sentinel"
                ? "radial-gradient(circle, rgba(57,160,110,0.5) 0%, rgba(28,32,30,0.35) 55%, transparent 75%)"
                : "radial-gradient(circle, rgba(124,138,163,0.4) 0%, rgba(20,22,26,0.3) 55%, transparent 75%)",
          }}
        />
      ))}

      {embers.map((e) => (
        <motion.span
          key={e.key}
          className="absolute bottom-0 rounded-full bg-[color:var(--color-amber-400)]"
          style={{ left: e.left, width: e.size, height: e.size, boxShadow: "0 0 6px 1px rgba(255,191,71,0.7)" }}
          animate={{ y: [0, -320 - Math.random() * 160], opacity: [0, 0.85, 0] }}
          transition={{ duration: e.duration, delay: e.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
