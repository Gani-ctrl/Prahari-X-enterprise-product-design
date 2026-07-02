import { useCallback, useEffect, useRef } from "react";
import { CinematicIntro } from "@/components/intro/CinematicIntro";
import { useIntroStore } from "@/store/introStore";
import LandingPage from "./LandingPage";

// Once the visitor has scrolled this fraction into the dissolve, the real
// site chrome (Navbar) is allowed to appear — a hair above 0 rather than
// exactly 0 so a stray sub-pixel scroll/resize event can't flicker it on.
const CHROME_REVEAL_THRESHOLD = 0.015;

// ----------------------------------------------------------------------------
// Wraps the cinematic intro around the EXISTING, unmodified LandingPage.
// LandingPage itself is untouched — this file is the only thing that
// changed in the routing (App.tsx now points "/" here instead of directly
// at LandingPage).
//
// Mechanism: a tall (220vh) wrapper holds a `sticky` full-viewport section.
// While that wrapper is in view, the sticky section stays pinned and the
// user's scroll only drives `dissolveProgressRef` (read every frame inside
// CinematicIntro via a rAF loop, not via React state — see the comment on
// that ref in CinematicIntro.tsx for why). Once the user scrolls past the
// wrapper's height, the sticky section releases
// naturally via normal CSS scroll behavior and LandingPage — already
// rendered directly beneath it in the DOM — comes into view. No route
// change, no reload, no manual scroll-hijacking: this is native browser
// scroll physics (and plays correctly with LandingPage's own Lenis smooth
// scroll, since Lenis here smooths the real document scroll rather than
// virtualizing it).
// ----------------------------------------------------------------------------

export default function IntroLandingPage() {
  const dissolveProgressRef = useRef(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Tracks whether site chrome is CURRENTLY shown — a live state mirror,
  // not a one-time latch. The intro must stay a fully immersive, chrome-free
  // fullscreen experience every time it's on screen, including if the
  // visitor scrolls back up to it after reaching the homepage, so this
  // flips both directions rather than only ever going from hidden -> shown
  // once.
  const chromeShown = useRef(false);

  // The intro owns site-chrome visibility for as long as it's on screen —
  // see introStore.ts and Navbar.tsx. Active the instant this page mounts,
  // released the moment the visitor scrolls past the reveal threshold, and
  // reset defensively on unmount. The scroll-position effect below takes
  // over from here every frame and re-hides it if the visitor scrolls back.
  useEffect(() => {
    useIntroStore.getState().setIntroActive(true);
    return () => useIntroStore.getState().setIntroActive(false);
  }, []);

  useEffect(() => {
    let rafId: number;
    function update() {
      const el = wrapperRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollable = el.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;
        const progress = scrollable > 0 ? Math.min(1, Math.max(0, scrolled / scrollable)) : 0;
        dissolveProgressRef.current = progress;
        // Bidirectional: whichever side of the threshold the visitor is on
        // right now wins, every frame — not just the first time they cross
        // it. Scrolling back up into the intro section re-hides the
        // navbar/site chrome exactly as it was hidden on first load.
        const shouldShowChrome = progress > CHROME_REVEAL_THRESHOLD;
        if (shouldShowChrome !== chromeShown.current) {
          chromeShown.current = shouldShowChrome;
          useIntroStore.getState().setIntroActive(!shouldShowChrome);
        }
      }
      rafId = requestAnimationFrame(update);
    }
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Skip must produce the exact same transition as manually scrolling to
  // the homepage, not a separate shortcut — so it physically scrolls the
  // real page past the intro wrapper. The scroll-position effect above
  // then picks up the new position on its next frame exactly as it would
  // from a manual scroll: dissolveProgressRef ramps to 1, the intro fades
  // out, and site chrome reveals itself once the threshold is crossed.
  const handleIntroSkip = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const scrollable = Math.max(0, el.offsetHeight - window.innerHeight);
    const wrapperDocTop = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: wrapperDocTop + scrollable + 8, behavior: "smooth" });
  }, []);

  return (
    <div className="relative bg-[color:var(--color-base)]">
      <div ref={wrapperRef} className="relative" style={{ height: "220vh" }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <CinematicIntro dissolveProgressRef={dissolveProgressRef} onSkip={handleIntroSkip} />
        </div>
      </div>
      <LandingPage />
    </div>
  );
}
