import type { CSSProperties } from "react";
import { AICore } from "./AICore";
import { CoreLabels } from "./CoreLabels";

// ----------------------------------------------------------------------------
// Composes the AI Core with its ring of floating labels. Both boxes below
// are centered with the exact same technique — `left: 50%; top: 50%;
// transform: translate(-50%, -50%)` — plus the exact same small upward
// offset, so they share one transform origin rather than each being
// centered its own way (the reactor box previously used `inset-0`
// edge-anchoring while the labels box used left/top/translate; visually
// identical at rest, but two different mechanisms, and only one of them
// could carry the upward offset cleanly). Now there is exactly one shared
// origin point, used by both.
//
// Inside AICore.tsx's single <Canvas>, the globe, glass shell, every
// rotating ring, both particle fields, the volumetric beam, and the
// projected platform all live in one Three.js scene graph rooted at the
// same world origin (0,0,0) — nothing in there is positioned
// independently; only individual layers ROTATE around that shared origin
// (see AICore.tsx / TacticalGlobe.tsx / OrbitRings.tsx). This CSS
// transform is what places that single shared origin on screen. The
// labels box uses the identical transform purely so its connector lines
// stay anchored to the globe's edge as that shared origin moves — it
// doesn't affect the reactor's own rendering at all.
// ----------------------------------------------------------------------------

// Shift the whole scene up ~9% of viewport height so the globe sits
// visually above the PRAHARI X title instead of at dead screen-center.
const VERTICAL_OFFSET = "9vh";

const SCENE_TRANSFORM: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "100vw",
  height: "100vh",
  transform: `translate(-50%, calc(-50% - ${VERTICAL_OFFSET}))`,
};

const LABELS_TRANSFORM: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "min(78vw, 78vh, 900px)",
  height: "min(78vw, 78vh, 900px)",
  transform: `translate(-50%, calc(-50% - ${VERTICAL_OFFSET}))`,
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
