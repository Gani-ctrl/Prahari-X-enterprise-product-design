import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { gsap } from "gsap";
import { ChevronDown } from "lucide-react";
import { AI_COLORS, STATUS_BAR_TEXT, SUBTITLE, TAGLINE, TITLE } from "./aiIntroConfig";

// ----------------------------------------------------------------------------
// The cinematic title card: tagline, a bracket-flanked metallic "PRAHARI X"
// wordmark, subtitle, a small unit emblem, and a bottom status bar. The
// title doesn't just fade in — a GSAP timeline blurs it into focus, sweeps
// a metallic highlight across the letterforms, and throws one brief
// red/cyan RGB-split glitch pass, echoing the "digital interference"
// called out in the brief. Purely DOM/CSS + GSAP — no 3D text mesh.
// ----------------------------------------------------------------------------

interface TitleRevealProps {
  showTitle: boolean;
  showScrollHint: boolean;
}

function UnitEmblem() {
  return (
    <svg viewBox="0 0 120 70" className="h-9 w-16" role="img" aria-label="PRAHARI X unit emblem">
      <path d="M 60 14 L 18 24 Q 32 30 42 27 Q 28 36 16 36 Q 32 46 48 36 L 60 30" fill="none" stroke={AI_COLORS.glow400} strokeOpacity={0.55} strokeWidth={1.6} />
      <path d="M 60 14 L 102 24 Q 88 30 78 27 Q 92 36 104 36 Q 88 46 72 36 L 60 30" fill="none" stroke={AI_COLORS.glow400} strokeOpacity={0.55} strokeWidth={1.6} />
      <path d="M 60 18 L 74 25 L 72 44 Q 60 58 60 58 Q 60 58 48 44 L 46 25 Z" fill="rgba(23,199,102,0.08)" stroke={AI_COLORS.glow400} strokeOpacity={0.7} strokeWidth={1.6} />
    </svg>
  );
}

export function TitleReveal({ showTitle, showScrollHint }: TitleRevealProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bracketLeftRef = useRef<HTMLSpanElement>(null);
  const bracketRightRef = useRef<HTMLSpanElement>(null);
  const ghostRedRef = useRef<HTMLSpanElement>(null);
  const ghostCyanRef = useRef<HTMLSpanElement>(null);
  const played = useRef(false);

  useEffect(() => {
    if (!showTitle || played.current) return;
    played.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (titleRef.current) {
        tl.fromTo(titleRef.current, { opacity: 0, scale: 1.15, filter: "blur(18px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.9 }, 0);
        tl.fromTo(titleRef.current, { backgroundPosition: "-140% 0%" }, { backgroundPosition: "220% 0%", duration: 1.2, ease: "power2.inOut" }, 0.6);
      }
      if (bracketLeftRef.current && bracketRightRef.current) {
        tl.fromTo(bracketLeftRef.current, { opacity: 0, x: 12 }, { opacity: 0.8, x: 0, duration: 0.6 }, 0.15);
        tl.fromTo(bracketRightRef.current, { opacity: 0, x: -12 }, { opacity: 0.8, x: 0, duration: 0.6 }, 0.15);
      }
      if (ghostRedRef.current && ghostCyanRef.current) {
        tl.set([ghostRedRef.current, ghostCyanRef.current], { opacity: 1 }, 0.85)
          .to(ghostRedRef.current, { x: -3, duration: 0.05, repeat: 3, yoyo: true }, 0.85)
          .to(ghostCyanRef.current, { x: 3, duration: 0.05, repeat: 3, yoyo: true }, 0.85)
          .to([ghostRedRef.current, ghostCyanRef.current], { opacity: 0, x: 0, duration: 0.12 }, 1.05);
      }
    });

    return () => ctx.revert();
  }, [showTitle]);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-end pb-6 sm:pb-10">
      <AnimatePresence>
        {showTitle && (
          <motion.div
            className="relative flex flex-col items-center text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.p
              className="mono-tag mb-2 text-[10px] uppercase tracking-[0.4em] sm:text-xs"
              style={{ color: AI_COLORS.ink0 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              {TAGLINE}
            </motion.p>

            <div className="relative flex items-center gap-2 sm:gap-4">
              <span ref={bracketLeftRef} className="select-none text-3xl font-thin opacity-0 sm:text-5xl" style={{ color: AI_COLORS.glow400 }}>
                [
              </span>

              <div className="relative">
                <h1
                  ref={titleRef}
                  className="select-none bg-clip-text text-4xl font-black uppercase leading-none tracking-tight text-transparent opacity-0 sm:text-6xl md:text-7xl"
                  style={{
                    fontFamily: "'Arial Black', 'Segoe UI', var(--font-sans)",
                    backgroundImage:
                      "linear-gradient(110deg, #d9dde3 0%, #ffffff 14%, #9199a8 28%, #d9dde3 42%, #ffffff 56%, #8b93a1 70%, #d9dde3 84%, #ffffff 100%)",
                    backgroundSize: "260% 100%",
                    textShadow: "0 10px 30px rgba(0,0,0,0.7)",
                  }}
                >
                  {TITLE}
                </h1>
                <span
                  ref={ghostRedRef}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 select-none text-4xl font-black uppercase leading-none tracking-tight opacity-0 mix-blend-screen sm:text-6xl md:text-7xl"
                  style={{ fontFamily: "'Arial Black', 'Segoe UI', var(--font-sans)", color: "rgba(255,84,112,0.6)" }}
                >
                  {TITLE}
                </span>
                <span
                  ref={ghostCyanRef}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 select-none text-4xl font-black uppercase leading-none tracking-tight opacity-0 mix-blend-screen sm:text-6xl md:text-7xl"
                  style={{ fontFamily: "'Arial Black', 'Segoe UI', var(--font-sans)", color: "rgba(94,245,168,0.6)" }}
                >
                  {TITLE}
                </span>
              </div>

              <span ref={bracketRightRef} className="select-none text-3xl font-thin opacity-0 sm:text-5xl" style={{ color: AI_COLORS.glow400 }}>
                ]
              </span>
            </div>

            <motion.p
              className="mono-tag mt-3 text-[10px] uppercase sm:text-sm"
              style={{ color: AI_COLORS.ink2 }}
              initial={{ opacity: 0, letterSpacing: "0.05em", y: 6 }}
              animate={{ opacity: 1, letterSpacing: "0.35em", y: 0 }}
              transition={{ delay: 1.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {SUBTITLE}
            </motion.p>

            <motion.div className="mt-3" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.3, duration: 0.5 }}>
              <UnitEmblem />
            </motion.div>

            <motion.div
              className="mt-4 flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{ border: `1px solid ${AI_COLORS.glow700}`, background: "rgba(6, 12, 8, 0.6)" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <span className="mono-tag text-[10px] uppercase tracking-[0.2em]" style={{ color: AI_COLORS.glow400 }}>
                {">>"} {STATUS_BAR_TEXT}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScrollHint && (
          <motion.div
            className="pointer-events-none absolute bottom-2 flex flex-col items-center gap-1.5 sm:bottom-3"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="mono-tag text-[9px] uppercase tracking-[0.3em]" style={{ color: AI_COLORS.ink2 }}>
              Scroll to Enter
            </span>
            <motion.div animate={{ y: [0, 5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown className="h-4 w-4" style={{ color: AI_COLORS.glow400 }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
