import { motion } from "motion/react";
import { Radio } from "lucide-react";

/**
 * Ambient "live scanner" strip for the Emergency Response tab — a scanning
 * sweep bar plus a pulsing status dot, signaling that the escalation
 * watchlist below is being monitored continuously rather than a static list.
 */
export function LiveScannerBanner({ activeCount }: { activeCount: number }) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-danger-500)]/25 bg-[color:var(--color-danger-500)]/[0.06] px-5 py-3.5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-[color:var(--color-danger-500)]/15 to-transparent"
          animate={{ x: ["-8rem", "110%"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="relative flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-danger-500)]/15 text-[color:var(--color-danger-400)]">
          <Radio className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[color:var(--color-ink-0)]">
            {activeCount > 0 ? `Live scanner tracking ${activeCount} active escalation${activeCount > 1 ? "s" : ""}` : "Live scanner active — no escalations detected"}
          </p>
          <p className="text-xs text-[color:var(--color-ink-3)]">Continuously monitoring threat feed, medical flags, and asset maintenance across all sectors.</p>
        </div>
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-danger-500)] opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[color:var(--color-danger-500)]" />
        </span>
      </div>
    </div>
  );
}
