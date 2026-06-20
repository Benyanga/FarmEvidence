import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "../../store/dataStore";
import { SetupBreadcrumb } from "./SetupBreadcrumb";
import { ScreenTopbar } from "../shared/ScreenTopbar";
import { useSessionStore } from "../../store/sessionStore";
import HideMechanism from "../shared/HideMechanism";

const CROP_OPTIONS = ["Beans", "Maize", "Sorghum", "Wheat", "Sweet potato", "Cassava", "Other"];
const TREATMENT_OPTIONS = [
  {
    code: "CA",
    name: "Conservation Agriculture",
    color: "var(--fe-teal-900)",
    description:
      "List all Conservation Agriculture practices that will be applied: tillage method (e.g. minimum/zero tillage), soil cover management (e.g. residue retained, target % cover), weed control method (e.g. hand weeding only, no herbicide), fertiliser use (e.g. none, organic only). Include what field staff should observe and record, and what outcomes are expected from this treatment.",
  },
  {
    code: "CF",
    name: "Conventional Farming",
    color: "var(--fe-amber-700)",
    description:
      "List all Conventional Farming practices: tillage method and number of passes (e.g. 2× hand hoe), residue management (e.g. burned or removed), weed control (e.g. herbicide + hand weeding), fertiliser type and rate. Include what to observe and expected outcomes.",
  },
  {
    code: "CA+",
    name: "Conservation Agriculture with additional inputs",
    color: "var(--fe-teal-700)",
    description:
      "List all practices for CA with additional inputs: same CA principles plus added inputs (e.g. micro-dosing fertiliser, improved seed variety). Document what inputs are added beyond baseline CA and why.",
  },
  {
    code: "CF+",
    name: "Conventional Farming with additional inputs",
    color: "var(--fe-t3-text)",
    description:
      "List all practices for CF with additional inputs: full conventional tillage plus enhanced inputs (e.g. full NPK rate, pesticide programme). Document all inputs and expected response vs baseline CF.",
  },
];

const clamp = (value, min = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(number, min) : 0;
};

const formatArea = (value) => (value > 0 ? `${value.toFixed(1)} m²` : "—");

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildRandomLayout(treatments, replications, seedString) {
  const seed = xmur3(seedString)();
  const rand = mulberry32(seed);

  const shuffle = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  return Array.from({ length: replications }, () => shuffle(treatments));
}

export function ResearchTrialForm({ year, season }) {
  const navigate = useNavigate();
  const addFarmSeasonRecord = useDataStore((s) => s.addFarmSeasonRecord);
  const addFarmSeasonRecordRemote = useDataStore((s) => s.addFarmSeasonRecordRemote);
  const [formValues, setFormValues] = useState({
    siteName: "",
    location: "",
    cropScientificName: "",
    variety: "",
    plantingDate: "",
    previousCrop: "",
    length: "",
    width: "",
    boundary_buffer_m: "",
    inter_plot_buffer_length_m: "",
    inter_rep_buffer_width_m: "",
    cropType: "",
    interRow: "",
    intraRow: "",
    seedsPerHill: "",
    treatments: [],
    treatmentDescriptions: {},
    sharedInputs: "",
    replications: "",
    thousand_seed_weight_g: "0",
    germination_rate_pct: "0",
    seed_purity_pct: "0",
    seed_replacement_factor: "1.10",
    workingHoursPerDay: "8",
    marketPricePerKg: "0",
    seedPricePerKg: "0",
    seedRateKgPerPlot: "0",
  });
  const [layoutData, setLayoutData] = useState({ layout: [], seed: "", generatedAt: null });
  const [saveError, setSaveError] = useState("");

   const length = clamp(formValues.length);
   const width = clamp(formValues.width);
   const boundaryBuffer = clamp(formValues.boundary_buffer_m, 0);
   const interPlotBufferLength = clamp(formValues.inter_plot_buffer_length_m, 0);
   const interRepBufferWidth = clamp(formValues.inter_rep_buffer_width_m, 0);
   const cropType = formValues.cropType;
  const cropScientificName = formValues.cropScientificName.trim();
  const variety = formValues.variety.trim();
  const plantingDate = formValues.plantingDate;
  const previousCrop = formValues.previousCrop.trim();
  const sharedInputs = formValues.sharedInputs.trim();
  const interRow = clamp(formValues.interRow, 0);
  const intraRow = clamp(formValues.intraRow, 0);
  const seedsPerHill = Math.max(Math.round(Number(formValues.seedsPerHill) || 0), 0);
  const replications = Math.max(Math.round(Number(formValues.replications) || 0), 0);
  const treatments = formValues.treatments;
  const thousandSeedWeight = clamp(formValues.thousand_seed_weight_g, 0);
  const germinationRate = clamp(formValues.germination_rate_pct, 0);
  const seedPurity = clamp(formValues.seed_purity_pct, 0);
  const seedReplacementFactor = Math.max(Number(formValues.seed_replacement_factor) || 1.1, 0.1);
  const workingHoursPerDay = Math.max(Number(formValues.workingHoursPerDay) || 8, 0);
  const marketPricePerKg = Math.max(Number(formValues.marketPricePerKg) || 0, 0);
  const seedPricePerKg = Math.max(Number(formValues.seedPricePerKg) || 0, 0);
  const seedRateKgPerPlot = Math.max(Number(formValues.seedRateKgPerPlot) || 0, 0);

  const nTreatments = treatments.length;
  const totalPlots = nTreatments * replications;
  const plotArea = length * width;
  const extrapolationFactor = plotArea > 0 ? 10000 / plotArea : 0;
  const siteLength = length > 0 && nTreatments > 0 ? 2 * boundaryBuffer + nTreatments * length + Math.max(0, nTreatments - 1) * interPlotBufferLength : 0;
  const siteWidth = width > 0 && replications > 0 ? 2 * boundaryBuffer + replications * width + Math.max(0, replications - 1) * interRepBufferWidth : 0;
  const siteArea = siteLength > 0 && siteWidth > 0 ? siteLength * siteWidth : 0;
  const siteAreaHa = siteArea > 0 ? siteArea / 10000 : 0;
  const totalPlotArea = plotArea * totalPlots;
  const totalPlotAreaHa = totalPlotArea / 10000;
  const bufferArea = Math.max(siteArea - totalPlotArea, 0);
  const treatmentArea = plotArea * replications;
  const treatmentAreaHa = treatmentArea / 10000;
  const siteColumnSizes = [boundaryBuffer];
  for (let index = 0; index < nTreatments; index += 1) {
    siteColumnSizes.push(length);
    if (index < nTreatments - 1) siteColumnSizes.push(interPlotBufferLength);
  }
  siteColumnSizes.push(boundaryBuffer);
  const siteRowSizes = [boundaryBuffer];
  for (let index = 0; index < replications; index += 1) {
    siteRowSizes.push(width);
    if (index < replications - 1) siteRowSizes.push(interRepBufferWidth);
  }
  siteRowSizes.push(boundaryBuffer);
  const siteColumnPercent = siteLength > 0 ? siteColumnSizes.map((size) => (size / siteLength) * 100) : [];
  const siteRowPercent = siteWidth > 0 ? siteRowSizes.map((size) => (size / siteWidth) * 100) : [];
  const siteColumnTypes = siteColumnSizes.map((_, idx) => (idx === 0 || idx === siteColumnSizes.length - 1 ? "boundary" : idx % 2 === 1 ? "plot" : "buffer"));
  const siteRowTypes = siteRowSizes.map((_, idx) => (idx === 0 || idx === siteRowSizes.length - 1 ? "boundary" : idx % 2 === 1 ? "plot" : "buffer"));
  const optionColor = (code) => TREATMENT_OPTIONS.find((item) => item.code === code)?.color || "var(--fe-white)";
  const rowsPerPlot = length > 0 && interRow > 0 ? Math.floor(length / interRow) : null;
  const hillsPerRow = width > 0 && intraRow > 0 ? Math.floor(width / intraRow) : null;
  const totalHills = rowsPerPlot != null && hillsPerRow != null ? rowsPerPlot * hillsPerRow : null;
  const seedsPerPlot = totalHills != null ? totalHills * seedsPerHill : null;
  const cropPopulationPerPlot = seedsPerPlot != null ? Math.round(seedsPerPlot) : null;
  const plantPopulation = plotArea > 0 && seedsPerPlot != null ? seedsPerPlot * extrapolationFactor : null;
  const cropPopulationPerHa = plantPopulation != null ? Math.round(plantPopulation) : null;
  const seedDenominator = 1000 * (germinationRate / 100) * (seedPurity / 100);
  const seedRateKgHa = plotArea > 0 && plantPopulation != null && thousandSeedWeight > 0 && seedDenominator > 0
    ? (plantPopulation * thousandSeedWeight * seedReplacementFactor) / seedDenominator
    : null;
  const seedPerPlotKg = seedsPerPlot != null && thousandSeedWeight > 0 && seedDenominator > 0
    ? (seedsPerPlot * thousandSeedWeight * seedReplacementFactor) / seedDenominator
    : null;
  const totalTrialSeedKg = seedPerPlotKg != null ? seedPerPlotKg * totalPlots : null;
  const statTestLabel = treatments.length === 2 ? "Welch's independent t-test" : "One-way ANOVA with Tukey HSD";

  const validation = {
    siteName: formValues.siteName.trim().length > 0,
    location: formValues.location.trim().length > 0,
    length: length > 0,
    width: width > 0,
    boundaryBuffer: boundaryBuffer >= 0,
    interPlotBufferLength: interPlotBufferLength >= 0,
    interRepBufferWidth: interRepBufferWidth >= 0,
    cropType: Boolean(cropType),
    variety: variety.length > 0,
    plantingDate: Boolean(plantingDate),
    previousCrop: previousCrop.length > 0,
    interRow: interRow > 0,
    intraRow: intraRow > 0,
    seedsPerHill: seedsPerHill >= 1,
    treatments: treatments.length >= 2,
    descriptions: treatments.every((code) => {
      const desc = formValues.treatmentDescriptions[code] || {};
      return (
        (desc.soilDisturbance || "").trim().length >= 30 &&
        (desc.soilCover || "").trim().length >= 30 &&
        (desc.cropRotation || "").trim().length >= 30
      );
    }),
    replications: replications >= 2 && replications <= 6,
    totalPlots: totalPlots > 0,
    siteArea: siteArea > 0,
    layout: layoutData.layout.length === replications && treatments.length >= 2,
  };

  const isFormReady =
    Object.values(validation).every((valid) => valid) && plotArea > 0 && layoutData.layout.length > 0;

  const trialTitle = useMemo(
    () => `New trial — Season ${season} ${year}`,
    [season, year],
  );

  const headerStatus = `${treatments.length} treatment${treatments.length === 1 ? "" : "s"} · ${replications} rep${replications === 1 ? "" : "s"}`;

  const treatmentOptions = TREATMENT_OPTIONS.map((option) => {
    const selected = treatments.includes(option.code);
    return (
      <label key={option.code} className="flex cursor-pointer items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300">
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => {
            const nextSelected = event.target.checked
              ? [...treatments, option.code].slice(0, 4)
              : treatments.filter((code) => code !== option.code);
            setFormValues((prev) => ({
              ...prev,
              treatments: nextSelected,
            }));
          }}
          disabled={!selected && treatments.length >= 4}
          className="h-4 w-4 rounded border-slate-300 text-slate-900"
        />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ background: option.color }} />
            <span className="font-semibold text-slate-900">{option.code}</span>
            <span className="text-sm text-slate-500">{option.name}</span>
          </div>
        </div>
      </label>
    );
  });

  const handleTreatmentDescriptionChange = (code, field, value) => {
    setFormValues((prev) => ({
      ...prev,
      treatmentDescriptions: {
        ...prev.treatmentDescriptions,
        [code]: {
          ...(prev.treatmentDescriptions[code] ?? {}),
          [field]: value,
        },
      },
    }));
  };

  const handleGenerateLayout = () => {
    if (treatments.length < 2 || replications < 2) return;
    const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const layout = buildRandomLayout(treatments, replications, seed);
    setLayoutData({ layout, seed, generatedAt: new Date().toISOString() });
  };

  const plotRows = layoutData.layout.map((row, index) => ({ rep: index + 1, cells: row }));
  const plotLabels = plotRows.map((row) => `Rep ${row.rep}: ${row.cells.join(" · ")}`).join("\n");

  const handleSaveTrial = async () => {
    console.log('ResearchTrialForm.handleSaveTrial', { isFormReady });
    setSaveError("");

    if (!isFormReady) {
      setSaveError("Please address all setup requirements and generate the RCBD layout before saving.");
      return;
    }

    const payload = {
      year: Number(year),
      season,
      farmName: formValues.siteName.trim(),
      cropType,
      plot_length_m: length,
      plot_width_m: width,
      plot_m2: parseFloat(plotArea.toFixed(1)),
      extrapolation_factor: parseFloat(extrapolationFactor.toFixed(4)),
      inter_row_m: interRow,
      intra_row_m: intraRow,
      seeds_per_hill: seedsPerHill,
      hills_per_plot: totalHills || 0,
      seeds_per_plot: seedsPerPlot || 0,
      plant_pop_per_ha: Math.round(plantPopulation || 0),
      treatments,
      trial_design: "RCBD",
      plot_dimensions: `${length.toFixed(1)}×${width.toFixed(1)}`,
      crop_scientific_name: cropScientificName,
      treatment_descriptions: formValues.treatmentDescriptions,
      shared_inputs: sharedInputs,
      n_replications: replications,
      total_plots: totalPlots,
      plot_labels: plotRows.flatMap((row) => row.cells),
      randomisation_layout: layoutData.layout,
      randomisation_seed: layoutData.seed,
      stat_test: treatments.length === 2 ? "T_TEST" : "ANOVA",
      site_name: formValues.siteName.trim(),
      location: formValues.location.trim(),
      variety,
      plantingDate,
      previousCrop,
      boundary_buffer_m: boundaryBuffer,
      inter_plot_buffer_length_m: interPlotBufferLength,
      inter_rep_buffer_width_m: interRepBufferWidth,
      site_length_m: parseFloat(siteLength.toFixed(1)),
      site_width_m: parseFloat(siteWidth.toFixed(1)),
      site_area_m2: parseFloat(siteArea.toFixed(1)),
      site_area_ha: parseFloat(siteAreaHa.toFixed(4)),
      total_plot_area_m2: parseFloat(totalPlotArea.toFixed(1)),
      total_plot_area_ha: parseFloat(totalPlotAreaHa.toFixed(4)),
      workingHoursPerDay: workingHoursPerDay,
      marketPricePerKg: marketPricePerKg,
      seedPricePerKg: seedPricePerKg,
      seedRateKgPerPlot: seedRateKgPerPlot,
      crop_population_per_plot: cropPopulationPerPlot,
      crop_population_per_ha: cropPopulationPerHa,
      plotData: [],
      buffer_area_m2: parseFloat(bufferArea.toFixed(1)),
      treatment_area_m2: parseFloat(treatmentArea.toFixed(1)),
      treatment_area_ha: parseFloat(treatmentAreaHa.toFixed(4)),
      thousand_seed_weight_g: thousandSeedWeight,
      germination_rate_pct: germinationRate,
      seed_purity_pct: seedPurity,
      seed_replacement_factor: seedReplacementFactor,
      seed_rate_kg_ha: seedRateKgHa != null ? parseFloat(seedRateKgHa.toFixed(2)) : null,
      total_trial_seed_kg: totalTrialSeedKg != null ? parseFloat(totalTrialSeedKg.toFixed(2)) : null,
      status: "CONFIGURED",
    };

    const { localId, remote } = await addFarmSeasonRecordRemote(payload);
    if (!localId) {
      setSaveError("Failed to save trial record locally.");
      return;
    }
    if (remote && remote.ok === false) {
      setSaveError(remote.error || "Saved locally but failed to sync with the backend.");
      return;
    }

    navigate(`/setup/${year}/${season}`);
  };

  return (
    <div className="space-y-6 p-4">
      <SetupBreadcrumb
        items={[
          { label: "Years", to: "/setup" },
          { label: year, to: `/setup/${year}` },
          { label: `Season ${season} ${year}`, to: `/setup/${year}/${season}` },
          { label: "New trial" },
        ]}
      />

      <ScreenTopbar
        superText="Setup"
        title={trialTitle}
        meta={`Configure a trial for Season ${season} ${year}`}
        mode={useSessionStore((s) => s.mode)}
        status={headerStatus}
      />

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Site information</h2>
              <p className="text-sm text-slate-500">Enter the trial site details for reporting and analysis context.</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Site name</span>
              <input
                type="text"
                value={formValues.siteName}
                onChange={(event) => setFormValues((prev) => ({ ...prev, siteName: event.target.value }))}
                placeholder="e.g. Tuzamurane Youth Cooperative"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Location / sector</span>
              <input
                type="text"
                value={formValues.location}
                onChange={(event) => setFormValues((prev) => ({ ...prev, location: event.target.value }))}
                placeholder="e.g. Musha Sector, Rwamagana District"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Trial design</h2>
            <p className="text-sm text-slate-500">This experiment uses a randomized complete block design. Enter the treatment and replication details to generate the layout.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Design</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">RCBD</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Planned plots</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{totalPlots > 0 ? `${totalPlots}` : "—"}</div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Plot and site geometry</h2>
            <p className="text-sm text-slate-500">Enter plot dimensions and buffer widths. The form computes the full trial footprint from the layout settings.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Length (m)</span>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formValues.length}
                onChange={(event) => setFormValues((prev) => ({ ...prev, length: event.target.value }))}
                placeholder="0.0"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              <div className="text-xs text-slate-500">metres</div>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Width (m)</span>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formValues.width}
                onChange={(event) => setFormValues((prev) => ({ ...prev, width: event.target.value }))}
                placeholder="0.0"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              <div className="text-xs text-slate-500">metres</div>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Plot area (m²)</span>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">{formatArea(plotArea)}</div>
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 mt-6">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Boundary buffer (m)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formValues.boundary_buffer_m}
                onChange={(event) => setFormValues((prev) => ({ ...prev, boundary_buffer_m: event.target.value }))}
                placeholder="2.0"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              <div className="text-xs text-slate-500">Distance from the site boundary to the nearest plot on all four sides.</div>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Inter-plot buffer — along length (m)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formValues.inter_plot_buffer_length_m}
                onChange={(event) => setFormValues((prev) => ({ ...prev, inter_plot_buffer_length_m: event.target.value }))}
                placeholder="1.0"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              <div className="text-xs text-slate-500">Pathway width between adjacent plots arranged side by side.</div>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Inter-replication buffer — across width (m)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formValues.inter_rep_buffer_width_m}
                onChange={(event) => setFormValues((prev) => ({ ...prev, inter_rep_buffer_width_m: event.target.value }))}
                placeholder="1.0"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              <div className="text-xs text-slate-500">Pathway width between replication rows, measured across plot width.</div>
            </label>
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>Buffer zones along length: {nTreatments + 1} total · 2 boundary buffers of {boundaryBuffer.toFixed(1)}m each · {Math.max(0, nTreatments - 1)} inter-plot buffers of {interPlotBufferLength.toFixed(1)}m each.</p>
            <p className="mt-2">Buffer zones across width: {replications + 1} total · 2 boundary buffers of {boundaryBuffer.toFixed(1)}m each · {Math.max(0, replications - 1)} inter-replication buffers of {interRepBufferWidth.toFixed(1)}m each.</p>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>The summary below shows the trial footprint, plot area, buffer allocation, and seed planning values.</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Length</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{length > 0 && nTreatments > 0 ? `${siteLength.toFixed(2)} m` : '—'}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Width</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{width > 0 && replications > 0 ? `${siteWidth.toFixed(2)} m` : '—'}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Area</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{siteLength > 0 && siteWidth > 0 ? `${Math.round(siteArea)} m²` : '—'}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Area (ha)</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{siteLength > 0 && siteWidth > 0 ? `${siteAreaHa.toFixed(4)} ha` : '—'}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Plot</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{plotArea > 0 ? `${plotArea.toFixed(1)} m²` : '—'}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Factor</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{plotArea > 0 ? extrapolationFactor.toFixed(4) : '—'}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Plots area</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{totalPlotArea > 0 ? `${Math.round(totalPlotArea)} m²` : '—'}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Buffer</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{siteLength > 0 && siteWidth > 0 && plotArea > 0 ? `${Math.round(bufferArea)} m²` : '—'}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Planting stations / plot</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{totalHills != null && totalHills > 0 ? totalHills : '—'}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Population / plot</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{cropPopulationPerPlot != null && cropPopulationPerPlot > 0 ? cropPopulationPerPlot.toLocaleString() : '—'}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Population</div>
              <div className="mt-2 text-xl font-semibold" style={{ color: plantPopulation != null ? "#1f2937" : "var(--fe-grey-400)" }}>{plantPopulation != null ? Math.round(plantPopulation) : "—"}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Seeds</div>
              <div className="mt-2 text-xl font-semibold" style={{ color: seedsPerPlot != null ? "#1f2937" : "var(--fe-grey-400)" }}>{seedsPerPlot != null ? seedsPerPlot : "—"}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Rate</div>
              <div className="mt-2 text-xl font-semibold" style={{ color: seedRateKgHa != null ? "#1f2937" : "var(--fe-grey-400)" }}>{seedRateKgHa != null ? seedRateKgHa.toFixed(2) : "—"}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Total seed</div>
              <div className="mt-2 text-xl font-semibold" style={{ color: totalTrialSeedKg != null ? "#1f2937" : "var(--fe-grey-400)" }}>{totalTrialSeedKg != null ? totalTrialSeedKg.toFixed(2) : "—"}</div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Seed rate</h2>
            <p className="text-sm text-slate-500">Enter seed label data to calculate the trial seed rate. These values are optional but required if you want total seed estimates.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Thousand seed weight (g)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formValues.thousand_seed_weight_g}
                onChange={(event) => setFormValues((prev) => ({ ...prev, thousand_seed_weight_g: event.target.value }))}
                placeholder="0.0"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Germination rate (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formValues.germination_rate_pct}
                onChange={(event) => setFormValues((prev) => ({ ...prev, germination_rate_pct: event.target.value }))}
                placeholder="0"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Seed purity (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formValues.seed_purity_pct}
                onChange={(event) => setFormValues((prev) => ({ ...prev, seed_purity_pct: event.target.value }))}
                placeholder="0"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Replacement factor</span>
              <input
                type="number"
                min="1.0"
                step="0.01"
                value={formValues.seed_replacement_factor}
                onChange={(event) => setFormValues((prev) => ({ ...prev, seed_replacement_factor: event.target.value }))}
                placeholder="1.10"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Site layout diagram</h2>
            <p className="text-sm text-slate-500">A proportional site layout showing boundary and inter-plot buffers for the full trial site.</p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-4">
            <div className="relative mx-auto h-[280px] w-full overflow-hidden rounded-3xl bg-slate-100">
              {siteRowPercent.length > 0 && siteColumnPercent.length > 0 ? (
                <div className="h-full w-full">
                  {siteRowPercent.map((rowPercent, rowIndex) => (
                    <div
                      key={`row-${rowIndex}`}
                      className="flex"
                      style={{ height: `${rowPercent}%` }}
                    >
                      {siteColumnPercent.map((colPercent, colIndex) => {
                        const isPlotRow = siteRowTypes[rowIndex] === "plot";
                        const isPlotCol = siteColumnTypes[colIndex] === "plot";
                        const plotRow = isPlotRow ? Math.floor((rowIndex - 1) / 2) + 1 : null;
                        const plotCol = isPlotCol ? Math.floor((colIndex - 1) / 2) + 1 : null;
                        const plotCode = plotRow != null && plotCol != null ? layoutData.layout[plotRow - 1]?.[plotCol - 1] : null;
                        const background = isPlotRow && isPlotCol
                          ? optionColor(plotCode)
                          : siteColumnTypes[colIndex] === "boundary" || siteRowTypes[rowIndex] === "boundary"
                            ? "var(--fe-grey-300)"
                            : "var(--fe-grey-200)";

                        return (
                          <div
                            key={`cell-${rowIndex}-${colIndex}`}
                            className="border border-slate-200 text-[10px] text-slate-900 flex items-center justify-center"
                            style={{ width: `${colPercent}%`, background }}
                          >
                            {isPlotRow && isPlotCol && plotCode ? `${plotCode}R${plotRow}` : null}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">Enter plots, treatments and replications to render the layout.</div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Treatment area summary</h2>
            <p className="text-sm text-slate-500">Each treatment occupies one plot per replication.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3">Treatment</th>
                  <th className="px-4 py-3">Plots</th>
                  <th className="px-4 py-3">Plot area (m²)</th>
                  <th className="px-4 py-3">Treatment area (m²)</th>
                  <th className="px-4 py-3">Treatment area (ha)</th>
                </tr>
              </thead>
              <tbody>
                {treatments.map((code) => {
                  const option = TREATMENT_OPTIONS.find((item) => item.code === code);
                  return (
                    <tr key={code} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ background: option?.color }} />
                          {code}
                        </div>
                      </td>
                      <td className="px-4 py-3">{replications > 0 ? replications : '—'}</td>
                      <td className="px-4 py-3">{plotArea > 0 ? plotArea.toFixed(1) : '—'}</td>
                      <td className="px-4 py-3">{plotArea > 0 ? treatmentArea.toFixed(1) : '—'}</td>
                      <td className="px-4 py-4">{plotArea > 0 ? treatmentAreaHa.toFixed(4) : '—'}</td>
                    </tr>
                  );
                })}
                {treatments.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-slate-500" colSpan="5">Select treatments to see the treatment breakdown.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Crop and trial information</h2>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 mb-6">
            <label className="block text-sm font-medium text-slate-700">Shared inputs (seeds, fertiliser, pest control, planting and harvest protocols)</label>
            <textarea
              value={formValues.sharedInputs}
              onChange={(event) => setFormValues((prev) => ({ ...prev, sharedInputs: event.target.value }))}
              placeholder="Describe the inputs and management practices common to all treatments."
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              rows={4}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Crop type</span>
              <select
                value={cropType}
                onChange={(event) => setFormValues((prev) => ({ ...prev, cropType: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              >
                <option value="">Select crop</option>
                {CROP_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Crop scientific name</span>
              <input
                type="text"
                value={formValues.cropScientificName}
                onChange={(event) => setFormValues((prev) => ({ ...prev, cropScientificName: event.target.value }))}
                placeholder="e.g. Phaseolus vulgaris"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Variety</span>
              <input
                type="text"
                value={formValues.variety}
                onChange={(event) => setFormValues((prev) => ({ ...prev, variety: event.target.value }))}
                placeholder="e.g. RWR 3194"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Planting date</span>
              <input
                type="date"
                value={formValues.plantingDate}
                onChange={(event) => setFormValues((prev) => ({ ...prev, plantingDate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Previous crop</span>
              <input
                type="text"
                value={formValues.previousCrop}
                onChange={(event) => setFormValues((prev) => ({ ...prev, previousCrop: event.target.value }))}
                placeholder="e.g. Maize, Season A 2025"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Inter-row spacing — distance between rows (m)</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formValues.interRow}
                onChange={(event) => setFormValues((prev) => ({ ...prev, interRow: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Intra-row spacing — distance between hills within a row (m)</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formValues.intraRow}
                onChange={(event) => setFormValues((prev) => ({ ...prev, intraRow: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Crop rate — number of seeds per planting hill</span>
              <input
                type="number"
                min="0"
                step="1"
                value={formValues.seedsPerHill}
                onChange={(event) => setFormValues((prev) => ({ ...prev, seedsPerHill: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Rows per plot</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{rowsPerPlot ?? "—"}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Hills per row</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{hillsPerRow ?? "—"}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Total hills per plot</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{totalHills ?? "—"}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Population / ha</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{cropPopulationPerHa != null ? cropPopulationPerHa.toLocaleString() : "—"}</div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
            <HideMechanism
              id="research-plant-population-formula"
              content={`Hills = floor(${length.toFixed(1)} ÷ ${interRow > 0 ? interRow.toFixed(2) : "0.00"}) = ${rowsPerPlot ?? 0}\nHills per row = floor(${width.toFixed(1)} ÷ ${intraRow > 0 ? intraRow.toFixed(2) : "0.00"}) = ${hillsPerRow ?? 0}\nTotal hills = ${rowsPerPlot ?? 0} × ${hillsPerRow ?? 0} = ${totalHills ?? 0}\nSeeds/plot = ${totalHills ?? 0} × ${seedsPerHill || 0} = ${seedsPerPlot ?? 0}\nPopulation/ha = ${seedsPerPlot ?? 0} × ${extrapolationFactor.toFixed(4)} = ${plantPopulation != null ? Math.round(plantPopulation) : 0} seeds/ha`}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Treatments</h2>
            <p className="text-sm text-slate-500">Minimum 2 treatments. Maximum 4. One treatment is assigned to one plot per replication.</p>
          </div>
          <div className="grid gap-3">{treatmentOptions}</div>
          {treatments.map((code) => {
            const option = TREATMENT_OPTIONS.find((item) => item.code === code);
            const desc = formValues.treatmentDescriptions[code] || {};
            return (
              <div key={code} className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">{code}</div>
                    <p className="mt-2 text-base font-semibold text-slate-900">{option?.name}</p>
                  </div>
                  <div className="text-sm text-slate-500">Description required</div>
                </div>
                <div className="mt-4 grid gap-4">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-700">Soil disturbance</span>
                    <textarea
                      value={desc.soilDisturbance || ""}
                      onChange={(event) => handleTreatmentDescriptionChange(code, "soilDisturbance", event.target.value)}
                      placeholder="Describe tillage and soil disturbance for this treatment"
                      className="mt-2 h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-700">Soil cover</span>
                    <textarea
                      value={desc.soilCover || ""}
                      onChange={(event) => handleTreatmentDescriptionChange(code, "soilCover", event.target.value)}
                      placeholder="Describe residue/mulch and cover management"
                      className="mt-2 h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-700">Crop rotation / sequence</span>
                    <textarea
                      value={desc.cropRotation || ""}
                      onChange={(event) => handleTreatmentDescriptionChange(code, "cropRotation", event.target.value)}
                      placeholder="Describe the crop sequence or rotation for this treatment"
                      className="mt-2 h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
                    />
                  </label>
                </div>
                {((desc.soilDisturbance || "").trim().length > 0 && (desc.soilDisturbance || "").trim().length < 30) ||
                ((desc.soilCover || "").trim().length > 0 && (desc.soilCover || "").trim().length < 30) ||
                ((desc.cropRotation || "").trim().length > 0 && (desc.cropRotation || "").trim().length < 30) ? (
                  <p className="mt-2 text-sm text-red-600">Each treatment section should include a detailed description of the practice.</p>
                ) : null}
              </div>
            );
          })}
          {treatments.length < 2 ? (
            <p className="mt-3 text-sm text-red-600">Select at least 2 treatments to continue.</p>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Replications</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Number of replications</span>
              <input
                type="number"
                min="2"
                max="6"
                step="1"
                value={formValues.replications}
                onChange={(event) => setFormValues((prev) => ({ ...prev, replications: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500">Recommended: 3–4 replications</p>
              {replications > 0 && replications < 2 ? (
                <p className="text-xs text-red-600">Minimum 2 replications required for t-test and ANOVA.</p>
              ) : null}
            </label>
            <div className="rounded-3xl bg-slate-50 p-4 text-sm">
              <p className="text-slate-500">Total plots</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{treatments.length > 0 && replications > 0 ? `${totalPlots} plots total` : "—"}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 text-sm">
              <p className="text-slate-500">Statistical test preview</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{treatments.length >= 2 ? statTestLabel : "Requires 2+ treatments"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Site layout — RCBD randomisation</h2>
            <p className="text-sm text-slate-500">Treatments are randomly assigned within each replication block. Each treatment appears exactly once per replication. Regenerate to get a new randomisation.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              {treatments.length < 2 || replications < 2 ? (
                "Select at least 2 treatments and enter at least 2 replications to generate the layout."
              ) : (
                "Generate the RCBD layout to preview treatment assignment for each replication."
              )}
            </div>
            <button
              type="button"
              onClick={handleGenerateLayout}
              disabled={treatments.length < 2 || replications < 2}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Regenerate layout
            </button>
          </div>

          {layoutData.layout.length > 0 ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-3">
                {plotRows.map((row) => (
                  <div key={`rep-${row.rep}`} className="space-y-2">
                    <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="font-medium text-slate-900">Rep {row.rep}</div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                      {row.cells.map((treatment, index) => {
                        const option = TREATMENT_OPTIONS.find((item) => item.code === treatment);
                        return (
                          <div key={index} className="rounded-3xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-900 shadow-sm">
                            <div className="mb-1 text-xs text-slate-500">Plot</div>
                            <div className="flex items-center gap-2">
                              <div className="inline-flex h-8 w-8 items-center justify-center rounded-2xl" style={{ background: option?.color || "var(--fe-grey-200)", color: "var(--fe-white)" }}>
                                {treatment}
                              </div>
                              <span>{`${treatment}-R${row.rep}`}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {`Rep ${row.rep}: ${row.cells.join(" · ")}`}
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">
                {plotLabels}
              </div>
            </div>
          ) : null}
        </section>

        {saveError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{saveError}</div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-700 hover:bg-slate-50"
            onClick={() => navigate(`/setup/${year}/${season}`)}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isFormReady}
            onClick={handleSaveTrial}
            className={`rounded-2xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-800 ${!isFormReady ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            Save trial configuration
          </button>
        </div>
      </div>
    </div>
  );
}
