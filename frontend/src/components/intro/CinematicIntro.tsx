import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { gsap } from "gsap";
import { BootOverlay } from "./BootOverlay";
import { TitleReveal } from "./TitleReveal";
import { HUDOverlay } from "./HUDOverlay";
import { useIntroAudio } from "./useIntroAudio";
import { useDeviceTier } from "./useDeviceTier";
import { PHASE_DURATIONS_MS, PHASE_ORDER, REDUCED_MOTION_SKIP_MS, type IntroPhase } from "./introConfig";

// ----------------------------------------------------------------------------
// Orchestrator for the lightweight cinematic intro. Pure DOM/CSS + GSAP +
// Motion — no React Three Fiber, no WebGL, no GLTF assets. Owns the phase
// timeline (driven by a single GSAP timeline rather than a chain of
// setTimeouts), the mute toggle, and the scroll-driven dissolve into the
// real homepage underneath. Rendered by IntroLandingPage — see that file
// for how it's stacked above the existing, completely untouched
// LandingPage, and for the introStore wiring that hides the site Navbar
// while this component is on screen.
// ----------------------------------------------------------------------------

const AUTO_ADVANCE_PHASES = PHASE_ORDER.filter((p): p is Exclude<IntroPhase, "ready" | "dissolving"> => p !== "ready" && p !== "dissolving");

/** How much smoke should be visually "present" per phase — consumed by
 * SmokeLayer (via BootOverlay) to breathe the atmosphere in and settle it
 * back down rather than holding one static density throughout. */
const SMOKE_INTENSITY: Record<IntroPhase, number> = {
  void: 0.12,
  boot: 0.45,
  reveal: 1,
  title: 0.7,
  ready: 0.5,
  dissolving: 0.3,
};

interface CinematicIntroProps {
  /** 0..1 scroll-through progress of the pinned section, driven by the
   * parent's scroll listener (IntroLandingPage.tsx). A ref, not state:
   * this changes every scroll frame, and routing it through React state
   * would re-render this whole overlay tree at scroll frequency for no
   * reason — a rAF loop below reads it directly and writes to the DOM. */
  dissolveProgressRef: RefObject<number>;
  onReady?: () => void;
  /** Called after Skip has jumped the intro's own phase state to "ready".
   * The parent (IntroLandingPage.tsx) uses this to actually scroll the
   * window past the intro section, so Skip drives the exact same
   * scroll-based dissolve as manually scrolling rather than a separate
   * shortcut path. */
  onSkip?: () => void;
}

export function CinematicIntro({ dissolveProgressRef, onReady, onSkip }: CinematicIntroProps) {
  const { tier, prefersReducedMotion } = useDeviceTier();
  const { muted, toggleMuted, playBootBeep, attemptAutoplay, setDissolveGain } = useIntroAudio();

  const [phase, setPhase] = useState<IntroPhase>("void");
  const [bootStarted, setBootStarted] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const readyReported = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // --- Phase timeline: a single GSAP timeline calling setPhase at each
  // offset, instead of a chain of setTimeouts — GSAP owns the schedule, and
  // reverting the timeline on unmount/replay cancels every pending callback
  // in one call rather than tracking timer ids by hand.
  useEffect(() => {
    if (skipped) return;

    const stepMs = prefersReducedMotion || tier === "low" ? REDUCED_MOTION_SKIP_MS : undefined;
    const tl = gsap.timeline();
    let elapsedMs = 0;

    AUTO_ADVANCE_PHASES.forEach((p, i) => {
      const duration = stepMs ?? PHASE_DURATIONS_MS[p];
      const nextPhase = PHASE_ORDER[i + 1];
      elapsedMs += duration;
      if (nextPhase) {
        tl.call(() => setPhase(nextPhase), [], elapsedMs / 1000);
      }
    });

    // Kick "boot" telemetry text on shortly after "void" starts.
    tl.call(() => setBootStarted(true), [], ((stepMs ?? PHASE_DURATIONS_MS.void) + 100) / 1000);

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipped, prefersReducedMotion, tier]);

  useEffect(() => {
    if (phase === "ready" && !readyReported.current) {
      readyReported.current = true;
      onReady?.();
    }
  }, [phase, onReady]);

  const handleSkip = useCallback(() => {
    setSkipped(true);
    setBootStarted(true);
    setPhase("ready");
    // Let the parent physically scroll past the intro wrapper — the
    // existing scroll-driven dissolve (below) then takes over exactly as
    // it would from a manual scroll, so Skip doesn't need its own visual
    // transition or its own "completed" flag.
    onSkip?.();
  }, [onSkip]);

  // Cinematic score: attempt to start on mount (browsers only allow this to
  // actually become audible once a real user gesture resumes the
  // AudioContext — attemptAutoplay is safe to call again from that first
  // gesture, see useIntroAudio.ts), with a one-time fallback on the
  // visitor's first pointer/keyboard/touch interaction so playback starts
  // the moment it's technically allowed to, without requiring a click on
  // the mute button specifically.
  useEffect(() => {
    attemptAutoplay();
    function onFirstInteraction() {
      attemptAutoplay();
    }
    window.addEventListener("pointerdown", onFirstInteraction, { once: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true });
    window.addEventListener("touchstart", onFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("touchstart", onFirstInteraction);
    };
  }, [attemptAutoplay]);

  // --- Scroll-driven dissolve: once the visitor starts scrolling past
  // "ready", fade + blur + scale the entire intro root out so the real
  // homepage (already rendered directly beneath it — see
  // IntroLandingPage.tsx) reads through smoothly, and fade the cinematic
  // score out in step with it (setDissolveGain) so the music fades
  // smoothly as the homepage takes over rather than cutting off abruptly
  // or playing on underneath it. Direct style mutation via rAF, not React
  // state, for the same reason dissolveProgressRef itself is a ref: this
  // needs to update every scroll frame without triggering a re-render of
  // the whole overlay tree. Symmetric in both directions — scrolling back
  // up from the homepage into the intro brings the score back in exactly
  // as it fades out going forward. The scroll position driving this ref is
  // itself smoothed by Lenis (see LandingPage.tsx's useLenis()), which is
  // what satisfies the "GSAP and Lenis" transition requirement — there's
  // no separate smoothing layer to add on top of it.
  useEffect(() => {
    let rafId: number;
    function tick() {
      const el = rootRef.current;
      const progress = dissolveProgressRef.current ?? 0;
      if (el) {
        el.style.opacity = String(Math.max(0, 1 - progress * 1.3));
        el.style.filter = `blur(${progress * 6}px)`;
        el.style.transform = `scale(${1 + progress * 0.06})`;
        el.style.pointerEvents = progress > 0.02 ? "none" : "auto";
      }
      setDissolveGain(1 - progress);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [dissolveProgressRef, setDissolveGain]);

  const showBoot = phase === "void" || phase === "boot" || phase === "reveal";
  const showTitle = phase === "title" || phase === "ready" || phase === "dissolving";
  const showScrollHint = phase === "ready" || phase === "dissolving";
  const showHud = phase === "ready" || phase === "dissolving";

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden bg-[color:var(--color-base)]">
      <BootOverlay active={showBoot} bootStarted={bootStarted} smokeIntensity={SMOKE_INTENSITY[phase]} tier={tier} onBeep={playBootBeep} />
      <TitleReveal showTitle={showTitle} showScrollHint={showScrollHint} />
      <HUDOverlay visible={showHud} muted={muted} onToggleMute={toggleMuted} onSkip={handleSkip} />
    </div>
  );
}
