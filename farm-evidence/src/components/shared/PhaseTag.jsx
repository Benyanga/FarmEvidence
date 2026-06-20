import { getPhaseFromSeasonsElapsed } from "../../utils/phaseUtils";
import { useDataStore } from "../../store/dataStore";

export function PhaseTag({ phaseName }) {
  const style =
    phaseName === "TRANSITION"
      ? { background: "var(--fe-amber-100)", color: "var(--fe-amber-700)" }
      : phaseName === "STABILIZATION"
        ? { background: "var(--fe-teal-100)", color: "var(--fe-teal-900)" }
        : { background: "var(--fe-green-100)", color: "var(--fe-green-900)" };
  return <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", ...style }}>{phaseName || "—"}</span>;
}

export function PhaseDisplay() {
  const setup = useDataStore((s) => s.setup);
  const elapsed = Number(setup.currentSeason ?? 0) - Number(setup.adoptionStartSeason ?? 0);
  const phase = getPhaseFromSeasonsElapsed(elapsed > 0 ? elapsed : null);
  const seasonLabel = elapsed > 0 ? `Season ${elapsed}` : "Season unknown";

  return (
    <div className="card card--minimal">
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)" }}>{phase.phaseName}</span>
        <PhaseTag phaseName={phase.phaseName} />
      </div>
      <span style={{ fontSize: "11px", color: "var(--fe-text-muted)", marginTop: "4px", display: "block" }}>{seasonLabel}</span>
    </div>
  );
}
