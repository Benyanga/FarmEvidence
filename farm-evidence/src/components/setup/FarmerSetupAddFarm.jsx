import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "../../store/dataStore";
import { SetupBreadcrumb } from "../../components/setup/SetupBreadcrumb";

const CROP_OPTIONS = ["Beans", "Maize", "Sorghum", "Wheat", "Sweet potato", "Cassava", "Other"];
const SYSTEM_OPTIONS = ["CA", "CF"];

const clamp = (value, min = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(number, min) : 0;
};

const formatArea = (value) => (value > 0 ? `${value.toFixed(1)} m²` : "—");

const seasonIndex = (season) =>
  season === "A" ? 0 : season === "B" ? 1 : season === "C" ? 2 : 0;

const inputStyle = {
  width: "100%",
  minHeight: "40px",
  borderRadius: "8px",
  border: "1px solid var(--fe-grey-200)",
  padding: "0 12px",
  fontSize: "14px",
  color: "var(--fe-grey-900)",
  background: "var(--fe-white)",
  outline: "none",
};

const labelStyle = {
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--fe-grey-400)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const cardStyle = {
  borderRadius: "14px",
  border: "1px solid var(--fe-grey-200)",
  boxShadow: "var(--fe-shadow-surface)",
  padding: "20px",
};

const kpiCardStyle = {
  borderRadius: "14px",
  background: "var(--fe-white)",
  border: "1px solid var(--fe-grey-200)",
  boxShadow: "var(--fe-shadow-surface)",
  padding: "14px",
};

export function FarmerSetupAddFarm({ year, season }) {
  const navigate = useNavigate();
  const addFarmSeasonRecord = useDataStore((s) => s.addFarmSeasonRecord);
  const addFarmSeasonRecordRemote = useDataStore((s) => s.addFarmSeasonRecordRemote);
  const findFarmMatches = useDataStore((s) => s.findFarmMatches);
  const farmSeasonRecords = useDataStore((s) => s.farmSeasonRecords);
  const [formValues, setFormValues] = useState({
    farmName: "",
    cropType: "",
    farmingSystem: "",
    length: "",
    width: "",
    interRow: "",
    intraRow: "",
    seedsPerHill: "",
    adoptionStartSeason: "",
    adoptionStartSeasonYear: year,
    linkChoice: "unknown",
  });
  const [saveError, setSaveError] = useState("");

  const matchedFarms = useMemo(
    () => (formValues.farmName.trim() ? findFarmMatches(formValues.farmName) : []),
    [formValues.farmName, findFarmMatches],
  );

  const chosenMatch = matchedFarms[0];
  const matchingSeason = useMemo(() => {
    if (!chosenMatch) return null;
    const record = Object.values(farmSeasonRecords).find(
      (item) => item.farmId === chosenMatch.id,
    );
    return record ? `Season ${record.season} ${record.year}` : null;
  }, [chosenMatch, farmSeasonRecords]);

  const length = clamp(formValues.length);
  const width = clamp(formValues.width);
  const interRow = clamp(formValues.interRow, 0);
  const intraRow = clamp(formValues.intraRow, 0);
  const seedsPerHill = Math.max(Math.round(Number(formValues.seedsPerHill) || 0), 0);

  const plotArea = length * width;
  const extrapolationFactor = plotArea > 0 ? 10000 / plotArea : 0;
  const rowsPerPlot = length > 0 && interRow > 0 ? Math.floor(length / interRow) : null;
  const hillsPerRow = width > 0 && intraRow > 0 ? Math.floor(width / intraRow) : null;
  const hillsPerPlot = rowsPerPlot != null && hillsPerRow != null ? rowsPerPlot * hillsPerRow : null;
  const seedsPerPlot = hillsPerPlot != null ? hillsPerPlot * seedsPerHill : null;
  const plantPopulation = plotArea > 0 && seedsPerPlot != null ? seedsPerPlot * extrapolationFactor : null;

  const adoptionSeason = formValues.adoptionStartSeason;
  const adoptionYear = Number(formValues.adoptionStartSeasonYear || year);
  const currentIndex = (Number(year) * 3) + seasonIndex(season);
  const adoptionIndex = adoptionYear * 3 + seasonIndex(adoptionSeason || season);
  const seasonsElapsed = Math.max(0, currentIndex - adoptionIndex);
  const phase = seasonsElapsed <= 3 ? "TRANSITION" : seasonsElapsed <= 6 ? "STABILISATION" : "MATURE";
  const phi = phase === "TRANSITION" ? 0.3 : phase === "STABILISATION" ? 0.7 : 1.0;
  const phaseLabel =
    phase === "TRANSITION" ? "Transition phase" : phase === "STABILISATION" ? "Stabilisation phase" : "Mature phase";

  const yearOptions = Array.from({ length: Math.max(1, Number(year) - 2023) }, (_, index) => 2024 + index);

  const isFormValid =
    formValues.farmName.trim().length > 0 &&
    formValues.cropType &&
    formValues.farmingSystem &&
    length > 0 &&
    width > 0 &&
    interRow > 0 &&
    intraRow > 0 &&
    seedsPerHill >= 1 &&
    adoptionSeason;

  const handleSaveFarm = async () => {
    setSaveError("");
    if (!formValues.farmName.trim()) { setSaveError("Farm name is required."); return; }
    if (!formValues.cropType || !formValues.farmingSystem) { setSaveError("Crop type and farming system must be selected."); return; }
    if (length <= 0 || width <= 0) { setSaveError("Length and width must both be greater than 0."); return; }
    if (!adoptionSeason) { setSaveError("Adoption start season must be set."); return; }

    const payload = {
      year: Number(year),
      season,
      farmName: formValues.farmName.trim(),
      cropType: formValues.cropType,
      farmingSystem: formValues.farmingSystem,
      plot_length_m: length,
      plot_width_m: width,
      plot_m2: parseFloat(plotArea.toFixed(1)),
      plot_area_m2: parseFloat(plotArea.toFixed(1)),
      extrapolation_factor: parseFloat(extrapolationFactor.toFixed(4)),
      inter_row_m: interRow,
      intra_row_m: intraRow,
      seeds_per_hill: seedsPerHill,
      hills_per_plot: hillsPerPlot || 0,
      seeds_per_plot: seedsPerPlot || 0,
      plant_pop_per_ha: Math.round(plantPopulation || 0),
      farming_system: formValues.farmingSystem,
      adoption_start_season: `${formValues.adoptionStartSeason} ${formValues.adoptionStartSeasonYear || year}`,
      phase,
      phi,
      linkedFarmId: formValues.linkChoice === "yes" && chosenMatch ? chosenMatch.id : undefined,
      status: "CONFIGURED",
    };

    const { localId, remote } = await addFarmSeasonRecordRemote(payload);
    if (!localId) {
      setSaveError("Failed to save farm record locally.");
      return;
    }
    if (remote && remote.ok === false) {
      setSaveError(remote.error || "Saved locally but failed to sync with the backend.");
      return;
    }

    navigate(`/setup/${year}/${season}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <SetupBreadcrumb
        items={[
          { label: "Years", to: "/setup" },
          { label: year, to: `/setup/${year}` },
          { label: `Season ${season} ${year}`, to: `/setup/${year}/${season}` },
          { label: "New farm" },
        ]}
      />
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--fe-grey-900)" }}>
          New farm
          {" "}— Season {season} {year}
        </h1>
        <span style={{ fontSize: "13px", color: "var(--fe-grey-500)", display: "block", marginTop: "4px" }}>
          Save the farm record to return to the season overview
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* ── Farm identity ── */}
        <section style={cardStyle}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)", marginBottom: "12px", display: "block" }}>
            Farm identity
          </span>
          <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, 1fr)" }}>
            {/* farm name */}
            <div style={{ display: "grid", gap: "4px" }}>
              <span style={labelStyle}>Farm name</span>
              <input
                type="text"
                value={formValues.farmName}
                onChange={(e) => setFormValues((p) => ({ ...p, farmName: e.target.value, linkChoice: "unknown" }))}
                placeholder="e.g. Musha home plot"
                style={inputStyle}
              />
            </div>
            {/* crop */}
            <div style={{ display: "grid", gap: "4px" }}>
              <span style={labelStyle}>Crop</span>
              <select
                value={formValues.cropType}
                onChange={(e) => setFormValues((p) => ({ ...p, cropType: e.target.value }))}
                style={inputStyle}
              >
                <option value="">Select crop</option>
                {CROP_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          {chosenMatch && matchingSeason ? (
            <div
              style={{
                marginTop: "12px",
                borderRadius: "14px",
                border: "1px solid var(--fe-grey-200)",
                background: "var(--fe-grey-050)",
                padding: "16px",
                fontSize: "13px",
                color: "var(--fe-grey-700)",
              }}
            >
              <span>Farm name matched in {matchingSeason}</span>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 500,
                    background: formValues.linkChoice === "yes" ? "var(--fe-teal-900)" : "var(--fe-white)",
                    color: formValues.linkChoice === "yes" ? "var(--fe-white)" : "var(--fe-grey-900)",
                    border: formValues.linkChoice === "yes" ? "none" : "1px solid var(--fe-grey-200)",
                    cursor: "pointer",
                  }}
                  onClick={() => setFormValues((p) => ({ ...p, linkChoice: "yes" }))}
                >
                  Link them
                </button>
                <button
                  type="button"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 500,
                    background: formValues.linkChoice === "no" ? "var(--fe-teal-900)" : "var(--fe-white)",
                    color: formValues.linkChoice === "no" ? "var(--fe-white)" : "var(--fe-grey-900)",
                    border: formValues.linkChoice === "no" ? "none" : "1px solid var(--fe-grey-200)",
                    cursor: "pointer",
                  }}
                  onClick={() => setFormValues((p) => ({ ...p, linkChoice: "no" }))}
                >
                  Create new
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* ── Plot dimensions ── */}
        <section style={cardStyle}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)", marginBottom: "12px", display: "block" }}>
            Plot dimensions
          </span>
          <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(3, 1fr)" }}>
            {/* length */}
            <div style={{ display: "grid", gap: "4px" }}>
              <span style={labelStyle}>Length</span>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formValues.length}
                onChange={(e) => setFormValues((p) => ({ ...p, length: e.target.value }))}
                style={inputStyle}
              />
            </div>
            {/* width */}
            <div style={{ display: "grid", gap: "4px" }}>
              <span style={labelStyle}>Width</span>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formValues.width}
                onChange={(e) => setFormValues((p) => ({ ...p, width: e.target.value }))}
                style={inputStyle}
              />
            </div>
            {/* plot area (computed) */}
            <div style={{ display: "grid", gap: "4px" }}>
              <span style={labelStyle}>Plot area</span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--fe-grey-200)",
                  background: "var(--fe-grey-050)",
                  fontSize: "14px",
                  color: "var(--fe-grey-900)",
                }}
              >
                {formatArea(plotArea)}
              </div>
            </div>
          </div>
        </section>

        {/* ── Crop and spacing ── */}
        <section style={cardStyle}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)", marginBottom: "12px", display: "block" }}>
            Crop and spacing
          </span>
          <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, 1fr)" }}>
            {/* crop */}
            <div style={{ display: "grid", gap: "4px" }}>
              <span style={labelStyle}>Crop</span>
              <select
                value={formValues.cropType}
                onChange={(e) => setFormValues((p) => ({ ...p, cropType: e.target.value }))}
                style={inputStyle}
              >
                <option value="">Select crop</option>
                {CROP_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            {/* inter row */}
            <div style={{ display: "grid", gap: "4px" }}>
              <span style={labelStyle}>Inter row spacing</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formValues.interRow}
                onChange={(e) => setFormValues((p) => ({ ...p, interRow: e.target.value }))}
                style={inputStyle}
              />
            </div>
            {/* intra row */}
            <div style={{ display: "grid", gap: "4px" }}>
              <span style={labelStyle}>Intra row spacing</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formValues.intraRow}
                onChange={(e) => setFormValues((p) => ({ ...p, intraRow: e.target.value }))}
                style={inputStyle}
              />
            </div>
            {/* seeds per hill */}
            <div style={{ display: "grid", gap: "4px" }}>
              <span style={labelStyle}>Seeds per planting hill</span>
              <input
                type="number"
                min="1"
                step="1"
                value={formValues.seedsPerHill}
                onChange={(e) => setFormValues((p) => ({ ...p, seedsPerHill: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* computed KPI mini-cards */}
          <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(3, 1fr)", marginTop: "12px" }}>
            <div style={kpiCardStyle}>
              <span style={{ fontSize: "11px", color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Hills per plot</span>
              <span style={{ fontSize: "16px", fontWeight: 600, color: hillsPerPlot != null ? "var(--fe-grey-900)" : "var(--fe-grey-400)", marginTop: "4px", display: "block" }}>
                {hillsPerPlot != null ? `${hillsPerPlot} hills` : "—"}
              </span>
            </div>
            <div style={kpiCardStyle}>
              <span style={{ fontSize: "11px", color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Seeds per plot</span>
              <span style={{ fontSize: "16px", fontWeight: 600, color: seedsPerPlot != null ? "var(--fe-grey-900)" : "var(--fe-grey-400)", marginTop: "4px", display: "block" }}>
                {seedsPerPlot != null ? seedsPerPlot : "—"}
              </span>
            </div>
            <div style={kpiCardStyle}>
              <span style={{ fontSize: "11px", color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Plant population/ha</span>
              <span style={{ fontSize: "16px", fontWeight: 600, color: plantPopulation != null ? "var(--fe-grey-900)" : "var(--fe-grey-400)", marginTop: "4px", display: "block" }}>
                {plantPopulation != null ? `${Math.round(plantPopulation)} seeds/ha` : "—"}
              </span>
            </div>
          </div>
        </section>

        {/* ── Farming system ── */}
        <section style={cardStyle}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)", marginBottom: "12px", display: "block" }}>
            Farming system
          </span>
          <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(2, 1fr)", marginBottom: "14px" }}>
            {SYSTEM_OPTIONS.map((option) => (
              <label
                key={option}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  borderRadius: "14px",
                  border: "1px solid var(--fe-grey-200)",
                  background: "var(--fe-white)",
                  padding: "14px 16px",
                }}
              >
                <input
                  type="radio"
                  name="farmingSystem"
                  value={option}
                  checked={formValues.farmingSystem === option}
                  onChange={(e) => setFormValues((p) => ({ ...p, farmingSystem: e.target.value }))}
                  style={{ accentColor: "var(--fe-teal-900)" }}
                />
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--fe-grey-900)" }}>{option}</span>
              </label>
            ))}
          </div>
          {formValues.farmingSystem ? (
            <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, 1fr)" }}>
              {/* adoption season */}
              <div style={{ display: "grid", gap: "4px" }}>
                <span style={labelStyle}>Adoption start season</span>
                <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "1fr 1fr" }}>
                  <select
                    value={formValues.adoptionStartSeason}
                    onChange={(e) => setFormValues((p) => ({ ...p, adoptionStartSeason: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Season</option>
                    {["A", "B", "C"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={formValues.adoptionStartSeasonYear || year}
                    onChange={(e) => setFormValues((p) => ({ ...p, adoptionStartSeasonYear: e.target.value }))}
                    style={inputStyle}
                  >
                    {yearOptions.map((optionYear) => (
                      <option key={optionYear} value={optionYear}>{optionYear}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* phase pill */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  borderRadius: "14px",
                  background: "var(--fe-grey-050)",
                  padding: "16px",
                  border: "1px solid var(--fe-grey-100)",
                  gap: "4px",
                  alignItems: "baseline",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)" }}>{phaseLabel}</span>
              </div>
            </div>
          ) : null}
        </section>

        {saveError ? (
          <div
            style={{
              borderRadius: "10px",
              border: "1px solid var(--fe-critical)",
              background: "var(--fe-error-bg)",
              padding: "12px 16px",
              fontSize: "13px",
              color: "var(--fe-profit-neg)",
            }}
          >
            {saveError}
          </div>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(`/setup/${year}/${season}`)}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveFarm}
            disabled={!isFormValid}
            className={isFormValid ? "btn btn-primary" : "btn btn-primary btn-disabled"}
          >
            {isFormValid ? "Save farm" : "Complete form to save"}
          </button>
        </div>
      </div>
    </div>
  );
}
