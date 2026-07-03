// ----------------------------------------------------------------------------
// DEPRECATED — removed per explicit bug report: this DOM/CSS overlay (a
// stack of absolutely-positioned gradient divs around the R3F canvas) was
// the likely source of the "visible translucent green square" behind the
// AI Core. The reactor is now built entirely inside the WebGL canvas (see
// AICore.tsx, TacticalGlobe.tsx, OrbitRings.tsx) so there is no DOM
// background box of any kind behind it — only rings, glow, particles, and
// holographic elements rendered as actual geometry. Left as an inert stub
// because this workspace doesn't allow file deletion.
// ----------------------------------------------------------------------------

export {};
