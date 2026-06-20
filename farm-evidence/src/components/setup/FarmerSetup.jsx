import { useSessionStore } from "../../store/sessionStore";
import { useDataStore } from "../../store/dataStore";

const CROP_OPTIONS = ["Maize", "Beans", "Wheat", "Sorghum", "Other"];
const SYSTEM_OPTIONS = ["CA", "CF"];

export function FarmerSetup() {
  const setup = useDataStore((s) => s.setup);
  const updateSetup = useDataStore((s) => s.updateSetup);
  const confirmSetup = useDataStore((s) => s.confirmSetup);
  const mode = useSessionStore((s) => s.mode);
  const sessionLanguage = useSessionStore((s) => s.language);

  const isReady =
    setup.farmName &&
    setup.cropType &&
    setup.plotSize &&
    setup.system &&
    Number(setup.adoptionStartSeason) > 0 &&
    Number(setup.currentSeason) > 0;

  return (
    <div className="card card--minimal">
      <h2 className="heading-2 mb-2">Farmer setup</h2>
      <div className="field-group">
        <label className="field-label">Farm name / identifier</label>
        <input
          className="field-input"
          placeholder="Farm name / identifier"
          value={setup.farmName ?? ""}
          onChange={(e) => updateSetup({ farmName: e.target.value })}
        />
      </div>
      <div className="field-group">
        <label className="field-label">Plot size (ha or m²)</label>
        <input
          className="field-input"
          placeholder="Plot size (ha or m²)"
          value={setup.plotSize ?? ""}
          onChange={(e) => updateSetup({ plotSize: e.target.value })}
        />
      </div>
      <div className="field-group">
        <label className="field-label">Crop type</label>
        <select
          className="field-input"
          value={setup.cropType ?? ""}
          onChange={(e) => updateSetup({ cropType: e.target.value })}
        >
          <option value="">Select crop type</option>
          {CROP_OPTIONS.map((crop) => (
            <option key={crop} value={crop}>
              {crop}
            </option>
          ))}
        </select>
      </div>
      <div className="field-group">
        <label className="field-label">Current farming system</label>
        <select
          className="field-input"
          value={setup.system ?? ""}
          onChange={(e) => updateSetup({ system: e.target.value })}
        >
          <option value="">Current farming system</option>
          {SYSTEM_OPTIONS.map((system) => (
            <option key={system} value={system}>
              {system}
            </option>
          ))}
        </select>
      </div>
      <div className="field-group">
        <label className="field-label">Current season index</label>
        <input
          className="field-input"
          placeholder="Current season index"
          type="number"
          value={setup.currentSeason ?? ""}
          onChange={(e) => updateSetup({ currentSeason: Number(e.target.value) })}
        />
      </div>
      <div className="field-group">
        <label className="field-label">Adoption start season index</label>
        <input
          className="field-input"
          placeholder="Adoption start season index"
          type="number"
          value={setup.adoptionStartSeason ?? ""}
          onChange={(e) => updateSetup({ adoptionStartSeason: Number(e.target.value) })}
        />
      </div>
      <div className="field-group">
        <label className="field-label">Language preference</label>
        <select
          className="field-input"
          value={setup.language ?? sessionLanguage}
          onChange={(e) => updateSetup({ language: e.target.value })}
          disabled={mode === "RESEARCH"}
        >
          <option value="en">English</option>
          <option value="rw">Kinyarwanda</option>
        </select>
      </div>
      <div className={`mb-4 ${isReady ? "state-positive" : "state-caution"}`}>
        {isReady ? "Ready" : "Required"}
      </div>
      <button
        type="button"
        className={`btn ${isReady ? "btn-primary" : "btn-disabled"}`}
        disabled={!isReady}
        onClick={() => confirmSetup(true)}
      >
        Confirm Setup
      </button>
      {setup.setupConfirmed ? (
        <p className="body-sm state-positive mt-4">Setup confirmed. You may proceed to cost and revenue entry.</p>
      ) : null}
    </div>
  );
}

