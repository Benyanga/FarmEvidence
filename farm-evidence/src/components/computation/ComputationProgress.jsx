import { useComputationStore } from "../../store/computationStore";

const STEP_TEXT = {
  1: "Computing system costs...",
  2: "Computing revenue...",
  3: "Computing profit...",
  4: "Averaging across replications...",
  5: "Computing adoption cost...",
  6: "Computing indicators...",
  7: "Computing context index...",
  8: "Computing trends...",
  9: "Running scenario analysis...",
  10: "Running statistical analysis...",
  11: "Generating insights...",
  12: "Complete.",
};

export function ComputationProgress() {
  const currentStep = useComputationStore((s) => s.currentStep);
  const status = useComputationStore((s) => s.computationStatus);
  return (
    <div className="card body-sm">
      <p><b>Status:</b> {status}</p>
      <p><b>Step {currentStep || 0}:</b> {STEP_TEXT[currentStep] ?? "Not started"}</p>
    </div>
  );
}

