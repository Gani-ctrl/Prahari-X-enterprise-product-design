// ----------------------------------------------------------------------------
// Every static/CSS-only piece of atmosphere layered around the AI Core:
// base dark wash + green holographic ambient glow, vignette, a moving
// scanline sweep, a faint tactical grid, film grain, and a subtle
// chromatic-aberration edge tint (red/cyan fringing near the corners via
// mix-blend-mode — a lightweight CSS approximation rather than a true
// per-channel canvas/WebGL post-process, appropriate for a decorative edge
// effect that never needs to move with any specific on-screen element).
// ----------------------------------------------------------------------------

export function AtmosphereOverlays() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base wash */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 42%, #060a07 0%, #030402 55%, #010201 85%)" }} />

      {/* Green holographic ambient glow, seated behind the core. */}
      <div
        className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "radial-gradient(closest-side, rgba(46, 234, 130, 0.12) 0%, rgba(23, 199, 102, 0.04) 55%, transparent 78%)" }}
      />

      {/* Faint tactical grid for HUD-density texture. */}
      <div className="bg-grid absolute inset-0 opacity-[0.045]" />

      {/* Scanline texture, always present. */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, rgba(180,255,210,0.6) 0px, rgba(180,255,210,0.6) 1px, transparent 1px, transparent 3px)",
        }}
      />

      {/* Moving scan sweep. */}
      <div
        className="absolute inset-x-0 h-32 opacity-[0.05]"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(94,245,168,0.9), transparent)",
          animation: "ai-atmo-scan 5.5s linear infinite",
        }}
      />
      <style>{`
        @keyframes ai-atmo-scan { 0% { transform: translateY(-15%); } 100% { transform: translateY(115%); } }
      `}</style>

      {/* Subtle chromatic-aberration edge fringing. */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background:
            "radial-gradient(140% 140% at 8% 8%, rgba(255,60,90,0.05) 0%, transparent 30%), radial-gradient(140% 140% at 92% 92%, rgba(60,220,255,0.05) 0%, transparent 30%)",
        }}
      />

      {/* Vignette. */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(62% 68% at 50% 46%, transparent 45%, rgba(0,0,0,0.55) 82%, rgba(0,0,0,0.88) 100%)" }}
      />

      {/* Film grain. */}
      <div className="bg-noise absolute inset-0" />
    </div>
  );
}
