// SeasonEntry.jsx
// Per-season data entry: costs, revenue, agronomic obs, progress gating
import React, { useState } from "react";

const COST_CATEGORIES = [
  "Tillage",
  "Fertilizer",
  "Pesticide",
  "Irrigation",
  "Residue Management",
  "Labour",
];

const LABOUR_OPS = [
  "Land preparation",
  "Planting",
  "Weeding",
  "Harvesting",
  "Residue management",
];

const initialCosts = COST_CATEGORIES.reduce((acc, cat) => {
  acc[cat] = { rows: [], complete: false, n_a: false, note: "" };
  return acc;
}, {});

const initialLabour = LABOUR_OPS.map((op) => ({ op, time: "", timeUnit: "days", wage: "", total: 0, note: "" }));

import { saveFarmSeasonRecord } from "../../utils/farmerSeasonApi";

export default function SeasonEntry({ farmName, label, season, onSave, onRunAnalysis }) {
  const [costs, setCosts] = useState(initialCosts);
  const [labour, setLabour] = useState(initialLabour);
  const [revenue, setRevenue] = useState({ yield: "", price: "", gross: "" });
  const [agronomic, setAgronomic] = useState({ weed: "", notes: "" });
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState({});
  const [gate, setGate] = useState({});
  const [analysisReady, setAnalysisReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Validation logic (simplified for brevity)
  function validate() {
    const errs = {};
    if (!revenue.yield || Number(revenue.yield) <= 0) errs.yield = "Yield must be a positive number";
    if (!revenue.price || Number(revenue.price) <= 0) errs.price = "Enter the actual market price received";
    LABOUR_OPS.forEach((op, i) => {
      if (labour[i].time === "" || isNaN(Number(labour[i].time))) errs[`labour_${i}`] = "Enter 0 if not performed — do not leave blank";
    });
    COST_CATEGORIES.forEach((cat) => {
      if (!costs[cat].complete && !costs[cat].n_a) errs[`cost_${cat}`] = `Cost category ${cat} is incomplete. Enter or mark N/A.`;
    });
    setErrors(errs);
    setAnalysisReady(Object.keys(errs).length === 0);
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        farmName,
        label,
        year: season?.year,
        season: season?.season,
        season_ref: `${season?.season}-${season?.year}`,
        costs,
        labour,
        revenue,
        agronomic,
      };
      const savedRecord = await saveFarmSeasonRecord(payload);
      if (onSave) onSave(savedRecord);
    } catch (e) {
      setSaveError("Failed to save season data");
    } finally {
      setSaving(false);
    }
  }

  function handleRunAnalysis() {
    const errs = validate();
    if (Object.keys(errs).length === 0 && onRunAnalysis) onRunAnalysis();
  }

  // UI rendering (simplified, focus on validation and gating)
  return (
    <div className="card p-4 max-w-2xl mx-auto mt-8">
      <h2 className="heading-2 mb-4">Season Data Entry</h2>
      {/* Labour Table */}
      <div className="mb-3">
        <label className="form-label">Labour Operations *</label>
        <table className="table table-bordered">
          <thead><tr><th>Operation</th><th>Time</th><th>Unit</th><th>Wage</th><th>Total</th><th>Notes</th></tr></thead>
          <tbody>
            {labour.map((row, i) => (
              <tr key={row.op}>
                <td>{row.op}</td>
                <td><input className={`form-control${errors[`labour_${i}`] ? " is-invalid" : ""}`} value={row.time} onChange={e => {
                  const v = e.target.value; setLabour(labour => labour.map((r, idx) => idx === i ? { ...r, time: v } : r));
                }} type="number" min="0" /></td>
                <td><select className="form-select" value={row.timeUnit} onChange={e => setLabour(labour => labour.map((r, idx) => idx === i ? { ...r, timeUnit: e.target.value } : r))}><option>minutes</option><option>hours</option><option>days</option></select></td>
                <td><input className="form-control" value={row.wage} onChange={e => setLabour(labour => labour.map((r, idx) => idx === i ? { ...r, wage: e.target.value } : r))} type="number" min="0" /></td>
                <td style={{ color: row.time && row.wage ? 'inherit' : 'var(--fe-grey-400)' }}>{row.time && row.wage ? ((Number(row.time) * Number(row.wage)).toLocaleString()) : "—"}</td>
                <td><input className="form-control" value={row.note} onChange={e => setLabour(labour => labour.map((r, idx) => idx === i ? { ...r, note: e.target.value } : r))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {LABOUR_OPS.map((op, i) => errors[`labour_${i}`] && <div key={i} className="invalid-feedback d-block">{errors[`labour_${i}`]}</div>)}
      </div>
      {/* Revenue Entry */}
      <div className="mb-3">
        <label className="form-label">Yield (kg) *</label>
        <input className={`form-control${errors.yield ? " is-invalid" : ""}`} value={revenue.yield} onChange={e => setRevenue(r => ({ ...r, yield: e.target.value }))} type="number" min="0.01" />
        {errors.yield && <div className="invalid-feedback">{errors.yield}</div>}
      </div>
      <div className="mb-3">
        <label className="form-label">Selling Price (RWF/kg) *</label>
        <input className={`form-control${errors.price ? " is-invalid" : ""}`} value={revenue.price} onChange={e => setRevenue(r => ({ ...r, price: e.target.value }))} type="number" min="0.01" />
        {errors.price && <div className="invalid-feedback">{errors.price}</div>}
      </div>
      {/* Agronomic Observations */}
      <div className="mb-3">
        <label className="form-label">Weed Pressure Score (0–5)</label>
        <input className="form-control" value={agronomic.weed} onChange={e => setAgronomic(a => ({ ...a, weed: e.target.value }))} type="number" min="0" max="5" />
      </div>
      <div className="mb-3">
        <label className="form-label">Additional notes</label>
        <textarea className="form-control" value={agronomic.notes} onChange={e => setAgronomic(a => ({ ...a, notes: e.target.value }))} />
      </div>
      {/* Save and Progress */}
      <button className="btn btn-success me-2" onClick={handleSave} disabled={saving}>Save</button>
      <button className="btn btn-primary" onClick={handleRunAnalysis} disabled={!analysisReady}>Run Analysis</button>
      {saveError && <div className="form-text text-danger mt-2">{saveError}</div>}
      {!analysisReady && <div className="form-text text-danger mt-2">Complete all required fields to run analysis.</div>}
    </div>
  );
}
