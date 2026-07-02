import { create } from "zustand";

// ----------------------------------------------------------------------------
// Single source of truth for "is the cinematic intro still covering the
// screen." Navbar (the only `position: fixed` element on the landing page —
// everything else is in normal document flow and simply isn't scrolled into
// view yet) reads this to suppress itself entirely while the intro is
// active, so no site chrome renders on top of the cinematic regardless of
// scroll position. Defaults to false so Navbar behaves normally anywhere
// else it might ever be rendered; CinematicIntro is the only thing that
// ever sets this true.
// ----------------------------------------------------------------------------

interface IntroState {
  introActive: boolean;
  setIntroActive: (active: boolean) => void;
}

export const useIntroStore = create<IntroState>((set) => ({
  introActive: false,
  setIntroActive: (active) => set({ introActive: active }),
}));
