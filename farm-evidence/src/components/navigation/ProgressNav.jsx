export function ProgressNav({ currentStep = 0 }) {
  return (
    <div className="card state-neutral body-sm">
      Progress: Step {currentStep} / 12
    </div>
  );
}

