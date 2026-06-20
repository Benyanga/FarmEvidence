import { getPhaseFromSeasonsElapsed } from "../../utils/phaseUtils";
import { useDataStore } from "../../store/dataStore";
import { PhaseTag } from "../shared/PhaseTag";

export function PhaseDisplay() {
  const setup = useDataStore((s) => s.setup);
  const elapsed = Number(setup.currentSeason ?? 0) - Number(setup.adoptionStartSeason ?? 0);
  const phase = getPhaseFromSeasonsElapsed(elapsed > 0 ? elapsed : null);
  const seasonLabel = elapsed > 0 ? `Season ${elapsed}` : "Season unknown";

  return (
    <div className="card card--minimal">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <span className="heading-4">Phase</span>
        <PhaseTag phaseName={phase.phaseName} />
      </div>
      <p className="label text-slate-500">{seasonLabel}</p>
    </div>
  );
}

