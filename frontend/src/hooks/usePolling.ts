import { useEffect, useRef } from "react";

/**
 * Refresh-based "live sync" — refetches on an interval and whenever the tab
 * regains focus/visibility, so a Commander assignment (or a Soldier's field
 * report) shows up on the other portal without a manual page reload. This
 * project doesn't have a Socket.IO server wired up (no real-time push), so
 * short-interval polling is the documented fallback for that requirement.
 *
 * `fn` should be a stable-enough callback (e.g. wrapped in useCallback by the
 * caller, or simply re-created each render — this hook always calls the
 * latest version via a ref, so it never needs to appear in a dependency
 * array and never re-schedules the interval on every render).
 */
export function usePolling(fn: () => void | Promise<void>, intervalMs = 20_000) {
  const savedFn = useRef(fn);
  savedFn.current = fn;

  useEffect(() => {
    const tick = () => {
      void savedFn.current();
    };

    const id = window.setInterval(tick, intervalMs);

    function onFocusOrVisible() {
      if (document.visibilityState === "visible") tick();
    }
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [intervalMs]);
}
