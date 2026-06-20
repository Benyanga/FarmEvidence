import { useDataStore } from "../../../store/dataStore";
import { useSessionStore } from "../../../store/sessionStore";

const defaultEntry = { herbQty: 0, herbPrice: 0, insectQty: 0, insectPrice: 0, fungQty: 0, fungPrice: 0 };

function calcEntryTotal(entry) {
  return (
    (Number(entry.herbQty) * Number(entry.herbPrice)) +
    (Number(entry.insectQty) * Number(entry.insectPrice)) +
    (Number(entry.fungQty) * Number(entry.fungPrice))
  );
}

export function PesticideForm() {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const updateSeason = useDataStore((s) => s.updateSeason);
  const updateCosts = useDataStore((s) => s.updateCosts);
  
  // Ensure details is an array for backward compatibility
  let detailsData = season?.costDetails?.pesticide ?? [];
  if (!Array.isArray(detailsData)) {
    detailsData = [detailsData];
  }
  if (detailsData.length === 0) {
    detailsData = [defaultEntry];
  }
  
  const costs = season?.costs ?? {};
  const isNA = costs.pesticide === "N/A";
  const total = detailsData.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);

  const updateEntry = (index, key, value) => {
    const updated = [...detailsData];
    updated[index] = { ...updated[index], [key]: Number(value) };
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), pesticide: updated } });
    updateCosts(seasonKey, { ...costs, pesticide: Number(newTotal.toFixed(2)) });
  };

  const addEntry = () => {
    const updated = [...detailsData, { ...defaultEntry }];
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), pesticide: updated } });
    updateCosts(seasonKey, { ...costs, pesticide: Number(newTotal.toFixed(2)) });
  };

  const removeEntry = (index) => {
    const updated = detailsData.filter((_, i) => i !== index);
    if (updated.length === 0) updated.push({ ...defaultEntry });
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), pesticide: updated } });
    updateCosts(seasonKey, { ...costs, pesticide: Number(newTotal.toFixed(2)) });
  };

  return (
    <div className="card body-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold">Pesticide</p>
        <button type="button" className="btn btn-sm btn-secondary" onClick={addEntry} disabled={isNA}>
          + Add
        </button>
      </div>
      <div className="space-y-3">
        {detailsData.map((entry, idx) => (
          <div key={idx} className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-200 last:border-b-0">
            <input className="field-input" type="number" placeholder="Herbicide qty" value={entry.herbQty} disabled={isNA} onChange={(e) => updateEntry(idx, "herbQty", e.target.value)} />
            <input className="field-input" type="number" placeholder="Herbicide price" value={entry.herbPrice} disabled={isNA} onChange={(e) => updateEntry(idx, "herbPrice", e.target.value)} />
            <input className="field-input" type="number" placeholder="Insecticide qty" value={entry.insectQty} disabled={isNA} onChange={(e) => updateEntry(idx, "insectQty", e.target.value)} />
            <input className="field-input" type="number" placeholder="Insecticide price" value={entry.insectPrice} disabled={isNA} onChange={(e) => updateEntry(idx, "insectPrice", e.target.value)} />
            <input className="field-input" type="number" placeholder="Fungicide qty" value={entry.fungQty} disabled={isNA} onChange={(e) => updateEntry(idx, "fungQty", e.target.value)} />
            <input className="field-input" type="number" placeholder="Fungicide price" value={entry.fungPrice} disabled={isNA} onChange={(e) => updateEntry(idx, "fungPrice", e.target.value)} />
            <div className="text-xs text-slate-600 col-span-2">Entry total: {calcEntryTotal(entry).toFixed(2)} RWF/ha</div>
            {detailsData.length > 1 && (
              <button type="button" className="btn btn-sm btn-secondary col-span-2" onClick={() => removeEntry(idx)} disabled={isNA}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 body-sm font-semibold">Total pesticide cost: {total.toFixed(2)} RWF/ha</p>
      {isNA ? <p className="mt-1 body-sm text-amber-700">Pesticide has been marked N/A and detail inputs are disabled.</p> : null}
    </div>
  );
}

