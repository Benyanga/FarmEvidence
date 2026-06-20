import { useDataStore } from "../../../store/dataStore";
import { useSessionStore } from "../../../store/sessionStore";
import { computeCSI, CSI_DRIVERS } from "../../../engine/efficiency/csi";
import { LiveComputed } from "../../shared/LiveComputed";
import HideMechanism from "../../shared/HideMechanism";

const DRIVER_KEYS = Object.keys(CSI_DRIVERS);

export function CSISliders() {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const updateCSI = useDataStore((s) => s.updateCSI);
  const scores = season?.csiScores ?? {};
  const csi = computeCSI(scores);
  return (
    <section id="section-csi" className="card">
      <h3 className="heading-3 mb-3">CSI Driver Scores</h3>
      <p className="body-sm text-slate-600 mb-3">Each driver contributes via configured weights to the CSI score. Use the anchors below to score the local site context from 0.0 (unfavourable) to 1.0 (favourable).</p>
      <HideMechanism id="csi-formula" content={"CSI = Σ(w_j × s_j) j=[1-6]; default 0.50 if scores missing"} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {DRIVER_KEYS.map((key) => {
          const driver = CSI_DRIVERS[key];
          return (
            <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold">{driver.label}</p>
                  <p className="text-xs text-slate-500">Weight: {Math.round(driver.weight * 100)}%</p>
                </div>
                <span className="text-xs text-slate-500">{key}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={scores[key] ?? 0.5}
                onChange={(e) => updateCSI(seasonKey, { ...scores, [key]: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-2">{driver.anchors}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-4">
        <LiveComputed label="CSI" value={csi.csi.toFixed(2)} unit={csi.classification} />
      </div>
    </section>
  );
}

