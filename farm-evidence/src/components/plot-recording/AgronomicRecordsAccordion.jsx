import { useMemo, useEffect, useState } from "react";
import { usePlotRecordingStore } from "../../store/plotRecordingStore";
import { useDataStore } from "../../store/dataStore";

const DEFAULT_AGRONOMIC_RECORD = {
  yield_kg: "",
  yield_kg_ha: "",
  plot_size_ha: "",
  yieldNotes: "",
  weedPressureScore: "",
  weedNotes: "",
  pestIncidencePct: "",
  pestNotes: "",
  diseaseSeverity: "",
  diseaseNotes: "",
  soilFaunaScore: "",
  faunaNotes: "",
  soilColourScore: "",
  soilColourMunsell: "",
  soilColourNotes: "",
  cropVigourScore: "",
  cropVigourNDVI: "",
  vigourNotes: "",
  observations: "",
  useMunsell: false,
};

const weedScale = [
  "No weeds visible — clean plot",
  "Very low — isolated weeds, no competition",
  "Low — scattered weeds, minimal competition",
  "Moderate — widespread weeds, some competition",
  "High — dense weeds, significant competition",
  "Severe — weed-dominated, severe competition",
];

const diseaseScale = [
  null,
  "No disease visible",
  "Trace — isolated lesions on 50% of plants affected; significant yield risk",
  "Moderate — disease present across many plants; yield impact likely",
  "High — severe disease symptoms; significant crop loss risk",
  "Very high — widespread or systemic disease; urgent intervention required",
];

const soilFaunaScale = [
  null,
  "No earthworms found in pit sample",
  "Very few (1–3 per pit) — low activity",
  "Some (4–8 per pit) — moderate activity",
  "Active (9–15 per pit) — good biological activity",
  "Very active (> 15 per pit) — excellent biological activity",
];

const soilColourScale = [
  null,
  "Very pale / light brown — severely depleted SOM",
  "Light brown — low SOM",
  "Medium brown — moderate SOM",
  "Dark brown — good SOM accumulation",
  "Very dark / almost black — excellent SOM, high biological activity",
];

const cropVigourScale = [
  null,
  "Very poor — stunted, chlorotic, severe stress",
  "Poor — below average growth, visible stress",
  "Average — normal growth for variety and conditions",
  "Good — above average, healthy canopy",
  "Excellent — dense, vigorous, uniform canopy",
];

const getNDVIScore = (value) => {
  if (value === "" || value === null || Number.isNaN(Number(value))) return "";
  const ndvi = Number(value);
  if (ndvi >= 0.70) return 5;
  if (ndvi >= 0.60) return 4;
  if (ndvi >= 0.50) return 3;
  if (ndvi >= 0.40) return 2;
  return 1;
};

const getRatingColor = (type, score, selected) => {
  if (!selected) {
    return {
      background: "#FFFFFF",
      border: "1.5px solid var(--fe-border-input)",
      color: "var(--fe-text-secondary)",
    };
  }

  const isRiskRating = type === "weed" || type === "disease";
  const isGoodRating = ["fauna", "soil", "vigour"].includes(type);

  if (isRiskRating) {
    if (score >= 4) {
      return { background: "var(--fe-negative)", color: "#FFFFFF", border: "1.5px solid var(--fe-negative)" };
    }
    if (score === 3) {
      return { background: "var(--fe-amber-700)", color: "#FFFFFF", border: "1.5px solid var(--fe-amber-700)" };
    }
    return { background: "var(--fe-green-600)", color: "#FFFFFF", border: "1.5px solid var(--fe-green-600)" };
  }

  if (isGoodRating) {
    return { background: "var(--fe-green-700)", color: "#FFFFFF", border: "1.5px solid var(--fe-green-700)" };
  }

  return { background: "var(--fe-white)", color: "var(--fe-text-secondary)", border: "1.5px solid var(--fe-border-input)" };
};

const sectionStyles = {
  sectionLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontWeight: 600,
    color: "var(--fe-text-muted)",
    marginBottom: "12px",
  },
  card: {
    background: "var(--fe-bg-card)",
    border: "1px solid var(--fe-border-card)",
    borderRadius: "var(--fe-radius-lg)",
    boxShadow: "var(--fe-shadow-card)",
    padding: "16px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "6px",
    color: "var(--fe-grey-900)",
  },
  unit: {
    fontSize: "12px",
    color: "var(--fe-text-muted)",
    marginBottom: "12px",
  },
};

export function AgronomicRecordsAccordion({ plotId, trialSeasonId, plotSizeM2 = 100, mode = "RESEARCH" }) {
  const plotAgronomicRecords = usePlotRecordingStore((s) => s.plotAgronomicRecords);
  const updatePlotAgronomicRecord = usePlotRecordingStore((s) => s.updatePlotAgronomicRecord);
  const saveAgronomicRemote = useDataStore((s) => s.saveAgronomicRemote);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const record = useMemo(() => ({ ...DEFAULT_AGRONOMIC_RECORD, ...(plotAgronomicRecords?.[plotId] || {}) }), [plotAgronomicRecords, plotId]);
  const plotSizeHa = Number(plotSizeM2) / 10000;
  const yieldKgEntered = record.yield_kg !== "" && record.yield_kg !== null && record.yield_kg !== undefined;
  const weedScoreEntered = record.weedPressureScore !== "" && record.weedPressureScore !== null && record.weedPressureScore !== undefined;
  const yieldKgHa = yieldKgEntered && plotSizeHa > 0 ? Number(record.yield_kg) / plotSizeHa : null;

  useEffect(() => {
    const computedYieldHa = yieldKgEntered && plotSizeHa > 0 ? Number(record.yield_kg) / plotSizeHa : "";
    const updates = {};
    if (record.yield_kg_ha !== computedYieldHa) {
      updates.yield_kg_ha = computedYieldHa;
    }
    if (record.plot_size_ha !== plotSizeHa) {
      updates.plot_size_ha = plotSizeHa;
    }
    if (Object.keys(updates).length > 0) {
      updatePlotAgronomicRecord(plotId, updates);
    }
  }, [plotSizeHa, record.yield_kg, record.yield_kg_ha, record.plot_size_ha, yieldKgEntered, plotId, updatePlotAgronomicRecord]);

  const statusBadge = yieldKgEntered && weedScoreEntered
    ? { label: "✓ Complete", bg: "var(--fe-green-100)", color: "var(--fe-green-900)" }
    : yieldKgEntered || weedScoreEntered
      ? { label: "⚠ Partial", bg: "var(--fe-amber-100)", color: "var(--fe-amber-700)" }
      : { label: "○ Not started", bg: "var(--fe-grey-100)", color: "var(--fe-grey-500)" };

  const updateField = (key, value) => {
    updatePlotAgronomicRecord(plotId, { [key]: value });
  };

  const handleYieldChange = (value) => {
    const parsed = value === "" ? "" : Number(value);
    const computedYieldHa = parsed === "" || plotSizeHa <= 0 ? "" : Number(parsed) / plotSizeHa;
    updatePlotAgronomicRecord(plotId, { yield_kg: parsed, yield_kg_ha: computedYieldHa, plot_size_ha: plotSizeHa });
  };

  const handleWeedChange = (value) => {
    const parsed = value === "" ? "" : Number(value);
    updateField("weedPressureScore", parsed);
  };

  const handlePestChange = (value) => {
    const parsed = value === "" ? "" : Number(value);
    updateField("pestIncidencePct", parsed);
  };

  const handleDiseaseChange = (value) => {
    const parsed = value === "" ? "" : Number(value);
    updateField("diseaseSeverity", parsed);
  };

  const handleFaunaChange = (value) => {
    const parsed = value === "" ? "" : Number(value);
    updateField("soilFaunaScore", parsed);
  };

  const handleSoilColourChange = (value) => {
    const parsed = value === "" ? "" : Number(value);
    updateField("soilColourScore", parsed);
  };

  const handleCropVigourChange = (value) => {
    const parsed = value === "" ? "" : Number(value);
    updateField("cropVigourScore", parsed);
  };

  const handleNDVIChange = (value) => {
    const parsed = value === "" ? "" : Number(value);
    updatePlotAgronomicRecord(plotId, {
      cropVigourNDVI: parsed,
      cropVigourScore: parsed === "" ? record.cropVigourScore : getNDVIScore(parsed),
    });
  };

  const handleMunsellToggle = (enabled) => {
    updatePlotAgronomicRecord(plotId, { useMunsell: enabled, soilColourMunsell: enabled ? record.soilColourMunsell : "" });
  };

  const fieldNoteChange = (key, value) => updateField(key, value);

  const hasAgronomicValues = Object.values(record).some((value) => value !== null && value !== undefined && value !== "");

  const handleSaveAgronomic = async () => {
    if (!trialSeasonId) {
      setSaveStatus('Save the trial/farm season record first before saving agronomic data.');
      return;
    }

    if (!hasAgronomicValues) {
      setSaveStatus('No agronomic values have been entered yet.');
      return;
    }

    setSaving(true);
    setSaveStatus(null);

    const payload = {
      plot_id: plotId,
      trial_season_id: trialSeasonId,
      observed_at: 'HARVEST',
      mode: mode.toLowerCase(),
      plot_size_ha: plotSizeHa,
      ...record,
    };

    const res = await saveAgronomicRemote(payload);
    if (res.ok) {
      setSaveStatus('Agronomic record saved.');
    } else {
      setSaveStatus(`Save failed: ${res.error || 'Unknown error'}`);
    }
    setSaving(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <div style={sectionStyles.sectionLabel}>PRIMARY FIELD MEASUREMENTS</div>
        <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div style={sectionStyles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
              <div>
                <div style={sectionStyles.label}>Yield</div>
                <div style={sectionStyles.unit}>kg (plot-level entry) — auto-converts to kg/ha</div>
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", color: "var(--fe-text-muted)" }}>
                {yieldKgEntered ? "Recorded" : "Required"}
              </div>
            </div>
            <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr", marginTop: "16px" }}>
              <label style={{ display: "grid", gap: "8px", fontSize: "13px" }}>
                <span>Yield (kg)</span>
                <input
                  type="number"
                  min="0"
                  value={record.yield_kg === "" ? "" : record.yield_kg}
                  onChange={(e) => handleYieldChange(e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid var(--fe-border-input)",
                    background: "var(--fe-bg-input)",
                    color: "var(--fe-grey-900)",
                    fontSize: "14px",
                  }}
                />
                {!yieldKgEntered && (
                  <div style={{ color: "var(--fe-negative)", fontSize: "12px", marginTop: "4px" }}>
                    Yield is required for this plot before analysis can run.
                  </div>
                )}
              </label>

              <div style={{ display: "grid", gap: "8px", background: "var(--fe-bg-row)", borderRadius: "12px", padding: "16px" }}>
                <div style={{ fontSize: "13px", color: "var(--fe-text-muted)" }}>Yield (kg/ha)</div>
                <div style={{ background: "var(--fe-bg-row)", color: "var(--fe-green-800)", fontFamily: "var(--fe-font-mono)", fontWeight: 600, fontSize: "18px", minHeight: "46px", display: "flex", alignItems: "center" }}>
                  {yieldKgEntered && yieldKgHa != null && Number.isFinite(yieldKgHa) ? yieldKgHa.toFixed(1) : "—"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--fe-text-muted)" }}>Measured harvest weight = Yield ÷ Plot Size (ha)</div>
              </div>
            </div>

            <label style={{ display: "grid", gap: "8px", marginTop: "16px", fontSize: "12px" }}>
              <span>Notes</span>
              <textarea
                value={record.yieldNotes}
                onChange={(e) => fieldNoteChange("yieldNotes", e.target.value)}
                style={{
                  minHeight: "72px",
                  borderRadius: "10px",
                  border: "1px solid var(--fe-border-input)",
                  background: "var(--fe-bg-input)",
                  padding: "10px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                }}
                placeholder="Optional notes for yield"
              />
            </label>
          </div>

          <div style={sectionStyles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
              <div>
                <div style={sectionStyles.label}>Weed Pressure Score</div>
                <div style={sectionStyles.unit}>Score 0–5</div>
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", color: weedScoreEntered ? "var(--fe-green-900)" : "var(--fe-amber-700)" }}>
                {weedScoreEntered ? "Recorded" : "Warning"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
              {[0, 1, 2, 3, 4, 5].map((score) => {
                const selected = record.weedPressureScore === score;
                const style = getRatingColor("weed", score, selected);
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleWeedChange(score)}
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      fontWeight: 700,
                      cursor: "pointer",
                      ...style,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: "14px", fontSize: "12px", color: "var(--fe-text-muted)" }}>
              {record.weedPressureScore !== "" ? weedScale[record.weedPressureScore] : "Select a score to see the reference description."}
            </div>
            {record.weedPressureScore >= 3 && (
              <div style={{ marginTop: "14px", padding: "12px", background: "var(--fe-amber-100)", border: "1px solid var(--fe-amber-400)", borderRadius: "12px", color: "var(--fe-amber-700)", fontSize: "12px" }}>
                High weed pressure detected. Expect +15–25% weed control cost next season.
              </div>
            )}
            <label style={{ display: "grid", gap: "8px", marginTop: "16px", fontSize: "12px" }}>
              <span>Notes</span>
              <textarea
                value={record.weedNotes}
                onChange={(e) => fieldNoteChange("weedNotes", e.target.value)}
                style={{
                  minHeight: "72px",
                  borderRadius: "10px",
                  border: "1px solid var(--fe-border-input)",
                  background: "var(--fe-bg-input)",
                  padding: "10px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                }}
                placeholder="Optional weed pressure notes"
              />
            </label>
          </div>
        </div>
      </div>

      <div>
        <div style={sectionStyles.sectionLabel}>SOIL & CROP HEALTH INDICATORS</div>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <div style={sectionStyles.card}>
              <div style={sectionStyles.label}>Pest Incidence</div>
              <div style={sectionStyles.unit}>% of plants affected</div>
              <label style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="% of plants affected"
                  value={record.pestIncidencePct === "" ? "" : record.pestIncidencePct}
                  onChange={(e) => handlePestChange(e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid var(--fe-border-input)",
                    background: "var(--fe-bg-input)",
                    fontSize: "14px",
                  }}
                />
              </label>
              <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--fe-text-muted)" }}>
                {record.pestIncidencePct !== "" ? `${record.pestIncidencePct.toFixed(1)}% of plants affected` : "Enter a percent value between 0 and 100."}
              </div>
              {record.pestIncidencePct >= 30 && (
                <div style={{ marginTop: "14px", padding: "12px", background: "#FFEBEE", border: "1px solid var(--fe-negative)", borderRadius: "12px", color: "var(--fe-negative)", fontSize: "12px" }}>
                  Significant pest infestation recorded at {plotId}. Review control strategy. Yield loss risk flagged — economic projection updated.
                </div>
              )}
              <label style={{ display: "grid", gap: "8px", marginTop: "16px", fontSize: "12px" }}>
                <span>Notes</span>
                <textarea
                  value={record.pestNotes}
                  onChange={(e) => fieldNoteChange("pestNotes", e.target.value)}
                  style={{
                    minHeight: "72px",
                    borderRadius: "10px",
                    border: "1px solid var(--fe-border-input)",
                    background: "var(--fe-bg-input)",
                    padding: "10px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                  }}
                  placeholder="Optional pest notes"
                />
              </label>
            </div>

            <div style={sectionStyles.card}>
              <div style={sectionStyles.label}>Disease Severity</div>
              <div style={sectionStyles.unit}>Score 1–5</div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
                {[1, 2, 3, 4, 5].map((score) => {
                  const selected = record.diseaseSeverity === score;
                  const style = getRatingColor("disease", score, selected);
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => handleDiseaseChange(score)}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        fontWeight: 700,
                        cursor: "pointer",
                        ...style,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--fe-text-muted)" }}>
                {record.diseaseSeverity !== "" ? diseaseScale[record.diseaseSeverity] : "Choose a severity score to see the diagnostic scale."}
              </div>
              <label style={{ display: "grid", gap: "8px", marginTop: "16px", fontSize: "12px" }}>
                <span>Notes</span>
                <textarea
                  value={record.diseaseNotes}
                  onChange={(e) => fieldNoteChange("diseaseNotes", e.target.value)}
                  style={{
                    minHeight: "72px",
                    borderRadius: "10px",
                    border: "1px solid var(--fe-border-input)",
                    background: "var(--fe-bg-input)",
                    padding: "10px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                  }}
                  placeholder="Optional disease notes"
                />
              </label>
            </div>

            <div style={sectionStyles.card}>
              <div style={sectionStyles.label}>Soil Fauna Activity</div>
              <div style={sectionStyles.unit}>Index 1–5</div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
                {[1, 2, 3, 4, 5].map((score) => {
                  const selected = record.soilFaunaScore === score;
                  const style = getRatingColor("fauna", score, selected);
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => handleFaunaChange(score)}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        fontWeight: 700,
                        cursor: "pointer",
                        ...style,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--fe-text-muted)" }}>
                {record.soilFaunaScore !== "" ? soilFaunaScale[record.soilFaunaScore] : "Choose a soil fauna score to see the biological activity proxy."}
              </div>
              <label style={{ display: "grid", gap: "8px", marginTop: "16px", fontSize: "12px" }}>
                <span>Notes</span>
                <textarea
                  value={record.faunaNotes}
                  onChange={(e) => fieldNoteChange("faunaNotes", e.target.value)}
                  style={{
                    minHeight: "72px",
                    borderRadius: "10px",
                    border: "1px solid var(--fe-border-input)",
                    background: "var(--fe-bg-input)",
                    padding: "10px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                  }}
                  placeholder="Optional soil fauna notes"
                />
              </label>
            </div>

            <div style={sectionStyles.card}>
              <div style={sectionStyles.label}>Soil Colour Score</div>
              <div style={sectionStyles.unit}>Visual score 1–5</div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
                {[1, 2, 3, 4, 5].map((score) => {
                  const selected = record.soilColourScore === score;
                  const style = getRatingColor("soil", score, selected);
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => handleSoilColourChange(score)}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        fontWeight: 700,
                        cursor: "pointer",
                        ...style,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--fe-text-muted)" }}>
                {record.soilColourScore !== "" ? soilColourScale[record.soilColourScore] : "Choose a soil colour score to see the SOM proxy."}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", fontSize: "12px" }}>
                <input type="checkbox" checked={record.useMunsell} onChange={(e) => handleMunsellToggle(e.target.checked)} />
                <span>Use Munsell scale</span>
              </label>
              {record.useMunsell && (
                <label style={{ display: "grid", gap: "8px", marginTop: "12px", fontSize: "12px" }}>
                  <span>Munsell notation</span>
                  <input
                    type="text"
                    value={record.soilColourMunsell}
                    onChange={(e) => fieldNoteChange("soilColourMunsell", e.target.value)}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid var(--fe-border-input)",
                      background: "var(--fe-bg-input)",
                      fontSize: "14px",
                    }}
                  />
                </label>
              )}
              <label style={{ display: "grid", gap: "8px", marginTop: "16px", fontSize: "12px" }}>
                <span>Notes</span>
                <textarea
                  value={record.soilColourNotes}
                  onChange={(e) => fieldNoteChange("soilColourNotes", e.target.value)}
                  style={{
                    minHeight: "72px",
                    borderRadius: "10px",
                    border: "1px solid var(--fe-border-input)",
                    background: "var(--fe-bg-input)",
                    padding: "10px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                  }}
                  placeholder="Optional soil colour notes"
                />
              </label>
            </div>

            <div style={sectionStyles.card}>
              <div style={sectionStyles.label}>Crop Vigour Score</div>
              <div style={sectionStyles.unit}>Score 1–5</div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
                {[1, 2, 3, 4, 5].map((score) => {
                  const selected = record.cropVigourScore === score;
                  const style = getRatingColor("vigour", score, selected);
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => handleCropVigourChange(score)}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        fontWeight: 700,
                        cursor: "pointer",
                        ...style,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--fe-text-muted)" }}>
                {record.cropVigourScore !== "" ? cropVigourScale[record.cropVigourScore] : "Choose a vigour score to see the canopy health proxy."}
              </div>
              <label style={{ display: "grid", gap: "8px", marginTop: "12px", fontSize: "12px" }}>
                <span>NDVI (0.00–1.00)</span>
                <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    placeholder="0.00"
                    value={record.cropVigourNDVI === "" ? "" : record.cropVigourNDVI}
                    onChange={(e) => handleNDVIChange(e.target.value)}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid var(--fe-border-input)",
                      background: "var(--fe-bg-input)",
                      fontSize: "14px",
                    }}
                  />
                </label>
              <label style={{ display: "grid", gap: "8px", marginTop: "16px", fontSize: "12px" }}>
                <span>Notes</span>
                <textarea
                  value={record.vigourNotes}
                  onChange={(e) => fieldNoteChange("vigourNotes", e.target.value)}
                  style={{
                    minHeight: "72px",
                    borderRadius: "10px",
                    border: "1px solid var(--fe-border-input)",
                    background: "var(--fe-bg-input)",
                    padding: "10px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                  }}
                  placeholder="Optional crop vigour notes"
                />
              </label>
            </div>
          </div>
        </div>


      <div style={sectionStyles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontWeight: 600, fontSize: "14px" }}>Field Observations</div>
          <div style={{ fontSize: "12px", color: "var(--fe-text-muted)" }}>Optional</div>
        </div>
        <textarea
          value={record.observations}
          onChange={(e) => fieldNoteChange("observations", e.target.value)}
          rows={3}
          placeholder="Record any additional field observations for this plot this season — growth anomalies, environmental events, management notes..."
          style={{
            width: "100%",
            borderRadius: "var(--fe-radius-sm)",
            border: "1px solid var(--fe-border-input)",
            background: "var(--fe-bg-input)",
            padding: "12px",
            fontSize: "13px",
            fontFamily: "inherit",
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleSaveAgronomic}
          disabled={saving || !trialSeasonId || !hasAgronomicValues}
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            border: 'none',
            cursor: saving || !hasAgronomicValues ? 'not-allowed' : 'pointer',
            background: saving || !hasAgronomicValues ? 'var(--fe-grey-200)' : 'var(--fe-teal-900)',
            color: saving || !hasAgronomicValues ? 'var(--fe-grey-500)' : 'var(--fe-white)',
            fontWeight: 600,
          }}
        >
          {saving ? 'Saving…' : 'Save agronomic record'}
        </button>
        {saveStatus && (
          <div style={{ fontSize: '13px', color: saveStatus.startsWith('Save failed') ? 'var(--fe-negative)' : 'var(--fe-green-800)' }}>
            {saveStatus}
          </div>
        )}
      </div>
    </div>
  );
}
