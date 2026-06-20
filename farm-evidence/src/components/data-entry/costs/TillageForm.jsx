import { useDataStore } from "../../../store/dataStore";
import { useSessionStore } from "../../../store/sessionStore";

const defaultEntry = { fuelL: 0, fuelPrice: 0, machineryHire: 0, operatorDays: 0, wageRate: 0 };

function calcEntryTotal(entry) {
  return (Number(entry.fuelL) * Number(entry.fuelPrice)) + Number(entry.machineryHire) + (Number(entry.operatorDays) * Number(entry.wageRate));
}

const inputStyle = (disabled) => ({
  width: "100%",
  minHeight: "40px",
  borderRadius: "8px",
  border: disabled ? "1px solid var(--fe-grey-200)" : "1px solid var(--fe-grey-200)",
  padding: "0 12px",
  fontSize: "14px",
  color: "var(--fe-grey-900)",
  background: disabled ? "var(--fe-grey-050)" : "var(--fe-white)",
  outline: "none",
});

const labelStyle = {
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--fe-grey-500)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "4px",
  display: "block",
};

export function TillageForm() {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const updateSeason = useDataStore((s) => s.updateSeason);
  const updateCosts = useDataStore((s) => s.updateCosts);

  let detailsData = season?.costDetails?.tillage ?? [];
  if (!Array.isArray(detailsData)) detailsData = [detailsData];
  if (detailsData.length === 0) detailsData = [defaultEntry];

  const costs = season?.costs ?? {};
  const isNA = costs.tillage === "N/A";
  const total = detailsData.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);

  const updateEntry = (index, key, value) => {
    const updated = [...detailsData];
    updated[index] = { ...updated[index], [key]: Number(value) };
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), tillage: updated } });
    updateCosts(seasonKey, { ...costs, tillage: Number(newTotal.toFixed(2)) });
  };

  const addEntry = () => {
    const updated = [...detailsData, { ...defaultEntry }];
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), tillage: updated } });
    updateCosts(seasonKey, { ...costs, tillage: Number(newTotal.toFixed(2)) });
  };

  const removeEntry = (index) => {
    const updated = detailsData.filter((_, i) => i !== index);
    if (updated.length === 0) updated.push({ ...defaultEntry });
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), tillage: updated } });
    updateCosts(seasonKey, { ...costs, tillage: Number(newTotal.toFixed(2)) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "0 4px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)" }}>Tillage</span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addEntry} disabled={isNA}>+ Add</button>
      </div>
      {detailsData.map((entry, idx) => (
        <div key={idx} style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(2, 1fr)", padding: "14px", borderRadius: "10px", border: "1px solid var(--fe-grey-200)" }}>
          <span style={labelStyle}>Fuel qty</span>
          <span style={labelStyle}>Fuel price</span>
          <input type="number" style={inputStyle(isNA)} value={entry.fuelL} disabled={isNA} onChange={(e) => updateEntry(idx, "fuelL", e.target.value)} />
          <input type="number" style={inputStyle(isNA)} value={entry.fuelPrice} disabled={isNA} onChange={(e) => updateEntry(idx, "fuelPrice", e.target.value)} />
          <span style={labelStyle}>Machinery hire</span>
          <span style={labelStyle}>Operator days</span>
          <input type="number" style={inputStyle(isNA)} value={entry.machineryHire} disabled={isNA} onChange={(e) => updateEntry(idx, "machineryHire", e.target.value)} />
          <input type="number" style={inputStyle(isNA)} value={entry.operatorDays} disabled={isNA} onChange={(e) => updateEntry(idx, "operatorDays", e.target.value)} />
          {detailsData.length > 1 && (
            <button type="button" className="btn btn-secondary btn-sm" style={{ gridColumn: "span 2" }} onClick={() => removeEntry(idx)} disabled={isNA}>Remove</button>
          )}
        </div>
      ))}
      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)" }}>Total tillage {total.toFixed(2)} RWF/ha</span>
    </div>
  );
}
