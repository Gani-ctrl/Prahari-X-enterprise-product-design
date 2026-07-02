import { motion } from "motion/react";
import { Building } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReadinessLevel = "green" | "yellow" | "orange" | "red";

export interface BaseMarker {
  region: string;
  readiness: ReadinessLevel;
  personnel: number;
  assets: number;
  missions: number;
}

const READINESS_META: Record<ReadinessLevel, { label: string; color: string; glow: string }> = {
  green: { label: "Nominal", color: "var(--color-success-500)", glow: "rgba(46,204,143,0.55)" },
  yellow: { label: "Elevated", color: "var(--color-amber-500)", glow: "rgba(255,176,32,0.5)" },
  orange: { label: "High Alert", color: "#FF8A3D", glow: "rgba(255,138,61,0.55)" },
  red: { label: "Critical", color: "var(--color-danger-500)", glow: "rgba(255,84,112,0.6)" },
};

function projectToGrid(seed: string, salt: number): { x: number; y: number } {
  let h = salt;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return { x: 10 + (h % 80), y: 12 + ((h >> 8) % 72) };
}

/**
 * Interactive tactical map for Base Management — every base/sector plotted
 * with a color-coded readiness indicator (Green/Yellow/Orange/Red) driven by
 * live threat + maintenance data, not a static asset.
 */
export function BaseTacticalMap({ bases }: { bases: BaseMarker[] }) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,176,32,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,176,32,0.1) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-6 py-4">
        <p className="text-sm font-medium text-[color:var(--color-ink-0)]">Sector Readiness Map</p>
        <div className="flex flex-wrap items-center gap-3">
          {(Object.keys(READINESS_META) as ReadinessLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-1.5 text-[11px] text-[color:var(--color-ink-3)]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: READINESS_META[level].color }} />
              {READINESS_META[level].label}
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-72 sm:h-80">
        {[90, 65, 40].map((size) => (
          <div
            key={size}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--color-border-strong)]/40"
            style={{ width: `${size}%`, height: `${size}%` }}
          />
        ))}

        {bases.map((b, i) => {
          const { x, y } = projectToGrid(b.region, 23);
          const meta = READINESS_META[b.readiness];
          return (
            <motion.div
              key={b.region}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {(b.readiness === "orange" || b.readiness === "red") && (
                <span
                  className="absolute inset-0 -m-2 animate-pulse-ring rounded-full border"
                  style={{ borderColor: meta.color }}
                />
              )}
              <span
                className="relative flex h-8 w-8 items-center justify-center rounded-full border-2"
                style={{ borderColor: meta.color, backgroundColor: "var(--color-surface)", boxShadow: `0 0 10px 2px ${meta.glow}` }}
              >
                <Building className="h-3.5 w-3.5" style={{ color: meta.color }} />
              </span>
              <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max max-w-[190px] -translate-x-1/2 rounded-lg border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3 py-2 text-[11px] text-[color:var(--color-ink-1)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                <p className="font-medium text-[color:var(--color-ink-0)]">{b.region}</p>
                <p className={cn("mt-0.5")} style={{ color: meta.color }}>{meta.label}</p>
                <p className="mt-1 text-[color:var(--color-ink-3)]">{b.personnel} personnel · {b.assets} assets · {b.missions} active missions</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
