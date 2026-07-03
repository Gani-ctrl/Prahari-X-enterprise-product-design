import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Lock } from "lucide-react";
import { AI_COLORS, ENCRYPTION_PROGRESS_LABEL } from "./aiIntroConfig";

// ----------------------------------------------------------------------------
// Bottom-left encryption progress bar: a padlock icon, label, an animated
// fill bar counting up to 100%, and the live percentage readout — the same
// "live process, not a static label" trick used elsewhere in this intro.
// ----------------------------------------------------------------------------

interface EncryptionProgressProps {
  active: boolean;
}

export function EncryptionProgress({ active }: EncryptionProgressProps) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!active) {
      setPct(0);
      return;
    }
    let raf: number;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / 2200);
      const eased = 1 - Math.pow(1 - t, 2);
      setPct(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="hud-card glass pointer-events-auto w-[min(84vw,360px)] rounded-[var(--radius-md)] p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(46, 234, 130, 0.08)" }}>
              <Lock className="h-4 w-4" style={{ color: AI_COLORS.glow400 }} />
            </div>
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="mono-tag text-[10px] uppercase tracking-widest" style={{ color: AI_COLORS.ink2 }}>
                  {ENCRYPTION_PROGRESS_LABEL}
                </p>
                <p className="mono-tag text-xs font-semibold" style={{ color: AI_COLORS.glow400 }}>
                  {pct}%
                </p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface-3)" }}>
                <motion.div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: AI_COLORS.glow500 }} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
