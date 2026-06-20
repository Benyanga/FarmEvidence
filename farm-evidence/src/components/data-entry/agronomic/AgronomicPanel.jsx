import { useDataStore } from "../../../store/dataStore";
import { useSessionStore } from "../../../store/sessionStore";
import { useEffect } from "react";
import { WeedScoreInput } from "./WeedScoreInput";
import { SoilScoreInput } from "./SoilScoreInput";
import { CSISliders } from "./CSISliders";

export function AgronomicPanel() {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const updateAgronomics = useDataStore((s) => s.updateAgronomics);
  const autosave = useDataStore((s) => s.autosave);
  const agronomics = season?.agronomics ?? {};

  // Auto-save when agronomic data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      autosave();
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [agronomics, autosave]);

  return (
    <section id="section-agronomic" className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="heading-2">Agronomic Scores</h2>
        <button type="button" className="btn btn-secondary" onClick={autosave}>
          Save Records
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <WeedScoreInput />
        <SoilScoreInput />
        <label className="field-group">
          <span className="field-label">Pest incidence (%)</span>
          <input
            className="field-input"
            placeholder="Pest incidence (%)"
            value={agronomics.pestIncidence ?? ""}
            onChange={(e) => updateAgronomics(seasonKey, { ...agronomics, pestIncidence: Number(e.target.value) })}
          />
        </label>
      </div>
      <div className="mt-4">
        <CSISliders />
      </div>
    </section>
  );
}

