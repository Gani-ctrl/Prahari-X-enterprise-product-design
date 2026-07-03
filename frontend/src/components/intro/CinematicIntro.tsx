import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { gsap } from "gsap";
import { AtmosphereCanvas } from "./AtmosphereCanvas";
import { AtmosphereOverlays } from "./AtmosphereOverlays";
import { CoreStage } from "./core/CoreStage";
import { BootTerminal } from "./BootTerminal";
import { NodeWidget } from "./NodeWidget";
import { EncryptionProgress } from "./EncryptionProgress";
import { MissionStatusPanel, SystemHealthPanel, SignalStrengthPanel, SystemCheckPanel } from "./HUDStack";
import { TitleReveal } from "./TitleReveal";
import { useIntroAudio } from "./useIntroAudio";
import { useDeviceTier } from "./useDeviceTier";
import { useCursorParallax } from "./useCursorParallax";
import { PHASE_DURATIONS_MS, PHASE_ORDER, REDUCED_MOTION_SKIP_MS, type IntroPhase } from "./aiIntroConfig";
import { Volume2, VolumeX, SkipForward } from "lucide-react";

// ----------------------------------------------------------------------------
// Orchestrator for the cinematic intro — AI Intelligence Core edition. Full
// creative pivot from the previous soldier-hero concept: no character, no
// weapon, no battlefield anywhere in this subsystem. The hero is now an
// abstract AI Core (CoreStage), framed by a military boot terminal (left),
// a stacked tactical HUD (right), and a cinematic metallic title reveal
// (bottom) — all DOM/CSS/SVG + a single Canvas2D particle layer, no
// WebGL/React Three Fiber.
//
// The phase timeline (GSAP-driven, ~6.2s auto-advance from "void" through
// "title"), the mute toggle, and the scroll-driven dissolve into the real
// homepage underneath are unchanged infrastructure carried over from the
// previous intro — this pivot only replaces what's rendered inside each
// phase, not how phases are scheduled or how the page transitions out.
// Rendered by IntroLandingPage — see that file for how it's stacked above
// the existing, completely untouched LandingPage, and for the introStore
// wiring that hides the site Navbar while this component is on screen.
// ----------------------------------------------------------------------------

const AUTO_ADVANCE_PHASES = PHASE_ORDER.filter((p): p is Exclude<IntroPhase, "ready" | "dissolving"> => p !== "ready" && p !== "dissolving");

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

  // Cursor parallax is always live — it just writes CSS custom properties
  // that AICore/HUD elements opt into reading, so there's nothing to gate
  // on phase (an unrendered element simply never reads the variables).
  useCursorParallax(rootRef, !prefersReducedMotion);

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

    // Kick the boot terminal typing shortly after "void" starts.
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
  // as it fades out going forward.
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

  const showAtmosphere = phase !== "void";
  const showCore = phase === "assemble" || phase === "hud" || phase === "title" || phase === "ready" || phase === "dissolving";
  const coreLabelsVisible = phase === "hud" || phase === "title" || phase === "ready" || phase === "dissolving";
  const showTerminal = phase !== "void";
  const showEncryption = phase === "assemble" || phase === "hud" || phase === "title" || phase === "ready" || phase === "dissolving";
  const showHudStack = phase === "hud" || phase === "title" || phase === "ready" || phase === "dissolving";
  const showTitle = phase === "title" || phase === "ready" || phase === "dissolving";
  const showScrollHint = phase === "ready" || phase === "dissolving";
  const showControls = phase === "ready" || phase === "dissolving";

  // Whole-HUD mouse tilt: reads the --px/--py custom properties
  // useCursorParallax writes on rootRef and applies a subtle perspective
  // rotate. Deliberately applied via TWO separate wrapper divs (one before
  // the AI Core, one after) rather than a single wrapper around
  // everything — the AI Core sits between them, untouched by this
  // transform, so cursor movement can never rotate/displace the reactor
  // itself while every other layer (atmosphere, boot terminal, HUD stack,
  // title) keeps tilting exactly as before.
  const tiltStyle: CSSProperties = {
    transform: "perspective(1400px) rotateX(calc(var(--py, 0) * -6deg)) rotateY(calc(var(--px, 0) * 8deg))",
    transformStyle: "preserve-3d",
    willChange: "transform",
  };

  return (
    <div ref={rootRef} className="absolute inset-0 h-full w-full overflow-hidden bg-black">
      <div className="absolute inset-0 h-full w-full" style={tiltStyle}>
        {/* Pure black void with a single blinking cursor — nothing else is on
            screen until the boot terminal starts. */}
        {phase === "void" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="ai-void-cursor h-6 w-3" style={{ backgroundColor: "#2eea82" }} />
            <style>{`
              @keyframes ai-void-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
              .ai-void-cursor { animation: ai-void-blink 1s step-end infinite; }
            `}</style>
          </div>
        )}

        <div style={{ opacity: showAtmosphere ? 1 : 0, transition: "opacity 1.4s ease" }}>
          <AtmosphereOverlays />
          <AtmosphereCanvas tier={tier} />
        </div>
      </div>

      {/* AI Core: intentionally NOT inside either tilted wrapper above/below.
          Cursor interaction must never move or rotate the reactor as a
          whole — only its own internal rings/globe animate (see
          core/TacticalGlobe.tsx, core/OrbitRings.tsx) — so it's rendered
          here as a plain, always-centered sibling instead. It still paints
          in the same stacking position as before (after the atmosphere,
          before the HUD columns/title), just without inheriting their
          tilt. */}
      {showCore && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            animation: "ai-core-assemble 1.1s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <style>{`
            @keyframes ai-core-assemble {
              0% { opacity: 0; transform: scale(0.72) rotate(-8deg); }
              100% { opacity: 1; transform: scale(1) rotate(0deg); }
            }
          `}</style>
          <CoreStage labelsVisible={coreLabelsVisible} />
        </div>
      )}

      <div className="absolute inset-0 h-full w-full" style={tiltStyle}>
        {/* Left column: boot terminal + classified node widget, encryption
            progress pinned to the bottom — one flex column so nothing needs
            hand-tuned pixel offsets to stack correctly. */}
        <div className="absolute inset-x-4 top-4 bottom-4 flex flex-col justify-between sm:inset-x-8 sm:top-8 sm:bottom-8">
          <div className="flex flex-col items-start gap-4">
            <BootTerminal active={showTerminal} bootStarted={bootStarted} onChar={playBootBeep} />
            <NodeWidget active={showTerminal && bootStarted} />
          </div>
          <div>
            <EncryptionProgress active={showEncryption} />
          </div>
        </div>

        {/* Right column: stacked tactical HUD, distributed top-to-bottom. */}
        <div className="absolute right-4 top-4 bottom-20 flex flex-col items-end justify-between sm:right-8 sm:top-8 sm:bottom-24">
          <MissionStatusPanel active={showHudStack} delay={0} />
          <SystemHealthPanel active={showHudStack} delay={0.15} />
          <SignalStrengthPanel active={showHudStack} delay={0.3} />
          <SystemCheckPanel active={showHudStack} delay={0.45} />
        </div>

        <TitleReveal showTitle={showTitle} showScrollHint={showScrollHint} />

        {/* Mute + Skip — always in the same corner, only surfaced once the
            auto-sequence reaches "ready", matching the previous intro's
            control-reveal timing exactly. */}
        {showControls && (
          <div className="pointer-events-auto absolute bottom-4 right-4 flex items-center gap-2 sm:bottom-6 sm:right-8">
            <button
              type="button"
              onClick={toggleMuted}
              className="glass flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-ink-0)]"
              aria-label={muted ? "Unmute intro audio" : "Mute intro audio"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="glass mono-tag flex h-9 items-center gap-1.5 rounded-full px-3 text-[11px] uppercase tracking-wider text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-ink-0)]"
            >
              <SkipForward className="h-3.5 w-3.5" /> Skip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
