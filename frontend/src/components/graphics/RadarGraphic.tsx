import { motion } from "motion/react";

interface RadarGraphicProps {
  size?: number;
  className?: string;
}

const BLIPS = [
  { cx: 62, cy: 40, delay: 0 },
  { cx: 34, cy: 58, delay: 0.6 },
  { cx: 70, cy: 66, delay: 1.2 },
  { cx: 45, cy: 30, delay: 1.8 },
];

export function RadarGraphic({ size = 320, className }: RadarGraphicProps) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" className="overflow-visible">
        <defs>
          <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#39A06E" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#39A06E" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="radar-sweep-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5CB98C" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#5CB98C" stopOpacity="0" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="49" fill="url(#radar-glow)" />

        {[46, 34, 22, 10].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#2E3648" strokeWidth="0.5" />
        ))}
        <line x1="1" y1="50" x2="99" y2="50" stroke="#2E3648" strokeWidth="0.5" />
        <line x1="50" y1="1" x2="50" y2="99" stroke="#2E3648" strokeWidth="0.5" />

        <g style={{ transformOrigin: "50px 50px" }} className="animate-radar-sweep">
          <path d="M 50 50 L 50 4 A 46 46 0 0 1 82.5 17.5 Z" fill="url(#radar-sweep-fill)" />
        </g>

        <circle cx="50" cy="50" r="1.6" fill="#5CB98C" />

        {BLIPS.map((b, i) => (
          <motion.circle
            key={i}
            cx={b.cx}
            cy={b.cy}
            r="1.4"
            fill="#FFB020"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: b.delay, ease: "easeInOut" }}
          />
        ))}
      </svg>
    </div>
  );
}
