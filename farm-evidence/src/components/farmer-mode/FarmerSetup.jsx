// FarmerSetup.jsx
// One-time farm setup form for Farmer Mode
import React, { useState, useEffect } from "react";
import { saveFarmSetup, getFarmSetup } from "../../utils/farmSetupApi";


const cropOptions = ["Maize", "Beans", "Wheat", "Sorghum", "Other"];
const seasonOptions = ["A", "B", "C"];
const languageOptions = ["English", "Kinyarwanda"];

const defaultState = {
  farmName: "",
  farmerName: "",
  plotSize: { value: "", unit: "ha" },
  cropType: "Maize",
  seasonRef: { season: "A", year: new Date().getFullYear() },
  language: "English",
  workingHoursPerDay: 8,
};

export default function FarmerSetup() {
  const [form, setForm] = useState(defaultState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load existing setup if farmName is filled
  useEffect(() => {
    if (!form.farmName) return;
    setLoading(true);
    getFarmSetup(form.farmName)
      .then((data) => {
        if (data && data.farmName) setForm(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line
  }, [form.farmName]);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name.startsWith("plotSize.")) {
      setForm((f) => ({ ...f, plotSize: { ...f.plotSize, [name.split(".")[1]]: value } }));
    } else if (name.startsWith("seasonRef.")) {
      setForm((f) => ({ ...f, seasonRef: { ...f.seasonRef, [name.split(".")[1]]: value } }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
    setError("");
    setSuccess("");
  }

  function validate() {
    if (!form.farmName.trim()) return "Farm name is required.";
    if (!form.plotSize.value || isNaN(Number(form.plotSize.value)) || Number(form.plotSize.value) <= 0) return "Plot size must be a positive number.";
    if (!form.cropType) return "Crop type is required.";
    if (!form.seasonRef.year || isNaN(Number(form.seasonRef.year))) return "Year is required.";
    if (!form.language) return "Language is required.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await saveFarmSetup({
        ...form,
        plotSize: { value: Number(form.plotSize.value), unit: form.plotSize.unit },
        seasonRef: { season: form.seasonRef.season, year: Number(form.seasonRef.year) },
        workingHoursPerDay: Number(form.workingHoursPerDay) || 8,
      });
      setSuccess("Farm setup saved successfully.");
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to save setup.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card p-4 max-w-lg mx-auto mt-8" onSubmit={handleSubmit}>
      <h2 className="heading-2 mb-4">Farm Setup</h2>
      <div className="mb-3">
        <label className="form-label">Farm name *</label>
        <input className="form-control" name="farmName" value={form.farmName} onChange={handleChange} required />
      </div>
      <div className="mb-3">
        <label className="form-label">Farmer name</label>
        <input className="form-control" name="farmerName" value={form.farmerName} onChange={handleChange} />
      </div>
      <div className="mb-3 flex gap-2 items-end">
        <div className="flex-1">
          <label className="form-label">Plot size *</label>
          <input className="form-control" name="plotSize.value" value={form.plotSize.value} onChange={handleChange} required type="number" min="0.01" step="any" />
        </div>
        <div>
          <label className="form-label">Unit</label>
          <select className="form-select" name="plotSize.unit" value={form.plotSize.unit} onChange={handleChange}>
            <option value="ha">ha</option>
            <option value="m²">m²</option>
          </select>
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label">Crop type *</label>
        <select className="form-select" name="cropType" value={form.cropType} onChange={handleChange}>
          {cropOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="mb-3 flex gap-2 items-end">
        <div>
          <label className="form-label">Season *</label>
          <select className="form-select" name="seasonRef.season" value={form.seasonRef.season} onChange={handleChange}>
            {seasonOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Year *</label>
          <input className="form-control" name="seasonRef.year" value={form.seasonRef.year} onChange={handleChange} required type="number" min="2000" max="2100" />
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label">Language *</label>
        <select className="form-select" name="language" value={form.language} onChange={handleChange}>
          {languageOptions.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Working hours per day</label>
        <input className="form-control" name="workingHoursPerDay" value={form.workingHoursPerDay} onChange={handleChange} type="number" min="1" max="24" />
      </div>
      {error && <div className="alert alert-danger mb-2">{error}</div>}
      {success && <div className="alert alert-success mb-2">{success}</div>}
      <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Saving..." : "Save Setup"}</button>
    </form>
  );
}

export default FarmerSetup;
