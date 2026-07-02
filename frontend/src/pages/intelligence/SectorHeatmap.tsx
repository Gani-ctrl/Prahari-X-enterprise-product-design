import { motion } from "motion/react";
import { REGIONS } from "@/lib/mockData";
import type { ThreatReport } from "@/types";
import { cn } from "@/lib/utils";

const SEVERITY_WEIGHT: Record<ThreatReport["severity"], number> = { critical: 4, high: 3, medium: 2, low: 1 };

export function SectorHeatmap({ threats }: { threats: ThreatReport[] }) {
  const scores = REGIONS.map((region) => {
    const regionThreats = threats.filter((t) => t.region === region && t.status !== "neutralized");
    const score = regionThreats.reduce((sum, t) => sum + SEVERITY_WEIGHT[t.severity], 0);
    return { region, score, count: regionThreats.length };
  });
  const max = Math.max(1, ...scores.map((s) => s.score));

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {scores.map((s, i) => {
        const intensity = s.score / max;
        return (
          <motion.div
            key={s.region}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="group relative aspect-square rounded-xl border border-[color:var(--color-border)] p-2.5"
            style={{
              background: intensity > 0
                ? `linear-gradient(135deg, rgba(255,84,112,${0.08 + intensity * 0.32}), rgba(255,176,32,${0.04 + intensity * 0.14}))`
                : "var(--color-surface-2)",
            }}
          >
            <div className={cn("absolute right-2 top-2 h-2 w-2 rounded-full", intensity > 0.6 ? "bg-[color:var(--color-danger-500)]" : intensity > 0.25 ? "bg-[color:var(--color-amber-500)]" : "bg-[color:var(--color-ink-4)]")} />
            <p className="text-[10px] font-medium leading-tight text-[color:var(--color-ink-2)]">{s.region}</p>
            <p className="mono-tag mt-1 text-lg font-semibold text-[color:var(--color-ink-0)]">{s.count}</p>
            <p className="text-[9px] uppercase tracking-wide text-[color:var(--color-ink-4)]">active signals</p>
          </motion.div>
        );
      })}
    </div>
  );
}
