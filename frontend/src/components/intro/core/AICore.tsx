import { useMemo } from "react";
import { AI_COLORS, CORE_WORDMARK } from "../aiIntroConfig";

// ----------------------------------------------------------------------------
// The hero element: an abstract AI Intelligence Core. No soldier, character,
// weapon, or battlefield anywhere in this file — the "living AI" read comes
// entirely from several concentric SVG ring groups, each rotating at its own
// speed/direction, a hex-lattice shell, radiating energy pulses, and a
// glowing center wordmark. Purely declarative SVG + CSS keyframe animations
// (the @keyframes are scoped to this component via a single inline <style>
// tag so nothing here touches the shared globals.css); cursor parallax is
// layered on top via the `--px`/`--py` CSS custom properties written by
// useCursorParallax.ts on an ancestor element — this component just reads
// them in a `transform`, so it tilts toward the pointer without any extra
// wiring or re-renders.
// ----------------------------------------------------------------------------

const SIZE = 440;
const C = SIZE / 2;

function ring(radius: number) {
  return { radius, cx: C, cy: C };
}

/** A ring built from short dash segments rather than a solid stroke — reads
 * as a "segmented data ring" rather than a plain circle. */
function SegmentedRing({ radius, segments, gapDeg, strokeWidth, color, opacity }: { radius: number; segments: number; gapDeg: number; strokeWidth: number; color: string; opacity: number }) {
  const circumference = 2 * Math.PI * radius;
  const segDeg = 360 / segments - gapDeg;
  const dashLen = (segDeg / 360) * circumference;
  const gapLen = (gapDeg / 360) * circumference;
  return (
    <circle
      cx={C}
      cy={C}
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeOpacity={opacity}
      strokeDasharray={`${dashLen} ${gapLen}`}
    />
  );
}

function TickRing({ radius, count, length, color, opacity }: { radius: number; count: number; length: number; color: string; opacity: number }) {
  const ticks = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        const x1 = C + Math.cos(a) * radius;
        const y1 = C + Math.sin(a) * radius;
        const x2 = C + Math.cos(a) * (radius - length);
        const y2 = C + Math.sin(a) * (radius - length);
        return { x1, y1, x2, y2, key: i };
      }),
    [radius, count, length]
  );
  return (
    <g>
      {ticks.map((t) => (
        <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={color} strokeOpacity={opacity} strokeWidth={1.4} />
      ))}
    </g>
  );
}

/** A faint hex-lattice disc, clipped to a circle, giving the core a
 * "structural shell" read without any 3D geometry. */
function HexLattice({ radius, opacity }: { radius: number; opacity: number }) {
  const hexes = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    const step = 26;
    for (let row = -8; row <= 8; row++) {
      for (let col = -8; col <= 8; col++) {
        const x = C + col * step * 1.5;
        const y = C + row * step * Math.sqrt(3) + (col % 2 !== 0 ? (step * Math.sqrt(3)) / 2 : 0);
        if (Math.hypot(x - C, y - C) < radius) out.push({ x, y });
      }
    }
    return out;
  }, [radius]);

  const hexPath = (x: number, y: number, s: number) => {
    const pts = Array.from({ length: 6 }).map((_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${x + s * Math.cos(a)},${y + s * Math.sin(a)}`;
    });
    return `M ${pts.join(" L ")} Z`;
  };

  return (
    <g opacity={opacity}>
      {hexes.map((h, i) => (
        <path key={i} d={hexPath(h.x, h.y, 9)} fill="none" stroke={AI_COLORS.glow600} strokeWidth={0.5} />
      ))}
    </g>
  );
}

export function AICore() {
  const outer = ring(200);
  const seg2 = ring(176);
  const seg3 = ring(152);
  const tick4 = ring(128);
  const seg5 = ring(100);
  const inner = ring(72);

  return (
    <div
      className="relative mx-auto"
      style={{
        width: "min(46vw, 46vh, 560px)",
        height: "min(46vw, 46vh, 560px)",
        transform: "perspective(1100px) rotateX(calc(var(--py, 0) * -7deg)) rotateY(calc(var(--px, 0) * 9deg))",
        transition: "transform 0.15s linear",
      }}
    >
      <style>{`
        @keyframes ai-spin-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ai-spin-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes ai-pulse-glow { 0%, 100% { opacity: 0.55; transform: scale(0.97); } 50% { opacity: 0.95; transform: scale(1.05); } }
        @keyframes ai-ping { 0% { transform: scale(0.55); opacity: 0.55; } 100% { transform: scale(1.55); opacity: 0; } }
        .ai-ring-outer { animation: ai-spin-cw 46s linear infinite; transform-box: view-box; transform-origin: 50% 50%; }
        .ai-ring-2 { animation: ai-spin-ccw 30s linear infinite; transform-box: view-box; transform-origin: 50% 50%; }
        .ai-ring-3 { animation: ai-spin-cw 21s linear infinite; transform-box: view-box; transform-origin: 50% 50%; }
        .ai-ring-4 { animation: ai-spin-ccw 36s linear infinite; transform-box: view-box; transform-origin: 50% 50%; }
        .ai-ring-5 { animation: ai-spin-cw 14s linear infinite; transform-box: view-box; transform-origin: 50% 50%; }
        .ai-glow-pulse { animation: ai-pulse-glow 3.6s ease-in-out infinite; transform-box: view-box; transform-origin: 50% 50%; }
        .ai-ping-1 { animation: ai-ping 3.2s ease-out infinite; transform-box: view-box; transform-origin: 50% 50%; }
        .ai-ping-2 { animation: ai-ping 3.2s ease-out infinite 1.6s; transform-box: view-box; transform-origin: 50% 50%; }
      `}</style>

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id="core-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={AI_COLORS.glow300} stopOpacity="0.9" />
            <stop offset="45%" stopColor={AI_COLORS.glow500} stopOpacity="0.35" />
            <stop offset="100%" stopColor={AI_COLORS.glow700} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="core-shell-glow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor={AI_COLORS.glow600} stopOpacity="0" />
            <stop offset="100%" stopColor={AI_COLORS.glow500} stopOpacity="0.08" />
          </radialGradient>
        </defs>

        {/* Ambient shell glow */}
        <circle cx={C} cy={C} r={210} fill="url(#core-shell-glow)" />

        {/* Static hex-lattice shell */}
        <HexLattice radius={196} opacity={0.35} />

        {/* Expanding energy pings from center */}
        <circle className="ai-ping-1" cx={C} cy={C} r={70} fill="none" stroke={AI_COLORS.glow400} strokeWidth={1.5} />
        <circle className="ai-ping-2" cx={C} cy={C} r={70} fill="none" stroke={AI_COLORS.glow400} strokeWidth={1.5} />

        {/* Ring 1 — outer segmented, slow clockwise */}
        <g className="ai-ring-outer">
          <SegmentedRing radius={outer.radius} segments={28} gapDeg={4} strokeWidth={2} color={AI_COLORS.glow500} opacity={0.4} />
        </g>

        {/* Ring 2 — counter-rotating, wider segments */}
        <g className="ai-ring-2">
          <SegmentedRing radius={seg2.radius} segments={14} gapDeg={10} strokeWidth={3} color={AI_COLORS.glow400} opacity={0.5} />
        </g>

        {/* Ring 3 — dense tick marks, clockwise */}
        <g className="ai-ring-3">
          <TickRing radius={seg3.radius} count={48} length={10} color={AI_COLORS.glow500} opacity={0.45} />
        </g>

        {/* Ring 4 — thin solid + counter-rotating ticks */}
        <g className="ai-ring-4">
          <circle cx={tick4.cx} cy={tick4.cy} r={tick4.radius} fill="none" stroke={AI_COLORS.glow600} strokeOpacity={0.5} strokeWidth={1} />
          <TickRing radius={tick4.radius} count={24} length={14} color={AI_COLORS.glow400} opacity={0.55} />
        </g>

        {/* Ring 5 — inner mechanical segments, fastest */}
        <g className="ai-ring-5">
          <SegmentedRing radius={seg5.radius} segments={9} gapDeg={14} strokeWidth={4} color={AI_COLORS.glow300} opacity={0.6} />
        </g>

        {/* Innermost frame */}
        <circle cx={inner.cx} cy={inner.cy} r={inner.radius} fill="none" stroke={AI_COLORS.glow200} strokeOpacity={0.5} strokeWidth={1.5} />

        {/* Center energy glow */}
        <circle className="ai-glow-pulse" cx={C} cy={C} r={64} fill="url(#core-center-glow)" />

        {/* Center wordmark */}
        <text
          x={C}
          y={C + 12}
          textAnchor="middle"
          fill={AI_COLORS.glow50}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 40,
            fontWeight: 700,
            textShadow: `0 0 18px ${AI_COLORS.glow400}, 0 0 42px ${AI_COLORS.glow500}`,
          }}
        >
          {CORE_WORDMARK}
        </text>
      </svg>
    </div>
  );
}
