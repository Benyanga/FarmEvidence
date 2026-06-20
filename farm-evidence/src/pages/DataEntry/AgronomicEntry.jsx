import { useMemo, useState } from "react";
import { saveAgronomic } from "../../services/api";

const FIELD_OPTIONS = {
  scoreRange: [1, 2, 3, 4, 5],
};

const inputClasses =
  "mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200";

function getNumeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildPredictiveImpact(formData) {
  const issues = [];
  if (getNumeric(formData.weedPressureScore) >= 4) {
    issues.push("High weed pressure may cut harvest volume and increase weeding costs.");
  }
  if (getNumeric(formData.pestIncidencePct) >= 30) {
    issues.push("Pest incidence above 30% is likely to reduce revenue and raise pesticide spending.");
  }
  if (getNumeric(formData.diseaseSeverity) >= 4) {
    issues.push("High disease severity often causes yield loss and extra disease-control interventions.");
  }
  if (getNumeric(formData.soilHealthScore) <= 2) {
    issues.push("Low soil health can impair nutrient uptake and lower overall plot performance.");
  }
  if (getNumeric(formData.residueCoverPct) < 40) {
    issues.push("Low residue cover increases moisture stress and may erode profit margins.");
  }
  if (getNumeric(formData.cropVigourScore) <= 2) {
    issues.push("Weak crop vigour is an early signal for below-average yield and higher recovery costs.");
  }
  return issues.length > 0 ? issues : ["No major agronomic risk signals detected from current entries."];
}

export function AgronomicEntry({ activePlotId, trialSeasonId, activePlotYield }) {
  const [formData, setFormData] = useState({
    weedPressureScore: "",
    pestIncidencePct: "",
    diseaseSeverity: "",
    soilHealthScore: "",
    residueCoverPct: "",
    cropVigourScore: "",
    lastIrrigationDate: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  const hasFormEntry = useMemo(
    () => Object.values(formData).some((value) => value !== "" && value !== null),
    [formData],
  );

  const impactSummary = useMemo(() => buildPredictiveImpact(formData), [formData]);

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!activePlotId || !trialSeasonId) {
      setError("Unable to save agronomic observations without a selected plot and trial season.");
      return;
    }
    if (!hasFormEntry) {
      setError("Enter at least one agronomic indicator before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    setNotificationMessage("");

    try {
      const payload = {
        plot_id: activePlotId,
        trial_season_id: trialSeasonId,
        observed_at: "HARVEST",
        mode: "research",
        weedPressureScore: getNumeric(formData.weedPressureScore),
        pestIncidencePct: getNumeric(formData.pestIncidencePct),
        diseaseSeverity: getNumeric(formData.diseaseSeverity),
        soilFaunaScore: getNumeric(formData.soilHealthScore),
        cropVigourScore: getNumeric(formData.cropVigourScore),
        observations: [
          formData.lastIrrigationDate ? `Last irrigation: ${formData.lastIrrigationDate}` : null,
          formData.residueCoverPct !== "" ? `Residue cover: ${formData.residueCoverPct}%` : null,
          formData.notes ? formData.notes : null,
        ]
          .filter(Boolean)
          .join(". "),
      };

      const response = await saveAgronomic(payload);
      if (!response || response.error || response.ok === false) {
        throw new Error(response?.error || "Unable to save agronomic record.");
      }

      setMessage("Agronomic observations saved successfully.");
      const alerts = response.alerts || [];
      const warnings = [];
      if (getNumeric(formData.weedPressureScore) >= 4) {
        warnings.push("High weed pressure has been detected.");
      }
      if (getNumeric(formData.pestIncidencePct) >= 30) {
        warnings.push("Pest incidence is elevated and may require immediate attention.");
      }
      if (alerts.length > 0) {
        warnings.push(...alerts.map((alert) => alert.message));
      }
      setNotificationMessage(warnings.length > 0 ? warnings.join(" ") : "No immediate agronomic alerts detected.");
    } catch (saveError) {
      setError(saveError?.message || "Failed to save agronomic observations.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Agronomic observations</h3>
            <p className="text-sm text-slate-600">Record field health indicators linked to plot performance and economic risk.</p>
          </div>
          <div className="text-sm text-slate-600">
            Current saved yield: {activePlotYield != null ? `${activePlotYield} kg/plot` : "Not recorded yet"}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>
      ) : null}
      {notificationMessage ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{notificationMessage}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Weed pressure score</span>
          <select
            value={formData.weedPressureScore}
            onChange={(event) => handleChange("weedPressureScore", event.target.value)}
            className={inputClasses}
          >
            <option value="">Select score</option>
            {FIELD_OPTIONS.scoreRange.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Pest incidence (%)</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.pestIncidencePct}
            onChange={(event) => handleChange("pestIncidencePct", event.target.value)}
            className={inputClasses}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Disease severity rating</span>
          <select
            value={formData.diseaseSeverity}
            onChange={(event) => handleChange("diseaseSeverity", event.target.value)}
            className={inputClasses}
          >
            <option value="">Select rating</option>
            {FIELD_OPTIONS.scoreRange.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Soil health score</span>
          <select
            value={formData.soilHealthScore}
            onChange={(event) => handleChange("soilHealthScore", event.target.value)}
            className={inputClasses}
          >
            <option value="">Select score</option>
            {FIELD_OPTIONS.scoreRange.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Residue cover (%)</span>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={formData.residueCoverPct}
            onChange={(event) => handleChange("residueCoverPct", event.target.value)}
            className={inputClasses}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Crop vigour rating</span>
          <select
            value={formData.cropVigourScore}
            onChange={(event) => handleChange("cropVigourScore", event.target.value)}
            className={inputClasses}
          >
            <option value="">Select rating</option>
            {FIELD_OPTIONS.scoreRange.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Last irrigation date</span>
          <input
            type="date"
            value={formData.lastIrrigationDate}
            onChange={(event) => handleChange("lastIrrigationDate", event.target.value)}
            className={inputClasses}
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Notes and observations</span>
        <textarea
          value={formData.notes}
          onChange={(event) => handleChange("notes", event.target.value)}
          className="mt-2 w-full min-h-[120px] rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="Add details on crop condition, field observations, pest control actions, or irrigation history."
        />
      </label>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-800">Predicted economic impact</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {impactSummary.map((item, index) => (
            <li key={index} className="pl-4 leading-6 text-slate-700">• {item}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          These agronomic observations help the analysis engine understand plot health risks and supply field-level warnings.
        </div>
        <button
          type="button"
          disabled={saving || !hasFormEntry}
          onClick={handleSave}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? "Saving…" : "Save Agronomic Data"}
        </button>
      </div>
    </div>
  );
}
