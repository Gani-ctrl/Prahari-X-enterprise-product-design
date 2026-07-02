import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { gsap } from "gsap";
import { ChevronDown } from "lucide-react";
import { AOI_SUBTITLE, AOI_TAGLINE, AOI_TITLE } from "./introConfig";

// ----------------------------------------------------------------------------
// Title materialization (phase "title") + the persistent scroll-to-enter
// affordance (phase "ready"). Deliberately NOT a simple fade/scale: a GSAP
// timeline parts two soft smoke blobs away from center, brings up rotating
// light rays behind the type, sweeps a metallic sheen across the title text,
// throws a brief red/cyan chromatic-glitch duplicate of the letters, and
// only then settles the HUD brackets and subtitle into place. Everything
// here is DOM/CSS + GSAP + Motion — no 3D text mesh, no WebGL.
// ----------------------------------------------------------------------------

interface TitleRevealProps {
  showTitle: boolean;
  showScrollHint: boolean;
}

export function TitleReveal({ showTitle, showScrollHint }: TitleRevealProps) {
  const smokeLeftRef = useRef<HTMLDivElement>(null);
  const smokeRightRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ghostRedRef = useRef<HTMLSpanElement>(null);
  const ghostCyanRef = useRef<HTMLSpanElement>(null);
  const played = useRef(false);

  useEffect(() => {
    if (!showTitle || played.current) return;
    played.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1. Two smoke blobs, initially overlapping dead-center, part to the
      // sides — the title is revealed "through" the parting smoke rather
      // than appearing over a static backdrop.
      if (smokeLeftRef.current && smokeRightRef.current) {
        gsap.set([smokeLeftRef.current, smokeRightRef.current], { opacity: 0.85, x: 0 });
        tl.to(smokeLeftRef.current, { x: -220, opacity: 0.15, duration: 1.4 }, 0);
        tl.to(smokeRightRef.current, { x: 220, opacity: 0.15, duration: 1.4 }, 0);
      }

      // 2. Light rays fade/scale up behind the type, then keep a slow
      // idle rotation (handled separately below, outside the timeline).
      if (raysRef.current) {
        tl.fromTo(raysRef.current, { opacity: 0, scale: 0.7 }, { opacity: 0.5, scale: 1, duration: 1.1 }, 0.2);
      }

      // 3. Title itself: blur/scale settle...
      if (titleRef.current) {
        tl.fromTo(
          titleRef.current,
          { opacity: 0, scale: 1.2, filter: "blur(22px)" },
          { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.0 },
          0.3
        );
        // ...then a metallic sheen sweep across the text via
        // background-position, purely a CSS gradient animation.
        tl.fromTo(titleRef.current, { backgroundPosition: "-120% 0%" }, { backgroundPosition: "220% 0%", duration: 1.3, ease: "power2.inOut" }, 0.9);
      }

      // 4. Brief chromatic-glitch pass: red/cyan duplicate letterforms
      // punch out to either side for a couple of frames, classic RGB-split
      // glitch, then snap back.
      if (ghostRedRef.current && ghostCyanRef.current) {
        tl.set([ghostRedRef.current, ghostCyanRef.current], { opacity: 1 }, 1.15)
          .to(ghostRedRef.current, { x: -4, duration: 0.06, repeat: 3, yoyo: true }, 1.15)
          .to(ghostCyanRef.current, { x: 4, duration: 0.06, repeat: 3, yoyo: true }, 1.15)
          .to([ghostRedRef.current, ghostCyanRef.current], { opacity: 0, x: 0, duration: 0.15 }, 1.4);
      }
    });

    return () => ctx.revert();
  }, [showTitle]);

  // Slow continuous ray rotation, independent of the reveal timeline above.
  useEffect(() => {
    if (!raysRef.current) return;
    const anim = gsap.to(raysRef.current, { rotate: 360, duration: 40, ease: "linear", repeat: -1 });
    return () => {
      anim.kill();
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center">
      <AnimatePresence>
        {showTitle && (
          <motion.div
            className="relative flex flex-col items-center text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Parting smoke, centered behind the title */}
            <div
              ref={smokeLeftRef}
              className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
              style={{ background: "radial-gradient(circle, rgba(57,160,110,0.5) 0%, transparent 70%)", filter: "blur(40px)" }}
            />
            <div
              ref={smokeRightRef}
              className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
              style={{ background: "radial-gradient(circle, rgba(124,138,163,0.4) 0%, transparent 70%)", filter: "blur(40px)" }}
            />

            {/* Rotating light rays, conic gradient */}
            <div
              ref={raysRef}
              className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-0"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, rgba(92,185,140,0.18) 8deg, transparent 20deg, transparent 160deg, rgba(92,185,140,0.14) 168deg, transparent 180deg, transparent 340deg, rgba(92,185,140,0.16) 350deg, transparent 360deg)",
              }}
            />

            <motion.p
              className="mono-tag relative mb-3 text-[11px] uppercase tracking-[0.35em] text-[color:var(--color-sentinel-400)]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              {AOI_TAGLINE}
            </motion.p>

            <div className="relative">
              {/* HUD projection brackets */}
              <span className="absolute -left-4 -top-3 h-4 w-4 border-l-2 border-t-2 border-[color:var(--color-sentinel-500)]/60 sm:-left-6 sm:-top-4" />
              <span className="absolute -bottom-3 -right-4 h-4 w-4 border-b-2 border-r-2 border-[color:var(--color-sentinel-500)]/60 sm:-bottom-4 sm:-right-6" />

              <h1
                ref={titleRef}
                className="select-none bg-clip-text text-5xl font-bold uppercase tracking-tight text-transparent opacity-0 sm:text-7xl md:text-8xl"
                style={{
                  fontFamily: "var(--font-sans)",
                  backgroundImage:
                    "linear-gradient(110deg, #b7dbc4 0%, #f4f6fb 12%, #5cb98c 24%, #b7dbc4 36%, #f4f6fb 48%, #39a06e 60%, #b7dbc4 72%, #f4f6fb 84%, #5cb98c 100%)",
                  backgroundSize: "260% 100%",
                }}
              >
                {AOI_TITLE}
              </h1>

              {/* Chromatic-glitch ghost duplicates */}
              <span
                ref={ghostRedRef}
                aria-hidden
                className="pointer-events-none absolute inset-0 select-none text-5xl font-bold uppercase tracking-tight opacity-0 mix-blend-screen sm:text-7xl md:text-8xl"
                style={{ fontFamily: "var(--font-sans)", color: "rgba(255,84,112,0.65)" }}
              >
                {AOI_TITLE}
              </span>
              <span
                ref={ghostCyanRef}
                aria-hidden
                className="pointer-events-none absolute inset-0 select-none text-5xl font-bold uppercase tracking-tight opacity-0 mix-blend-screen sm:text-7xl md:text-8xl"
                style={{ fontFamily: "var(--font-sans)", color: "rgba(92,185,140,0.65)" }}
              >
                {AOI_TITLE}
              </span>
            </div>

            <motion.p
              className="mono-tag mt-4 text-xs uppercase text-[color:var(--color-ink-2)] sm:text-sm"
              initial={{ opacity: 0, letterSpacing: "0.02em", y: 8 }}
              animate={{ opacity: 1, letterSpacing: "0.3em", y: 0 }}
              transition={{ delay: 1.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {AOI_SUBTITLE}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScrollHint && (
          <motion.div
            className="pointer-events-none absolute bottom-8 flex flex-col items-center gap-2 sm:bottom-12"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="mono-tag text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-ink-2)]">Scroll to Enter</span>
            <motion.div animate={{ y: [0, 6, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown className="h-5 w-5 text-[color:var(--color-sentinel-400)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
