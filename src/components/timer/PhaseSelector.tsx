import { memo, useCallback } from "react";
import type { Phase } from "../../types";
import { PHASE_LABEL } from "../../constants/timer";

export interface PhaseSelectorProps {
  currentPhase: Phase;
  onPhaseChange: (phase: Phase) => void;
}

const PHASES: Phase[] = ["work", "shortBreak", "longBreak"];

export const PhaseSelector = memo<PhaseSelectorProps>(({ currentPhase, onPhaseChange }) => {
  const handlePhaseClick = useCallback(
    (phase: Phase) => {
      onPhaseChange(phase);
    },
    [onPhaseChange],
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {PHASES.map((phase) => (
        <button
          key={phase}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            currentPhase === phase
              ? "bg-indigo-100 text-indigo-700"
              : "bg-white/70 text-slate-500"
          }`}
          onClick={() => handlePhaseClick(phase)}
        >
          {PHASE_LABEL[phase]}
        </button>
      ))}
    </div>
  );
});

PhaseSelector.displayName = "PhaseSelector";
