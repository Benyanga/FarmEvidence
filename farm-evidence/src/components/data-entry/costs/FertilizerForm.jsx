import { useDataStore } from "../../../store/dataStore";
import { useSessionStore } from "../../../store/sessionStore";

const defaultEntry = { syntheticQty: 0, syntheticPrice: 0, organicQty: 0, organicPrice: 0 };

function calcEntryTotal(entry) {
  return (Number(entry.syntheticQty) * Number(entry.syntheticPrice)) + (Number(entry.organicQty) * Number(entry.organicPrice));
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

export function FertilizerForm() {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const updateSeason = useDataStore((s) => s.updateSeason);
  const updateCosts = useDataStore((s) => s.updateCosts);

  let detailsData = season?.costDetails?.fertilizer ?? [];
  if (!Array.isArray(detailsData)) detailsData = [detailsData];
  if (detailsData.length === 0) detailsData = [defaultEntry];

  const costs = season?.costs ?? {};
  const isNA = costs.fertilizer === "N/A";
  const total = detailsData.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);

  const updateEntry = (index, key, value) => {
    const updated = [...detailsData];
    updated[index] = { ...updated[index], [key]: Number(value) };
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), fertilizer: updated } });
    updateCosts(seasonKey, { ...costs, fertilizer: Number(newTotal.toFixed(2)) });
  };

  const addEntry = () => {
    const updated = [...detailsData, { ...defaultEntry }];
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), fertilizer: updated } });
    updateCosts(seasonKey, { ...costs, fertilizer: Number(newTotal.toFixed(2)) });
  };

  const removeEntry = (index) => {
    const updated = detailsData.filter((_, i) => i !== index);
    if (updated.length === 0) updated.push({ ...defaultEntry });
    const newTotal = updated.reduce((sum, entry) => sum + calcEntryTotal(entry), 0);
    updateSeason(seasonKey, { costDetails: { ...(season?.costDetails ?? {}), fertilizer: updated } });
    updateCosts(seasonKey, { ...costs, fertilizer: Number(newTotal.toFixed(2)) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "0 4px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)" }}>Fertilizer</span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addEntry} disabled={isNA}>+ Add</button>
      </div>
      {detailsData.map((entry, idx) => (
        <div key={idx} style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(2, 1fr)", padding: "14px", borderRadius: "10px", border: "1px solid var(--fe-grey-200)" }}>
          <span style={labelStyle}>Synthetic qty</span>
          <span style={labelStyle}>Synthetic price</span>
          <input type="number" style={inputStyle(isNA)} value={entry.syntheticQty} disabled={isNA} onChange={(e) => updateEntry(idx, "syntheticQty", e.target.value)} />
          <input type="number" style={inputStyle(isNA)} value={entry.syntheticPrice} disabled={isNA} onChange={(e) => updateEntry(idx, "syntheticPrice", e.target.value)} />
          <span style={labelStyle}>Organic qty</span>
          <span style={labelStyle}>Organic price</span>
          <input type="number" style={inputStyle(isNA)} value={entry.organicQty} disabled={isNA} onChange={(e) => updateEntry(idx, "organicQty", e.target.value)} />
          <input type="number" style={inputStyle(isNA)} value={entry.organicPrice} disabled={isNA} onChange={(e) => updateEntry(idx, "organicPrice", e.target.value)} />
          <span style={{ gridColumn: "span 2", fontSize: "12px", color: "var(--fe-grey-500)", textAlign: "right" }}>Entry total: {calcEntryTotal(entry).toFixed(2)} RWF/ha</span>
          {detailsData.length > 1 && (
            <button type="button" className="btn btn-secondary btn-sm" style={{ gridColumn: "span 2" }} onClick={() => removeEntry(idx)} disabled={isNA}>Remove</button>
          )}
        </div>
      ))}
      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)" }}>Total fertilizer {total.toFixed(2)} RWF/ha</span>
    </div>
  );
}
