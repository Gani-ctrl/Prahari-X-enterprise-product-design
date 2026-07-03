import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AI_COLORS, NODE_WIDGET } from "./aiIntroConfig";

// ----------------------------------------------------------------------------
// The small "classified intelligence widget" beneath the boot terminal: an
// abstract global-network node grid (not a literal map, not a battlefield —
// a data-visualization motif) with a couple of nodes pulsing to read as
// "active," plus a global node count footer. Subtle, non-distracting: this
// sits well below the AI Core, which remains the primary focal point.
// ----------------------------------------------------------------------------

interface NodeWidgetProps {
  active: boolean;
}

const GRID_COLS = 22;
const GRID_ROWS = 11;

export function NodeWidget({ active }: NodeWidgetProps) {
  const dots = useMemo(() => {
    const seeded: { x: number; y: number; lit: boolean; pulse: boolean; delay: number }[] = [];
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const r = rand();
        if (r > 0.62) {
          seeded.push({ x, y, lit: true, pulse: false, delay: 0 });
        }
      }
    }
    // Promote a handful of the lit dots to "active" pulsing nodes.
    const pulseCount = Math.min(NODE_WIDGET.active, 5);
    for (let i = 0; i < pulseCount; i++) {
      const idx = Math.floor(rand() * seeded.length);
      if (seeded[idx]) {
        seeded[idx] = { ...seeded[idx], pulse: true, delay: i * 0.4 };
      }
    }
    return seeded;
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="hud-card glass pointer-events-auto w-[min(84vw,360px)] rounded-[var(--radius-md)] p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="mono-tag text-[11px] uppercase tracking-[0.1em]" style={{ color: AI_COLORS.ink2 }}>
              <span style={{ color: AI_COLORS.glow400 }}>{"› /"}</span> {NODE_WIDGET.id}
            </p>
            <span className="mono-tag text-xs" style={{ color: AI_COLORS.ink3 }}>
              ×
            </span>
          </div>

          <svg viewBox={`0 0 ${GRID_COLS * 10} ${GRID_ROWS * 10}`} className="h-20 w-full">
            {dots.map((d, i) => (
              <circle
                key={i}
                cx={d.x * 10 + 5}
                cy={d.y * 10 + 5}
                r={d.pulse ? 1.8 : 1.1}
                fill={d.pulse ? AI_COLORS.glow300 : AI_COLORS.glow700}
                opacity={d.pulse ? 0.95 : 0.5}
                className={d.pulse ? "ai-node-pulse" : undefined}
                style={d.pulse ? { animationDelay: `${d.delay}s` } : undefined}
              />
            ))}
          </svg>
          <style>{`
            @keyframes ai-node-pulse { 0%, 100% { opacity: 0.5; r: 1.4px; } 50% { opacity: 1; r: 2.4px; } }
            .ai-node-pulse { animation: ai-node-pulse 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
          `}</style>

          <div className="mt-2 flex items-center justify-between">
            <p className="mono-tag text-[10px] uppercase tracking-widest" style={{ color: AI_COLORS.ink3 }}>
              GLOBAL NODES : {NODE_WIDGET.globalNodes}
            </p>
            <p className="mono-tag text-[10px] uppercase tracking-widest" style={{ color: AI_COLORS.glow400 }}>
              ACTIVE : {NODE_WIDGET.active}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
