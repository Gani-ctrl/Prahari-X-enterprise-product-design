import { useEffect, type RefObject } from "react";

// ----------------------------------------------------------------------------
// Cursor-driven parallax for the AI Core + HUD, without a single React
// re-render: a pointermove listener tracks a target (-1..1 normalized)
// position, and a persistent rAF loop lerps the current value toward that
// target every frame (never snaps) and writes the result onto the root
// element as CSS custom properties (`--px`, `--py`). Because custom
// properties inherit down the DOM tree, every descendant can reference
// `var(--px)` / `var(--py)` in its own inline `transform`/`rotate` without
// this hook needing to know what those descendants are — no prop drilling,
// no state, no re-render, just GPU-accelerated transforms recomputed by the
// browser's own style engine each paint.
// ----------------------------------------------------------------------------

export function useCursorParallax(rootRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !enabled) return;

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let rafId = 0;

    function onMove(e: PointerEvent) {
      // Normalize to -1..1 around the viewport center.
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
    }

    function onLeave() {
      targetX = 0;
      targetY = 0;
    }

    function tick() {
      // Fixed easing factor rather than a physical spring — plenty smooth
      // for a subtle parallax accent, and cheaper per-frame than
      // integrating velocity/acceleration for every consumer.
      const ease = 0.055;
      curX += (targetX - curX) * ease;
      curY += (targetY - curY) * ease;
      el!.style.setProperty("--px", curX.toFixed(4));
      el!.style.setProperty("--py", curY.toFixed(4));
      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(rafId);
    };
  }, [rootRef, enabled]);
}
