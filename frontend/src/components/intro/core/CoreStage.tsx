import { AICore } from "./AICore";
import { CoreLabels } from "./CoreLabels";

// ----------------------------------------------------------------------------
// Composes the AI Core with its ring of floating labels inside one shared,
// square, centered stage — CoreLabels positions everything by percentage of
// this exact box, so it always lines up with AICore's own rendered circle
// regardless of viewport size.
// ----------------------------------------------------------------------------

interface CoreStageProps {
  labelsVisible: boolean;
}

export function CoreStage({ labelsVisible }: CoreStageProps) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: "min(78vw, 78vh, 900px)", height: "min(78vw, 78vh, 900px)" }}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <AICore />
      </div>
      <CoreLabels visible={labelsVisible} />
    </div>
  );
}
