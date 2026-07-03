import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AI_COLORS, MISSION_STATUS, SIGNAL_STRENGTH, SYSTEM_CHECK, SYSTEM_HEALTH } from "./aiIntroConfig";

// ----------------------------------------------------------------------------
// The right-column tactical HUD stack: Mission Status, System Health,
// Signal Strength, and System Check — four independent panels (each its own
// export) so the parent can stagger their reveal and position them without
// this file knowing anything about layout. Every value animates in
// (progress bars filling, a pulse indicator, a live waveform) rather than
// sitting static once mounted.
// ----------------------------------------------------------------------------

interface PanelProps {
  active: boolean;
  delay?: number;
}

function panelMotionProps(delay: number) {
  return {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function MissionStatusPanel({ active, delay = 0 }: PanelProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div className="hud-card glass pointer-events-auto w-[min(84vw,260px)] rounded-[var(--radius-md)] p-4" {...panelMotionProps(delay)}>
          <p className="mono-tag text-[10px] uppercase tracking-widest" style={{ color: AI_COLORS.ink2 }}>
            {MISSION_STATUS.label}
          </p>
          <p className="mono-tag mt-1 text-2xl font-bold tracking-wide" style={{ color: AI_COLORS.glow400 }}>
            {MISSION_STATUS.value}
          </p>
          <div className="mt-3 flex gap-[3px] overflow-hidden" aria-hidden>
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="h-2 w-[3px] shrink-0 -skew-x-[20deg]" style={{ backgroundColor: AI_COLORS.glow500, opacity: 0.85 - i * 0.045 }} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HealthBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="mono-tag text-[10px] uppercase tracking-widest" style={{ color: AI_COLORS.ink2 }}>
          {label}
        </span>
        <span className="mono-tag text-[10px]" style={{ color: AI_COLORS.glow400 }}>
          {value}%
        </span>
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface-3)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: AI_COLORS.glow500 }}
          initial={{ width: "0%" }}
          animate={{ width: `${value}%` }}
          transition={{ delay: delay + 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export function SystemHealthPanel({ active, delay = 0 }: PanelProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div className="hud-card glass pointer-events-auto w-[min(84vw,260px)] space-y-2.5 rounded-[var(--radius-md)] p-4" {...panelMotionProps(delay)}>
          <p className="mono-tag text-[10px] uppercase tracking-widest" style={{ color: AI_COLORS.ink2 }}>
            SYSTEM HEALTH
          </p>
          {SYSTEM_HEALTH.map((m, i) => (
            <HealthBar key={m.label} label={m.label} value={m.value} delay={delay + i * 0.12} />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Deterministic pseudo-random waveform bars (seeded, not Math.random on
 * every render) representing live signal strength — SVG, not canvas, per
 * the "SVG for HUD graphics" split. */
function useWaveform(bars: number) {
  return useMemo(() => {
    let seed = 7;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    return Array.from({ length: bars }).map(() => 0.25 + rand() * 0.75);
  }, [bars]);
}

export function SignalStrengthPanel({ active, delay = 0 }: PanelProps) {
  const heights = useWaveform(28);
  return (
    <AnimatePresence>
      {active && (
        <motion.div className="hud-card glass pointer-events-auto w-[min(84vw,260px)] rounded-[var(--radius-md)] p-4" {...panelMotionProps(delay)}>
          <p className="mono-tag mb-2 text-[10px] uppercase tracking-widest" style={{ color: AI_COLORS.ink2 }}>
            SIGNAL STRENGTH
          </p>
          <svg viewBox="0 0 140 36" className="h-9 w-full" preserveAspectRatio="none">
            {heights.map((h, i) => (
              <rect
                key={i}
                x={i * 5}
                y={36 - h * 34}
                width={3}
                height={h * 34}
                fill={AI_COLORS.glow500}
                opacity={0.55 + h * 0.4}
                className="ai-signal-bar"
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </svg>
          <style>{`
            @keyframes ai-signal-jitter { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.7); } }
            .ai-signal-bar { animation: ai-signal-jitter 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom; }
          `}</style>
          <div className="mt-2 flex items-center justify-between">
            <span className="mono-tag text-[10px]" style={{ color: AI_COLORS.ink3 }}>
              FREQ: {SIGNAL_STRENGTH.freq}
            </span>
            <span className="mono-tag text-[10px]" style={{ color: AI_COLORS.ink3 }}>
              {SIGNAL_STRENGTH.channel}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SystemCheckPanel({ active, delay = 0 }: PanelProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div className="hud-card glass pointer-events-auto flex w-[min(84vw,260px)] items-center justify-between rounded-[var(--radius-md)] p-4" {...panelMotionProps(delay)}>
          <p className="mono-tag text-[10px] uppercase tracking-widest" style={{ color: AI_COLORS.ink2 }}>
            {SYSTEM_CHECK.label}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: AI_COLORS.glow400 }}
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
                />
              ))}
            </div>
            <span className="mono-tag text-xs font-semibold" style={{ color: AI_COLORS.glow400 }}>
              [ {SYSTEM_CHECK.value} ]
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
