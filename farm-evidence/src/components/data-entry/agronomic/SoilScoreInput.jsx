import { useDataStore } from "../../../store/dataStore";
import { useSessionStore } from "../../../store/sessionStore";

export function SoilScoreInput() {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const updateAgronomics = useDataStore((s) => s.updateAgronomics);
  const agr = season?.agronomics ?? {};
  return (
    <input
      className="field-input"
      placeholder="Soil score (1-5)"
      value={agr.soilScore ?? ""}
      onChange={(e) => updateAgronomics(seasonKey, { ...agr, soilScore: Number(e.target.value) })}
    />
  );
}

