import { useDataStore } from "../../../store/dataStore";
import { useSessionStore } from "../../../store/sessionStore";

const defaultEntry = { laborDays: 0, wageRate: 0, materialsCost: 0 };

function calcEntryTotal(entry) {
  return (Number(entry.laborDays) * Number(entry.wageRate)) + Number(entry.materialsCost);
}

export function ResidueForm() {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const updateSeason = useDataStore((s) => s.updateSeason);
  const updateCosts = useDataStore((s) => s.updateCosts);
  
  // Ensure details is an array for backward compatibility
  let detailsData = season?.costDetails?.residue ?? [];
  if (!Array.isArray(detailsData)) {
    detailsData = [detailsData];
  }
  if (detailsData.length === 0) {
    detailsData = [defaultEntry];
  }
  
  const costs = season?.costs ?? {};
  const isNA = costs.residue === "N/A";
  const total = detailsData.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);

  const updateEntry = (index, key, value) => {
    const updated = [...detailsData];
    updated[index] = { ...updated[index], [key]: Number(value) };
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), residue: updated } });
    updateCosts(seasonKey, { ...costs, residue: Number(newTotal.toFixed(2)) });
  };

  const addEntry = () => {
    const updated = [...detailsData, { ...defaultEntry }];
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), residue: updated } });
    updateCosts(seasonKey, { ...costs, residue: Number(newTotal.toFixed(2)) });
  };

  const removeEntry = (index) => {
    const updated = detailsData.filter((_, i) => i !== index);
    if (updated.length === 0) updated.push({ ...defaultEntry });
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), residue: updated } });
    updateCosts(seasonKey, { ...costs, residue: Number(newTotal.toFixed(2)) });
  };

  return (
    <div className="card body-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold">Residue Management</p>
        <button type="button" className="btn btn-sm btn-secondary" onClick={addEntry} disabled={isNA}>
          + Add
        </button>
      </div>
      <div className="space-y-3">
        {detailsData.map((entry, idx) => (
          <div key={idx} className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-200 last:border-b-0">
            <input className="field-input" type="number" placeholder="Labor days/ha" value={entry.laborDays} disabled={isNA} onChange={(e) => updateEntry(idx, "laborDays", e.target.value)} />
            <input className="field-input" type="number" placeholder="Wage rate RWF/day" value={entry.wageRate} disabled={isNA} onChange={(e) => updateEntry(idx, "wageRate", e.target.value)} />
            <input className="field-input col-span-2" type="number" placeholder="Materials RWF/ha" value={entry.materialsCost} disabled={isNA} onChange={(e) => updateEntry(idx, "materialsCost", e.target.value)} />
            <div className="text-xs text-slate-600 col-span-2">Entry total: {calcEntryTotal(entry).toFixed(2)} RWF/ha</div>
            {detailsData.length > 1 && (
              <button type="button" className="btn btn-sm btn-secondary col-span-2" onClick={() => removeEntry(idx)} disabled={isNA}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 body-sm font-semibold">Total residue cost: {total.toFixed(2)} RWF/ha</p>
      {isNA ? <p className="mt-1 body-sm text-amber-700">Residue management has been marked N/A and detail inputs are disabled.</p> : null}
    </div>
  );
}

