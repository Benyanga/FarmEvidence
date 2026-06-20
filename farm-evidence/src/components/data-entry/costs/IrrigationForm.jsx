import { useDataStore } from "../../../store/dataStore";
import { useSessionStore } from "../../../store/sessionStore";

const defaultEntry = { waterM3: 0, waterCost: 0, energyCost: 0, laborDays: 0, wageRate: 0, rainfed: false };

function calcEntryTotal(entry) {
  return entry.rainfed ? 0 : (Number(entry.waterM3) * Number(entry.waterCost)) + Number(entry.energyCost) + (Number(entry.laborDays) * Number(entry.wageRate));
}

export function IrrigationForm() {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const updateSeason = useDataStore((s) => s.updateSeason);
  const updateCosts = useDataStore((s) => s.updateCosts);
  
  // Ensure details is an array for backward compatibility
  let detailsData = season?.costDetails?.irrigation ?? [];
  if (!Array.isArray(detailsData)) {
    detailsData = [detailsData];
  }
  if (detailsData.length === 0) {
    detailsData = [defaultEntry];
  }
  
  const costs = season?.costs ?? {};
  const isNA = costs.irrigation === "N/A";
  const total = detailsData.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
  const hasRainfed = detailsData.some(e => e.rainfed);

  const updateEntry = (index, key, value) => {
    const updated = [...detailsData];
    updated[index] = { ...updated[index], [key]: key === "rainfed" ? Boolean(value) : Number(value) };
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), irrigation: updated } });
    updateCosts(seasonKey, { ...costs, irrigation: hasRainfed ? "N/A" : Number(newTotal.toFixed(2)) });
  };

  const addEntry = () => {
    const updated = [...detailsData, { ...defaultEntry }];
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), irrigation: updated } });
    updateCosts(seasonKey, { ...costs, irrigation: Number(newTotal.toFixed(2)) });
  };

  const removeEntry = (index) => {
    const updated = detailsData.filter((_, i) => i !== index);
    if (updated.length === 0) updated.push({ ...defaultEntry });
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), irrigation: updated } });
    updateCosts(seasonKey, { ...costs, irrigation: Number(newTotal.toFixed(2)) });
  };

  return (
    <div className="card body-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold">Irrigation</p>
        <button type="button" className="btn btn-sm btn-secondary" onClick={addEntry} disabled={isNA || hasRainfed}>
          + Add
        </button>
      </div>
      <div className="space-y-3">
        {detailsData.map((entry, idx) => (
          <div key={idx} className="pb-3 border-b border-slate-200 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <label className="body-sm">
                <input type="checkbox" checked={entry.rainfed} onChange={(e) => updateEntry(idx, "rainfed", e.target.checked)} /> Rainfed
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="field-input" type="number" placeholder="Water m3/ha" value={entry.waterM3} disabled={entry.rainfed || isNA} onChange={(e) => updateEntry(idx, "waterM3", e.target.value)} />
              <input className="field-input" type="number" placeholder="Water cost/m3" value={entry.waterCost} disabled={entry.rainfed || isNA} onChange={(e) => updateEntry(idx, "waterCost", e.target.value)} />
              <input className="field-input" type="number" placeholder="Energy RWF/ha" value={entry.energyCost} disabled={entry.rainfed || isNA} onChange={(e) => updateEntry(idx, "energyCost", e.target.value)} />
              <input className="field-input" type="number" placeholder="Labor days" value={entry.laborDays} disabled={entry.rainfed || isNA} onChange={(e) => updateEntry(idx, "laborDays", e.target.value)} />
              <div className="text-xs text-slate-600 col-span-2">Entry total: {calcEntryTotal(entry).toFixed(2)} RWF/ha</div>
            </div>
            {detailsData.length > 1 && (
              <button type="button" className="btn btn-sm btn-secondary w-full mt-2" onClick={() => removeEntry(idx)} disabled={isNA}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 body-sm font-semibold">Total irrigation cost: {hasRainfed ? "N/A" : `${total.toFixed(2)} RWF/ha`}</p>
      {isNA ? <p className="mt-1 body-sm text-amber-700">Irrigation has been marked N/A and detail inputs are disabled.</p> : null}
    </div>
  );
}

