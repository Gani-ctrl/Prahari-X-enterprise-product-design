import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, SkipForward } from "lucide-react";

// ----------------------------------------------------------------------------
// Minimal military HUD chrome for the "ready"/"dissolving" phases: six status
// indicators (Mission Status, Threat Level, Secure Connection, Radio Signal,
// System Online, Tactical Scan) grouped into three glass panels, revealed
// sequentially, plus the always-available mute/skip controls. Deliberately
// subtle — every panel sits in a screen corner so it reads as atmosphere,
// not a dashboard.
// ----------------------------------------------------------------------------

interface HUDOverlayProps {
  visible: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onSkip: () => void;
}

function StatusRow({ label, value, tone = "sentinel" }: { label: string; value: string; tone?: "sentinel" | "danger" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="mono-tag text-[10px] uppercase tracking-widest text-[color:var(--color-ink-3)]">{label}</p>
      <span className="flex items-center gap-1.5">
        <motion.span
          className={tone === "danger" ? "h-1.5 w-1.5 rounded-full bg-[color:var(--color-danger-400)]" : "h-1.5 w-1.5 rounded-full bg-[color:var(--color-sentinel-400)]"}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className={tone === "danger" ? "mono-tag text-xs font-semibold text-[color:var(--color-danger-400)]" : "mono-tag text-xs font-semibold text-[color:var(--color-sentinel-400)]"}>
          {value}
        </span>
      </span>
    </div>
  );
}

const panelVariants = {
  hidden: { opacity: 0, y: -8 },
  show: (delay: number) => ({ opacity: 1, y: 0, transition: { delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }),
};

export function HUDOverlay({ visible, muted, onToggleMute, onSkip }: HUDOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Mission Status + Threat Level — top left */}
          <motion.div
            className="hud-card glass absolute left-4 top-4 hidden w-52 space-y-2 rounded-[var(--radius-md)] p-3 sm:block"
            variants={panelVariants}
            initial="hidden"
            animate="show"
            custom={0.1}
          >
            <StatusRow label="Mission Status" value="ACTIVE" />
            <div className="divider-fade" />
            <StatusRow label="Threat Level" value="ELEVATED" tone="danger" />
          </motion.div>

          {/* Secure Connection + Radio Signal — top right */}
          <motion.div
            className="hud-card glass absolute right-4 top-4 hidden w-48 space-y-2 rounded-[var(--radius-md)] p-3 sm:block"
            variants={panelVariants}
            initial="hidden"
            animate="show"
            custom={0.35}
          >
            <StatusRow label="Secure Connection" value="ENCRYPTED" />
            <div className="divider-fade" />
            <div className="flex items-center justify-between gap-3">
              <p className="mono-tag text-[10px] uppercase tracking-widest text-[color:var(--color-ink-3)]">Radio Signal</p>
              <div className="flex items-end gap-0.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="w-[3px] rounded-full bg-[color:var(--color-sentinel-500)]"
                    animate={{ height: [3, 8 + ((i * 5) % 9), 4] }}
                    transition={{ duration: 0.6 + (i % 4) * 0.1, repeat: Infinity, repeatType: "mirror", delay: i * 0.05 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* System Online + Tactical Scan — bottom left */}
          <motion.div
            className="hud-card glass absolute bottom-4 left-4 hidden w-52 space-y-2 rounded-[var(--radius-md)] p-3 sm:bottom-6 sm:left-8 sm:block"
            variants={panelVariants}
            initial="hidden"
            animate="show"
            custom={0.6}
          >
            <StatusRow label="System Online" value="100%" />
            <div className="divider-fade" />
            <div className="flex items-center justify-between gap-3">
              <p className="mono-tag text-[10px] uppercase tracking-widest text-[color:var(--color-ink-3)]">Tactical Scan</p>
              <span className="mono-tag text-xs font-semibold text-[color:var(--color-sentinel-400)]">SCANNING</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[color:var(--color-surface-3)]">
              <motion.div
                className="h-full w-1/3 rounded-full bg-[color:var(--color-sentinel-500)]"
                animate={{ x: ["-100%", "300%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>

          {/* Controls — bottom right, always available */}
          <div className="pointer-events-auto absolute bottom-4 right-4 flex items-center gap-2 sm:bottom-6 sm:right-8">
            <button
              type="button"
              onClick={onToggleMute}
              className="glass flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-ink-0)]"
              aria-label={muted ? "Unmute intro audio" : "Mute intro audio"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="glass mono-tag flex h-9 items-center gap-1.5 rounded-full px-3 text-[11px] uppercase tracking-wider text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-ink-0)]"
            >
              <SkipForward className="h-3.5 w-3.5" /> Skip
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
