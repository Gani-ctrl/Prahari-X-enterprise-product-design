import { useEffect, useState } from "react";

const CDN_JS = "https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js";
const CDN_CSS = "https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css";

declare global {
  interface Window {
    maplibregl?: any;
  }
}

let loadPromise: Promise<void> | null = null;

// MapLibre GL JS is loaded from a CDN at runtime rather than imported as an
// npm dependency (this build's package.json doesn't include it, and adding
// one requires a package-manager install this environment can't run). This
// is MapLibre's own documented no-bundler integration path — a stylesheet
// link + script tag exposing a global `maplibregl` — just triggered lazily
// so the ~230KB library only loads when this specific page is visited, and
// cached by the browser/CDN on every visit after the first.
function loadMapLibre(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.maplibregl) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${CDN_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CDN_CSS;
      document.head.appendChild(link);
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CDN_JS}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load MapLibre GL JS")));
      return;
    }

    const script = document.createElement("script");
    script.src = CDN_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load MapLibre GL JS"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Loads MapLibre GL JS once and reports readiness — used by LiveOperationsMap only. */
export function useMapLibreLoader(): "loading" | "ready" | "error" {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(window.maplibregl ? "ready" : "loading");

  useEffect(() => {
    let cancelled = false;
    loadMapLibre()
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
