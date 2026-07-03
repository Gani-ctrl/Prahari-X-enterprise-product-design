import { useEffect, useRef } from "react";
import { PARTICLE_TIERS } from "./aiIntroConfig";
import type { QualityTier } from "./useDeviceTier";

// ----------------------------------------------------------------------------
// Floating dust/ember particles as a single full-screen Canvas2D layer — a
// plain rAF loop mutating a typed particle array and redrawing each frame,
// no React state involved (a re-render per particle-frame would be
// disastrous for perf). Device tier controls particle count and drift
// speed so this stays cheap on low-power hardware. This is the one place
// in the intro that uses <canvas>, matching the "Canvas for particles, SVG
// for HUD graphics" split.
// ----------------------------------------------------------------------------

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  o: number;
}

interface AtmosphereCanvasProps {
  tier: QualityTier;
}

export function AtmosphereCanvas({ tier }: AtmosphereCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const budget = PARTICLE_TIERS[tier];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: Particle[] = [];
    let rafId = 0;

    function resize() {
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
    }

    function seed() {
      particles = Array.from({ length: budget.count }).map(() => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * 0.06 * budget.speed * dpr,
        vy: (-0.03 - Math.random() * 0.08) * budget.speed * dpr,
        r: (0.5 + Math.random() * 1.5) * dpr,
        o: 0.12 + Math.random() * 0.3,
      }));
    }

    resize();
    seed();
    window.addEventListener("resize", resize);

    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -8) {
          p.y = canvas!.height + 8;
          p.x = Math.random() * canvas!.width;
        }
        if (p.x < -8) p.x = canvas!.width + 8;
        if (p.x > canvas!.width + 8) p.x = -8;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(94, 245, 168, ${p.o})`;
        ctx!.fill();
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [tier]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}
