// ----------------------------------------------------------------------------
// DEPRECATED — no longer used.
//
// The cinematic intro was rebuilt as a lightweight DOM/CSS + GSAP + Motion
// sequence (see components/intro/CinematicIntro.tsx) instead of a React
// Three Fiber scene, specifically to remove Three.js/WebGL from the build
// entirely and eliminate the complexity/instability that came with it.
//
// This file (and the rest of components/intro/scene/) is no longer imported
// anywhere in the app — nothing in this directory is reachable from any
// entry point, so none of it is part of the production bundle. It's left in
// place only because this workspace doesn't allow file deletion; treat this
// directory as dead code.
// ----------------------------------------------------------------------------

export {};
