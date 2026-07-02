import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BOOT_LINES, HEX_PREFIXES, QUALITY_TIERS } from "./introConfig";
import { SmokeLayer } from "./SmokeLayer";
import { RadarSweep } from "./RadarSweep";
import type { QualityTier } from "./useDeviceTier";

// ----------------------------------------------------------------------------
// The full atmosphere layer for phases "void" / "boot" / "reveal": layered
// CSS smoke, scanlines, a faint tactical grid, floating dust, a corner radar
// sweep, hex/coordinate readouts, and the classified telemetry boot text —
// all DOM/CSS + Motion, no canvas or WebGL anywhere in this file.
// ----------------------------------------------------------------------------

interface BootOverlayProps {
  active: boolean; // true during "void" + "boot" + "reveal"
  bootStarted: boolean; // true once "boot" begins (telemetry starts typing)
  smokeIntensity: number; // 0 (void) .. 1 (reveal) — passed straight to SmokeLayer
  tier: QualityTier;
  onBeep?: () => void;
}

function GlitchLine({ text, delay, onType }: { text: string; delay: number; onType?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      onType?.();
      if (Math.random() < 0.35) {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 120 + Math.random() * 160);
      }
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay]);

  if (!visible) return null;

  return (
    <div
      className="mono-tag text-[11px] leading-5 text-[color:var(--color-sentinel-400)] sm:text-xs"
      style={{
        opacity: glitching ? 0.4 : 0.85,
        transform: glitching ? `translateX(${Math.random() > 0.5 ? 2 : -2}px)` : "none",
        textShadow: glitching ? "1px 0 rgba(255,84,112,0.6), -1px 0 rgba(92,185,140,0.6)" : "none",
      }}
    >
      {text}
    </div>
  );
}

function DustMotes() {
  const motes = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 1 + Math.random() * 2,
        duration: 8 + Math.random() * 10,
        delay: Math.random() * 6,
        opacity: 0.15 + Math.random() * 0.25,
        key: i,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {motes.map((m) => (
        <motion.span
          key={m.key}
          className="absolute rounded-full bg-[color:var(--color-ink-1)]"
          style={{ left: m.left, top: m.top, width: m.size, height: m.size, opacity: m.opacity }}
          animate={{ y: [0, -18, 0], x: [0, 6, 0], opacity: [0, m.opacity, 0] }}
          transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function randomHex(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 16).toString(16).toUpperCase();
  return s;
}

/** A vertical column of scrolling hex/coordinate flavor text — pure set
 * dressing, regenerated once per mount. */
function HexColumn({ delay }: { delay: number }) {
  const rows = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => `${HEX_PREFIXES[i % HEX_PREFIXES.length]}${randomHex(4)}`),
    []
  );
  return (
    <motion.div
      className="mono-tag hidden select-none flex-col gap-1 text-[9px] leading-tight text-[color:var(--color-sentinel-500)] lg:flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.45 }}
      transition={{ delay, duration: 1.2 }}
    >
      {rows.map((r, i) => (
        <span key={i}>{r}</span>
      ))}
    </motion.div>
  );
}

export function BootOverlay({ active, bootStarted, smokeIntensity, tier, onBeep }: BootOverlayProps) {
  const budget = QUALITY_TIERS[tier];

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden bg-[color:var(--color-base)]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        >
          <SmokeLayer blobCount={budget.smokeBlobs} emberCount={budget.embers} intensity={smokeIntensity} />
          <DustMotes />

          {/* Scan sweep */}
          <motion.div
            className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-[color:var(--color-sentinel-500)]/[0.05] to-transparent"
            animate={{ y: ["-10%", "110%"] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
          />

          {/* Static tactical grid + film-grain texture, very faint */}
          <div className="bg-grid absolute inset-0 opacity-[0.04]" />
          <div className="bg-noise absolute inset-0" />

          {budget.hexColumns > 0 && (
            <div className="absolute right-6 top-24 flex gap-6 sm:right-10">
              {Array.from({ length: budget.hexColumns }).map((_, i) => (
                <HexColumn key={i} delay={0.6 + i * 0.3} />
              ))}
            </div>
          )}

          {bootStarted && budget.hexColumns > 0 && (
            <motion.div
              className="absolute right-6 top-4 sm:right-10"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 0.8, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <RadarSweep size={104} />
            </motion.div>
          )}

          {bootStarted && (
            <div className="absolute left-4 top-4 max-w-[80vw] space-y-0.5 sm:left-8 sm:top-8 sm:max-w-sm">
              {BOOT_LINES.map((line, i) => (
                <GlitchLine key={line + i} text={line} delay={i * 220} onType={onBeep} />
              ))}
            </div>
          )}

          {bootStarted && (
            <div className="absolute bottom-6 right-4 sm:bottom-10 sm:right-8">
              <div className="mono-tag text-right text-[10px] uppercase tracking-widest text-[color:var(--color-ink-3)]">
                classified // eyes only
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
