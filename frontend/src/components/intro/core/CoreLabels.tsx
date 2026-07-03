import { motion } from "motion/react";
import { AI_COLORS, CORE_LABELS } from "../aiIntroConfig";

// ----------------------------------------------------------------------------
// The floating holographic labels ringing the AI Core (AI NODE, SATELLITE
// LINK, THERMAL, RADAR, GPS, SIGNAL, ENCRYPTION, DATA STREAM), each joined
// to the core's edge by a thin connector line. Positioned by simple
// trigonometry from `angleDeg` in aiIntroConfig.ts (0 = 12 o'clock,
// clockwise) rather than hand-placed pixel offsets, so the ring of labels
// stays correctly arranged at any container size. Connector lines + anchor
// dots are one shared SVG overlay; the label text itself is plain HTML so
// it stays crisp and easy to lay out with Tailwind.
// ----------------------------------------------------------------------------

const CORE_EDGE_R = 34; // % of the shared 0..100 coordinate space
const LABEL_R = 46; // % — where the label anchor point sits

function pointFor(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: 50 + radius * Math.sin(rad),
    y: 50 - radius * Math.cos(rad),
  };
}

interface CoreLabelsProps {
  visible: boolean;
}

export function CoreLabels({ visible }: CoreLabelsProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Connector lines + anchor dots, one shared overlay so every line
          shares a single coordinate space with the label positions below. */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
        {CORE_LABELS.map((item, i) => {
          const from = pointFor(item.angleDeg, CORE_EDGE_R);
          const to = pointFor(item.angleDeg, LABEL_R);
          return (
            <g key={item.label} opacity={visible ? 1 : 0} style={{ transition: `opacity 0.6s ease ${0.15 + i * 0.06}s` }}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={AI_COLORS.glow500} strokeOpacity={0.45} strokeWidth={0.25} vectorEffect="non-scaling-stroke" />
              <circle cx={from.x} cy={from.y} r={0.6} fill={AI_COLORS.glow400} opacity={0.8} />
              <circle cx={to.x} cy={to.y} r={0.5} fill={AI_COLORS.glow400} opacity={0.6} />
            </g>
          );
        })}
      </svg>

      {CORE_LABELS.map((item, i) => {
        const pos = pointFor(item.angleDeg, LABEL_R);
        const alignRight = item.side === "left";
        return (
          <motion.div
            key={item.label}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: alignRight ? "translate(-100%, -50%)" : "translate(0%, -50%)",
            }}
            initial={{ opacity: 0, x: alignRight ? 8 : -8 }}
            animate={visible ? { opacity: 1, x: 0 } : { opacity: 0 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={`px-2 ${alignRight ? "text-right" : "text-left"}`}>
              <p className="mono-tag whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: AI_COLORS.glow300 }}>
                {item.label}
              </p>
              <p className="mono-tag whitespace-nowrap text-[9px] uppercase tracking-wider" style={{ color: AI_COLORS.ink2 }}>
                {item.value}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
