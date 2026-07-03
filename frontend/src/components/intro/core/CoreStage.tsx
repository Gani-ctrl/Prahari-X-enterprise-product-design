import type { CSSProperties } from "react";
import { AICore } from "./AICore";
import { CoreLabels } from "./CoreLabels";

// ----------------------------------------------------------------------------
// Composes the AI Core with its ring of floating labels.
//
// Root-cause centering fix: the previous technique sized these boxes with
// `width: 100vw` / `height: 100vh` and centered them with
// `left: 50%; top: 50%; transform: translate(-50%, ...)`. That is NOT
// guaranteed to equal the true center of the page: `vw`/`vh` are defined
// against the browser's initial containing block (which includes the
// vertical scrollbar's width when one is present), while this element's
// actual positioned ancestor renders at the DOCUMENT's content width
// (scrollbar excluded). Whenever those two widths differ -- which varies
// by browser, OS scrollbar style, page content height, and can differ
// between local dev and a production deployment -- a box sized in `vw`
// and centered by translating half of its OWN (mismatched) width no
// longer lands on the parent's true center. It only ever looked centered
// "by visual guess," not by construction.
//
// The fix removes `vw`/`vh` and `transform` from the centering math
// entirely:
//   - The reactor's Canvas wrapper (SCENE_TRANSFORM) is simply
//     `position: absolute; inset: 0;` -- it exactly fills its positioned
//     ancestor (which is itself full-bleed all the way up to the intro
//     root -- see CinematicIntro.tsx), so its horizontal AND vertical
//     center is, by construction, exactly the parent's center. No
//     percentage math, no translate, nothing that can drift.
//   - The labels' smaller reference box (LABELS_TRANSFORM) still needs a
//     defined size (it's intentionally smaller than the full page, so the
//     label ring's radius reads as a sensible fraction of the reactor's
//     visual footprint rather than the whole viewport), but is centered
//     with `inset: 0; margin: auto;` instead of `left/top + translate` --
//     the classic scrollbar-immune absolute-centering technique, where
//     the browser itself computes (parentSize - ownSize) / 2 from the
//     PARENT's real rendered box, not from a viewport unit.
//
// Both boxes now resolve to the exact same, zero-offset center point --
// the true geometric center of the page -- so a vertical line through the
// globe's center passes through that same point the title's own
// (independently, flex-centered) horizontal midpoint sits on.
// ----------------------------------------------------------------------------

const SCENE_TRANSFORM: CSSProperties = {
  position: "absolute",
  inset: 0,
};

const LABELS_TRANSFORM: CSSProperties = {
  position: "absolute",
  inset: 0,
  margin: "auto",
  width: "min(78vw, 78vh, 900px)",
  height: "min(78vw, 78vh, 900px)",
};

interface CoreStageProps {
  labelsVisible: boolean;
}

export function CoreStage({ labelsVisible }: CoreStageProps) {
  return (
    <>
      <div className="pointer-events-none" style={SCENE_TRANSFORM}>
        <AICore />
      </div>

      <div className="pointer-events-none" style={LABELS_TRANSFORM}>
        <CoreLabels visible={labelsVisible} />
      </div>
    </>
  );
}
