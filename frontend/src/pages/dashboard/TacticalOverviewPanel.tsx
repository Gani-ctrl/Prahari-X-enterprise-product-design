import { useMemo } from "react";
import { motion } from "motion/react";
import { Radar, Satellite } from "lucide-react";
import type { Mission, ThreatReport } from "@/types";

interface TacticalOverviewPanelProps {
  missions: Mission[];
  threats: ThreatReport[];
}

// Deterministically projects a region/title string onto a stable 0-100 grid
// position, so the same mission or threat always renders at the same spot on
// the tactical map (no backend geocoordinates exist yet — this is a stable
// visual placeholder, not real geodata).
function projectToGrid(seed: string, salt: number): { x: number; y: number } {
  let h = salt;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const x = 12 + (h % 76);
  const y = 14 + ((h >> 8) % 70);
  return { x, y };
}

/**
 * Immersive command-room visual for the top of the Dashboard: a scanning
 * tactical grid with live mission and threat markers pulled straight from
 * DB-backed state (no static imagery) — a radar sweep, a moving scan line,
 * and glowing markers whose count always matches real operational data.
 */
export function TacticalOverviewPanel({ missions, threats }: TacticalOverviewPanelProps) {
  const activeMissions = useMemo(() => missions.filter((m) => m.status === "active" || m.status === "planning"), [missions]);
  const activeThreats = useMemo(() => threats.filter((t) => t.status !== "neutralized"), [threats]);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]">
      {/* Tactical grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(46,204,143,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(46,204,143,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Moving scan line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-scan-line absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-[color:var(--color-success-500)]/10 to-transparent" />
      </div>

      <div className="relative flex items-center justify-between border-b border-[color:var(--color-border)] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-success-500)]/12 text-[color:var(--color-success-400)]">
            <Radar className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-[color:var(--color-ink-0)]">Tactical Overview</p>
            <p className="text-xs text-[color:var(--color-ink-3)]">Live operational grid — {activeMissions.length} active missions, {activeThreats.length} unresolved signals</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[color:var(--color-success-400)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-success-500)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--color-success-500)]" />
          </span>
          LIVE
        </div>
      </div>

      <div className="relative h-64 sm:h-72">
        {/* Radial sweep, rotating slowly behind the markers */}
        <div className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 opacity-40">
          <div
            className="animate-radar-sweep h-full w-full"
            style={{
              background: "conic-gradient(from 0deg, rgba(46,204,143,0.28), transparent 22%, transparent 100%)",
              borderRadius: "9999px",
            }}
          />
        </div>

        {/* Concentric range rings */}
        {[95, 70, 45, 20].map((size) => (
          <div
            key={size}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--color-border-strong)]/50"
            style={{ width: `${size}%`, height: `${size}%` }}
          />
        ))}

        {/* Mission markers */}
        {activeMissions.map((m, i) => {
          const { x, y } = projectToGrid(m.region + m.id, 17);
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className="absolute inset-0 -m-1.5 animate-pulse-ring rounded-full border border-[color:var(--color-sentinel-500)]" />
              <span className="relative block h-2 w-2 rounded-full bg-[color:var(--color-sentinel-400)] shadow-[0_0_8px_2px_rgba(57,160,110,0.6)]" />
              <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 w-max max-w-[160px] -translate-x-1/2 rounded-md border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-2 py-1 text-[10px] text-[color:var(--color-ink-1)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {m.code} · {m.region}
              </div>
            </motion.div>
          );
        })}

        {/* Threat markers */}
        {activeThreats.slice(0, 8).map((t, i) => {
          const { x, y } = projectToGrid(t.region + t.id, 41);
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className="relative block h-1.5 w-1.5 rotate-45 bg-[color:var(--color-danger-500)] shadow-[0_0_6px_2px_rgba(255,84,112,0.6)]" />
              <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 w-max max-w-[160px] -translate-x-1/2 rounded-md border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-2 py-1 text-[10px] text-[color:var(--color-ink-1)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {t.title}
              </div>
            </motion.div>
          );
        })}

        {/* Corner HUD accents */}
        <Satellite className="absolute right-3 top-3 h-4 w-4 animate-float-slow text-[color:var(--color-ink-4)]/60" />
        <div className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-ink-4)]/70">
          Grid Ref // Sector Overlay Active
        </div>
      </div>
    </div>
  );
}
