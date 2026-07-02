import { motion } from "motion/react";
import { INTRO_COLORS } from "./introConfig";

// ----------------------------------------------------------------------------
// Small decorative radar HUD element — concentric rings, a rotating sweep
// wedge, and a couple of static "contact" blips. Pure SVG + Motion, no
// canvas/WebGL. Sits quietly in a screen corner as atmosphere, not a
// functional instrument.
// ----------------------------------------------------------------------------

const BLIPS = [
  { angle: 40, radius: 0.62, delay: 0.4 },
  { angle: 205, radius: 0.4, delay: 1.6 },
  { angle: 300, radius: 0.78, delay: 2.8 },
];

export function RadarSweep({ size = 132 }: { size?: number }) {
  const c = size / 2;
  const r = size / 2 - 4;

  return (
    <div className="pointer-events-none relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={INTRO_COLORS.sentinel500} stopOpacity="0.12" />
            <stop offset="100%" stopColor={INTRO_COLORS.sentinel500} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="radar-sweep" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={INTRO_COLORS.sentinel400} stopOpacity="0" />
            <stop offset="100%" stopColor={INTRO_COLORS.sentinel400} stopOpacity="0.55" />
          </linearGradient>
        </defs>

        <circle cx={c} cy={c} r={r} fill="url(#radar-glow)" />
        {[0.34, 0.62, 1].map((f) => (
          <circle key={f} cx={c} cy={c} r={r * f} fill="none" stroke={INTRO_COLORS.sentinel500} strokeOpacity={0.28} strokeWidth={1} />
        ))}
        <line x1={c - r} y1={c} x2={c + r} y2={c} stroke={INTRO_COLORS.sentinel500} strokeOpacity={0.18} strokeWidth={1} />
        <line x1={c} y1={c - r} x2={c} y2={c + r} stroke={INTRO_COLORS.sentinel500} strokeOpacity={0.18} strokeWidth={1} />

        <motion.g style={{ transformOrigin: `${c}px ${c}px` }} animate={{ rotate: 360 }} transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}>
          <path d={`M ${c} ${c} L ${c} ${c - r} A ${r} ${r} 0 0 1 ${c + r * Math.sin(0.9)} ${c - r * Math.cos(0.9)} Z`} fill="url(#radar-sweep)" />
        </motion.g>

        {BLIPS.map((b, i) => {
          const rad = (b.angle * Math.PI) / 180;
          const bx = c + Math.cos(rad) * r * b.radius;
          const by = c + Math.sin(rad) * r * b.radius;
          return (
            <motion.circle
              key={i}
              cx={bx}
              cy={by}
              r={2.2}
              fill={INTRO_COLORS.amber400}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: b.delay, ease: "easeInOut" }}
            />
          );
        })}
      </svg>
    </div>
  );
}
