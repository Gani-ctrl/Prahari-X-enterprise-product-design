import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AI_COLORS, BOOT_HEADER, BOOT_LINES } from "./aiIntroConfig";

// ----------------------------------------------------------------------------
// The left-column military boot terminal: real character-by-character
// typing (not a stagger-fade of whole lines), a blinking cursor on whatever
// line is currently typing, and a "[ OK ]" tag that fades in once a line
// finishes — each line only starts once the previous one completes, so the
// whole block reads as a real console executing commands in sequence rather
// than a canned animation. A CRT flicker + scanline sweep sit on top of the
// whole panel as atmosphere.
// ----------------------------------------------------------------------------

interface BootLineRowProps {
  text: string;
  tone?: "default" | "danger";
  active: boolean;
  onDone: () => void;
  onChar?: () => void;
}

function BootLineRow({ text, tone, active, onDone, onChar }: BootLineRowProps) {
  const [count, setCount] = useState(0);
  const firedDone = useRef(false);

  useEffect(() => {
    if (!active || count >= text.length) return;
    const t = setTimeout(
      () => {
        setCount((c) => c + 1);
        onChar?.();
      },
      18 + Math.random() * 22
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, count, text]);

  useEffect(() => {
    if (active && count >= text.length && !firedDone.current) {
      firedDone.current = true;
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, count, text.length]);

  const done = count >= text.length;

  return (
    <div className="mono-tag flex items-baseline justify-between gap-3 text-[11px] leading-relaxed sm:text-[12px]">
      <span style={{ color: AI_COLORS.glow300 }}>
        {">> "}
        <span style={{ color: tone === "danger" ? AI_COLORS.danger400 : AI_COLORS.ink0 }}>{text.slice(0, count)}</span>
        {active && !done && <span className="ai-cursor-blink inline-block h-3 w-[7px] translate-y-[1px] align-middle" style={{ backgroundColor: AI_COLORS.glow400 }} />}
      </span>
      <AnimatePresence>
        {done && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: 0.3 }}
            className="shrink-0 text-[10px]"
            style={{ color: AI_COLORS.glow500 }}
          >
            [ OK ]
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

interface BootTerminalProps {
  active: boolean;
  bootStarted: boolean;
  onChar?: () => void;
}

export function BootTerminal({ active, bootStarted, onChar }: BootTerminalProps) {
  const [unlocked, setUnlocked] = useState(0);

  useEffect(() => {
    if (!bootStarted) setUnlocked(0);
  }, [bootStarted]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="hud-card glass ai-crt-flicker pointer-events-auto w-[min(84vw,360px)] overflow-hidden rounded-[var(--radius-md)] p-4"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <style>{`
            @keyframes ai-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
            @keyframes ai-crt-flicker { 0%, 94%, 100% { opacity: 1; } 95% { opacity: 0.85; } 96% { opacity: 1; } 97% { opacity: 0.9; } }
            @keyframes ai-scan-sweep { 0% { transform: translateY(-100%); } 100% { transform: translateY(600%); } }
            .ai-cursor-blink { animation: ai-blink 1s step-end infinite; }
            .ai-crt-flicker { animation: ai-crt-flicker 6s linear infinite; }
          `}</style>

          {/* Scanline sweep, clipped to this panel only. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-10 opacity-[0.12]"
            style={{ background: `linear-gradient(to bottom, transparent, ${AI_COLORS.glow400}, transparent)`, animation: "ai-scan-sweep 3.6s linear infinite" }}
          />

          <div className="mb-3 flex items-center justify-between">
            <p className="mono-tag text-xs uppercase tracking-[0.15em]">
              <span style={{ color: AI_COLORS.glow400 }}>{BOOT_HEADER.eyebrow}</span>{" "}
              <span style={{ color: AI_COLORS.ink2 }}>// {BOOT_HEADER.label}</span>
            </p>
            <span className="mono-tag text-xs" style={{ color: AI_COLORS.ink3 }}>
              ×
            </span>
          </div>

          <div className="space-y-1.5">
            {BOOT_LINES.map((line, i) => {
              if (!bootStarted || i > unlocked) return null;
              return (
                <BootLineRow
                  key={line.text}
                  text={line.text}
                  tone={line.tone}
                  active={i === unlocked}
                  onChar={onChar}
                  onDone={() => setUnlocked((u) => Math.min(BOOT_LINES.length - 1, u + 1))}
                />
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
