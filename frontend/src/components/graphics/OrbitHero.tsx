import { useRef, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Satellite, Crosshair, Radar as RadarIcon } from "lucide-react";

const RINGS = [
  { radius: 120, duration: 22, dot: "satellite" as const },
  { radius: 172, duration: 34, dot: "none" as const },
  { radius: 220, duration: 48, dot: "crosshair" as const },
];

function OrbitRing({ radius, duration, dot, reverse }: { radius: number; duration: number; dot: "satellite" | "crosshair" | "none"; reverse?: boolean }) {
  return (
    <div
      className="absolute rounded-full border border-[color:var(--color-border-strong)]/70"
      style={{ width: radius * 2, height: radius * 2, left: `calc(50% - ${radius}px)`, top: `calc(50% - ${radius}px)` }}
    >
      {dot !== "none" && (
        <motion.div
          className="absolute h-full w-full"
          animate={{ rotate: reverse ? -360 : 360 }}
          transition={{ duration, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "50% 50%" }}
        >
          <div
            className="absolute flex h-8 w-8 items-center justify-center rounded-xl border border-[color:var(--color-sentinel-500)]/40 bg-[color:var(--color-surface-2)] text-[color:var(--color-sentinel-400)] shadow-[var(--shadow-glow-sentinel)]"
            style={{ left: -16, top: radius - 16 }}
          >
            {dot === "satellite" ? <Satellite className="h-4 w-4" /> : <Crosshair className="h-4 w-4" />}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function OrbitHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const rx = useSpring(mvY, { stiffness: 80, damping: 20 });
  const ry = useSpring(mvX, { stiffness: 80, damping: 20 });
  const rotateX = useTransform(rx, [-40, 40], [8, -8]);
  const rotateY = useTransform(ry, [-40, 40], [-8, 8]);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mvX.set(e.clientX - rect.left - rect.width / 2);
    mvY.set(e.clientY - rect.top - rect.height / 2);
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mvX.set(0);
        mvY.set(0);
      }}
      className="relative mx-auto flex h-[440px] w-full max-w-xl items-center justify-center [perspective:1200px]"
    >
      <motion.div style={{ rotateX, rotateY }} className="relative flex h-full w-full items-center justify-center">
        <div className="bg-radial-fade absolute inset-0 rounded-full" />

        {/* Core sphere */}
        <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-[#173224] to-[#0b0e14] shadow-[0_0_80px_-10px_rgba(57,160,110,0.45)]">
          <div className="absolute inset-0 rounded-full bg-grid opacity-40" style={{ clipPath: "circle(50%)" }} />
          <div className="absolute inset-3 rounded-full border border-[color:var(--color-sentinel-500)]/30" />
          <RadarIcon className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-[color:var(--color-sentinel-400)]" />
        </div>

        {RINGS.map((r, i) => (
          <OrbitRing key={i} {...r} reverse={i === 1} />
        ))}

        {/* Floating data cards */}
        <motion.div
          className="glass absolute -left-4 top-6 w-44 rounded-2xl p-3 shadow-[var(--shadow-float)] md:-left-10"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <p className="text-[10px] uppercase tracking-wider text-[color:var(--color-ink-3)]">Active Missions</p>
          <p className="mono-tag mt-1 text-lg font-semibold text-[color:var(--color-ink-0)]">12</p>
          <p className="mt-0.5 text-[11px] text-[color:var(--color-success-400)]">+3 this week</p>
        </motion.div>

        <motion.div
          className="glass absolute -right-4 bottom-10 w-48 rounded-2xl p-3 shadow-[var(--shadow-float)] md:-right-12"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        >
          <p className="text-[10px] uppercase tracking-wider text-[color:var(--color-ink-3)]">Threat Level</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-amber-500)]" />
            <p className="text-sm font-medium text-[color:var(--color-ink-0)]">Elevated — Sector 7</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
