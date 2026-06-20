import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ScreenTopbar } from "../components/shared/ScreenTopbar";
import {
  addPlotInput,
  addPlotLabour,
  createPlot,
  deletePlotInput,
  deletePlotLabour,
  getTrialPlots,
  patchPlotYield,
  updatePlot,
} from "../services/api";
import { AgronomicEntry } from "./DataEntry/AgronomicEntry";

const PLOT_LAYOUT = [
  { plotId: "CA-R1", treatment: "CA", replicate: 1 },
  { plotId: "CA-R2", treatment: "CA", replicate: 2 },
  { plotId: "CA-R3", treatment: "CA", replicate: 3 },
  { plotId: "CA-R4", treatment: "CA", replicate: 4 },
  { plotId: "CF-R1", treatment: "CF", replicate: 1 },
  { plotId: "CF-R2", treatment: "CF", replicate: 2 },
  { plotId: "CF-R3", treatment: "CF", replicate: 3 },
  { plotId: "CF-R4", treatment: "CF", replicate: 4 },
];

const INPUT_ITEMS = [
  "Seeds",
  "Mulch",
  "Compost / Manure",
  "Inorganic fertilizers (NPK)",
  "Pesticides",
];

const COST_TYPES = ["C_SD", "C_SI"];

const LABOUR_PRACTICES = [
  "Land preparation (Slashing, Tilling)",
  "Planting (labour)",
  "Residue management (Mulch application)",
  "First weeding (labour)",
  "Second weeding (labour)",
  "Irrigation (labour)",
  "Pests and Diseases control (labour)",
  "Harvesting (threshing, Winnowing)",
  "Postharvest handling (Drying, Storage)",
];

const TIME_UNITS = [
  { value: "min", label: "min" },
  { value: "hr", label: "hr" },
  { value: "day", label: "day" },
];

const DEFAULT_WORKING_HOURS = 8;

function formatCurrency(value) {
  if (value === undefined || value === null || value === "") return "—";
  return `${Number(value).toLocaleString()} RWF`;
}

function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function getPlotField(plot, keys) {
  if (!plot) return undefined;
  return keys.reduce((found, key) => found ?? plot[key], undefined);
}

export function DataEntry() {
  const { year, season, trialId } = useParams();
  const navigate = useNavigate();

  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [plotCreationMessage, setPlotCreationMessage] = useState("");

  const topbarTitle = trialId ? `Data Entry — ${trialId}` : "Data Entry";
  const topbarMeta = `${season ?? "Season"} · ${year ?? "Year"}`;
  const [activePlotId, setActivePlotId] = useState(PLOT_LAYOUT[0].plotId);
  const [activeTab, setActiveTab] = useState("inputs");
  const topbarStatus = loading ? "Loading…" : saving ? "Saving…" : "Ready";
  const topbarTone = loading ? "offline" : saving ? "saving" : "synced";
  const activeFarmLabel = trialId ? `Trial ${trialId}` : null;

  const [inputRow, setInputRow] = useState({
    date: "",
    item: INPUT_ITEMS[0],
    costType: COST_TYPES[0],
    quantity: "",
    unit: "kg",
    unitCost: "",
  });

  const [labourRow, setLabourRow] = useState({
    date: "",
    practice: LABOUR_PRACTICES[0],
    costType: COST_TYPES[0],
    labourers: "",
    time: "",
    timeUnit: "hr",
    wageRate: "1500",
  });

  const [yieldRow, setYieldRow] = useState({
    yieldKg: "",
    priceOverride: "",
  });

  const [labourOps, setLabourOps] = useState({
    landPreparation: "",
    planting: "",
    weeding: "",
    harvesting: "",
    residueManagement: "",
  });

  const plotMap = useMemo(() => Object.fromEntries(plots.map((plot) => [plot.plotId, plot])), [plots]);
  const activePlot = plotMap[activePlotId];
  const activePlotExists = Boolean(activePlot);

  const activePlotYield = getPlotField(activePlot, ["yieldKg", "yield_kg", "yield_kg_plot"]);
  const activePlotPrice = getPlotField(activePlot, ["marketPrice", "market_price", "priceOverride"]);

  const selectedPlot = useMemo(
    () => PLOT_LAYOUT.find((plot) => plot.plotId === activePlotId) ?? PLOT_LAYOUT[0],
    [activePlotId],
  );

  useEffect(() => {
    if (!trialId) return;
    const loadPlots = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getTrialPlots(trialId);
        if (!response || response.error) {
          throw new Error(response?.error || "Unable to load plot records.");
        }
        setPlots(Array.isArray(response) ? response : []);
      } catch (fetchError) {
        setError(fetchError?.message || "Failed to load plot records.");
      } finally {
        setLoading(false);
      }
    };

    void loadPlots();
  }, [trialId]);

  const refreshPlots = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getTrialPlots(trialId);
      if (!response || response.error) {
        throw new Error(response?.error || "Unable to refresh plot records.");
      }
      setPlots(Array.isArray(response) ? response : []);
    } catch (fetchError) {
      setError(fetchError?.message || "Failed to refresh plot records.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlot = async () => {
    setSaving(true);
    setError("");
    setPlotCreationMessage("");

    try {
      const response = await createPlot({
        trialId,
        plotId: activePlotId,
        treatment: selectedPlot.treatment,
        replicate: selectedPlot.replicate,
        plotSizeM2: 100,
      });

      if (!response || response.error) {
        throw new Error(response?.error || "Unable to create plot.");
      }

      setPlotCreationMessage("Plot created successfully.");
      await refreshPlots();
    } catch (createError) {
      setError(createError?.message || "Failed to create plot.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddInputRow = async () => {
    if (!activePlotExists) return;
    setSaving(true);
    setError("");

    try {
      const payload = {
        date: inputRow.date,
        item: inputRow.item,
        costType: inputRow.costType,
        quantity: Number(inputRow.quantity),
        unit: inputRow.unit,
        unitCost: Number(inputRow.unitCost),
      };
      const response = await addPlotInput(activePlotId, payload);
      if (!response || response.error) {
        throw new Error(response?.error || "Unable to save input cost.");
      }
      setInputRow({
        date: "",
        item: INPUT_ITEMS[0],
        costType: COST_TYPES[0],
        quantity: "",
        unit: "kg",
        unitCost: "",
      });
      await refreshPlots();
    } catch (saveError) {
      setError(saveError?.message || "Failed to save input row.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInputRow = async (rowId) => {
    if (!activePlotExists) return;
    setSaving(true);
    setError("");

    try {
      const response = await deletePlotInput(activePlotId, rowId);
      if (!response || response.error) {
        throw new Error(response?.error || "Unable to delete input row.");
      }
      await refreshPlots();
    } catch (deleteError) {
      setError(deleteError?.message || "Failed to delete input row.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLabourRow = async () => {
    if (!activePlotExists) return;
    setSaving(true);
    setError("");

    try {
      const payload = {
        date: labourRow.date,
        practice: labourRow.practice,
        costType: labourRow.costType,
        labourers: Number(labourRow.labourers),
        time: Number(labourRow.time),
        timeUnit: labourRow.timeUnit,
        wageRate: Number(labourRow.wageRate),
      };
      const response = await addPlotLabour(activePlotId, payload);
      if (!response || response.error) {
        throw new Error(response?.error || "Unable to save labour cost.");
      }
      setLabourRow({
        date: "",
        practice: LABOUR_PRACTICES[0],
        costType: COST_TYPES[0],
        labourers: "",
        time: "",
        timeUnit: "hr",
        wageRate: "1500",
      });
      await refreshPlots();
    } catch (saveError) {
      setError(saveError?.message || "Failed to save labour row.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLabourRow = async (rowId) => {
    if (!activePlotExists) return;
    setSaving(true);
    setError("");

    try {
      const response = await deletePlotLabour(activePlotId, rowId);
      if (!response || response.error) {
        throw new Error(response?.error || "Unable to delete labour row.");
      }
      await refreshPlots();
    } catch (deleteError) {
      setError(deleteError?.message || "Failed to delete labour row.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveYield = async () => {
    if (!activePlotExists) return;
    setSaving(true);
    setError("");

    try {
      const response = await patchPlotYield(activePlotId, {
        yieldKg: Number(yieldRow.yieldKg),
        marketPrice: yieldRow.priceOverride ? Number(yieldRow.priceOverride) : undefined,
      });
      if (!response || response.error) {
        throw new Error(response?.error || "Unable to save yield.");
      }
      setYieldRow((current) => ({ ...current, yieldKg: "", priceOverride: "" }));
      await refreshPlots();
    } catch (saveError) {
      setError(saveError?.message || "Failed to save yield.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLabourOps = async () => {
    if (!activePlotExists) return;
    setSaving(true);
    setError("");

    try {
      const payload = {
        labourDisaggregated: {
          landPreparation: labourOps.landPreparation ? Number(labourOps.landPreparation) : null,
          planting: labourOps.planting ? Number(labourOps.planting) : null,
          weeding: labourOps.weeding ? Number(labourOps.weeding) : null,
          harvesting: labourOps.harvesting ? Number(labourOps.harvesting) : null,
          residueManagement: labourOps.residueManagement ? Number(labourOps.residueManagement) : null,
        }
      };
      
      const response = await updatePlot(activePlotId, payload);
      if (!response || response.error) {
        throw new Error(response?.error || 'Unable to save labour operations.');
      }

      setError("");
      await refreshPlots();
      console.log('Labour operations saved successfully');
    } catch (saveError) {
      setError(saveError?.message || "Failed to save labour operations.");
    } finally {
      setSaving(false);
    }
  };

  const inputRows = useMemo(() => activePlot?.inputs ?? activePlot?.inputCosts ?? [], [activePlot]);
  const labourRows = useMemo(() => activePlot?.labour ?? activePlot?.labourCosts ?? [], [activePlot]);

  const inputPreview = useMemo(() => {
    const quantity = safeNumber(inputRow.quantity);
    const unitCost = safeNumber(inputRow.unitCost);
    return quantity * unitCost;
  }, [inputRow.quantity, inputRow.unitCost]);

  const labourPreview = useMemo(() => {
    const labourers = safeNumber(labourRow.labourers);
    const timeValue = safeNumber(labourRow.time);
    const wageRate = safeNumber(labourRow.wageRate);
    const workingMinutes = DEFAULT_WORKING_HOURS * 60;
    let minutes = 0;
    if (labourRow.timeUnit === "min") minutes = timeValue;
    if (labourRow.timeUnit === "hr") minutes = timeValue * 60;
    if (labourRow.timeUnit === "day") minutes = timeValue * workingMinutes;
    return labourers * (minutes / workingMinutes) * wageRate;
  }, [labourRow.labourers, labourRow.time, labourRow.timeUnit, labourRow.wageRate]);

  const yieldPrice = useMemo(() => {
    const override = safeNumber(yieldRow.priceOverride);
    return override > 0 ? override : safeNumber(activePlotPrice) || 1200;
  }, [yieldRow.priceOverride, activePlotPrice]);

  const yieldPreview = useMemo(() => {
    const yieldKg = safeNumber(yieldRow.yieldKg);
    return yieldKg * yieldPrice;
  }, [yieldRow.yieldKg, yieldPrice]);

  const activePlotTitle = `${activePlotId} • ${selectedPlot.treatment} replicate ${selectedPlot.replicate}`;

  if (!trialId) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-100 p-6 md:p-10">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-700 shadow-sm">
          <h1 className="text-2xl font-semibold">Plot entry unavailable</h1>
          <p className="mt-3 text-sm">A trial identifier is required in the URL to load plot entry data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-4 md:p-8">
      <ScreenTopbar
        superText="Data entry"
        title={topbarTitle}
        meta={topbarMeta}
        status={topbarStatus}
        statusTone={topbarTone}
        activeFarmLabel={activeFarmLabel}
      />
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Plot Data Entry</h1>
              <p className="mt-1 text-sm text-slate-600">
                Trial {trialId} · {season} · {year}
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
              onClick={() => navigate(`/setup`)}
            >
              Back to Setup
            </button>
          </div>
        </header>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-700 shadow-sm">Loading plot records…</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_2fr]">
            <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Plots</h2>
                  <p className="text-sm text-slate-500">Tap a plot to begin entry.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {PLOT_LAYOUT.length}
                </span>
              </div>

              <div className="space-y-3">
                {PLOT_LAYOUT.map((plot) => {
                  const record = plotMap[plot.plotId];
                  const hasYield = Boolean(
                    record && getPlotField(record, ["yieldKg", "yield_kg", "yield_kg_plot"]) >= 0,
                  );
                  const isActive = plot.plotId === activePlotId;
                  return (
                    <button
                      key={plot.plotId}
                      type="button"
                      onClick={() => setActivePlotId(plot.plotId)}
                      className={`w-full rounded-3xl border p-4 text-left transition border-l-4 ${
                        plot.treatment === "CA" ? "border-l-emerald-500" : "border-l-sky-500"
                      } ${
                        isActive ? "border-slate-900 bg-slate-100 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                      aria-pressed={isActive}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex h-3 w-3 rounded-full ${
                              plot.treatment === "CA" ? "bg-emerald-500" : "bg-sky-500"
                            }`}
                          />
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{plot.plotId}</div>
                            <div className="text-xs text-slate-500">{plot.treatment} replicate {plot.replicate}</div>
                          </div>
                        </div>
                        <span className={`inline-flex h-3 w-3 rounded-full ${hasYield ? "bg-emerald-500" : "bg-slate-300"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{activePlotTitle}</h2>
                  <p className="text-sm text-slate-500">{activePlotExists ? "Record existing plot data." : "Create this plot before entering data."}</p>
                </div>
                {!activePlotExists ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleCreatePlot}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {saving ? "Creating…" : "Create Plot"}
                  </button>
                ) : null}
              </div>

              {plotCreationMessage ? (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  {plotCreationMessage}
                </div>
              ) : null}

              {activePlotExists ? (
                <>
                  <div className="mb-6 flex flex-wrap gap-2">
                    {[
                      { key: "inputs", label: "Input Costs" },
                      { key: "labour", label: "Labour Costs" },
                      { key: "labour-ops", label: "Labour Operations" },
                      { key: "yield", label: "Yield" },
                      { key: "agronomic", label: "Agronomic" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                          activeTab === tab.key
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === "inputs" ? (
                    <div className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Date</span>
                          <input
                            type="date"
                            value={inputRow.date}
                            onChange={(event) => setInputRow((current) => ({ ...current, date: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Input Item</span>
                          <select
                            value={inputRow.item}
                            onChange={(event) => setInputRow((current) => ({ ...current, item: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          >
                            {INPUT_ITEMS.map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Cost Type</span>
                          <select
                            value={inputRow.costType}
                            onChange={(event) => setInputRow((current) => ({ ...current, costType: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          >
                            {COST_TYPES.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Quantity</span>
                          <input
                            type="number"
                            min="0"
                            value={inputRow.quantity}
                            onChange={(event) => setInputRow((current) => ({ ...current, quantity: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Unit</span>
                          <input
                            type="text"
                            value={inputRow.unit}
                            onChange={(event) => setInputRow((current) => ({ ...current, unit: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Unit Cost RWF</span>
                          <input
                            type="number"
                            min="0"
                            value={inputRow.unitCost}
                            onChange={(event) => setInputRow((current) => ({ ...current, unitCost: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                      </div>

                      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Total Cost</p>
                          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(inputPreview)}</p>
                        </div>
                        <button
                          type="button"
                          disabled={saving || !inputRow.date || !inputRow.quantity || !inputRow.unitCost || !inputRow.unit}
                          onClick={handleAddInputRow}
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {saving ? "Saving…" : "Add Row"}
                        </button>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <h3 className="text-lg font-semibold text-slate-900">Existing Input Rows</h3>
                        {inputRows.length === 0 ? (
                          <p className="mt-4 text-sm text-slate-500">No input rows have been recorded for this plot yet.</p>
                        ) : (
                          <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-left text-sm text-slate-700">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                  <th className="px-3 py-3">Date</th>
                                  <th className="px-3 py-3">Input</th>
                                  <th className="px-3 py-3">Type</th>
                                  <th className="px-3 py-3">Qty</th>
                                  <th className="px-3 py-3">Unit</th>
                                  <th className="px-3 py-3">Unit Cost</th>
                                  <th className="px-3 py-3">Total</th>
                                  <th className="px-3 py-3"> </th>
                                </tr>
                              </thead>
                              <tbody>
                                {inputRows.map((row) => {
                                  const total = safeNumber(row.quantity) * safeNumber(row.unitCost);
                                  const rowId = row.id ?? row._id ?? row.uid ?? `${activePlotId}-input-${row.date}-${row.item}`;
                                  return (
                                    <tr key={rowId} className="border-b border-slate-100 hover:bg-slate-50">
                                      <td className="px-3 py-3">{row.date || "—"}</td>
                                      <td className="px-3 py-3">{row.item || "—"}</td>
                                      <td className="px-3 py-3">{row.costType || "—"}</td>
                                      <td className="px-3 py-3">{row.quantity ?? "—"}</td>
                                      <td className="px-3 py-3">{row.unit || "—"}</td>
                                      <td className="px-3 py-3">{formatCurrency(row.unitCost)}</td>
                                      <td className="px-3 py-3">{formatCurrency(total)}</td>
                                      <td className="px-3 py-3">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteInputRow(rowId)}
                                          className="rounded-2xl bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                        >
                                          Delete
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : activeTab === "labour" ? (
                    <div className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Date</span>
                          <input
                            type="date"
                            value={labourRow.date}
                            onChange={(event) => setLabourRow((current) => ({ ...current, date: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Practice</span>
                          <select
                            value={labourRow.practice}
                            onChange={(event) => setLabourRow((current) => ({ ...current, practice: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          >
                            {LABOUR_PRACTICES.map((practice) => (
                              <option key={practice} value={practice}>{practice}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Cost Type</span>
                          <select
                            value={labourRow.costType}
                            onChange={(event) => setLabourRow((current) => ({ ...current, costType: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          >
                            {COST_TYPES.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">No. of Labourers</span>
                          <input
                            type="number"
                            min="0"
                            value={labourRow.labourers}
                            onChange={(event) => setLabourRow((current) => ({ ...current, labourers: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Time</span>
                          <input
                            type="number"
                            min="0"
                            value={labourRow.time}
                            onChange={(event) => setLabourRow((current) => ({ ...current, time: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Time Unit</span>
                          <select
                            value={labourRow.timeUnit}
                            onChange={(event) => setLabourRow((current) => ({ ...current, timeUnit: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          >
                            {TIME_UNITS.map((unit) => (
                              <option key={unit.value} value={unit.value}>{unit.label}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Wage Rate RWF/day</span>
                          <input
                            type="number"
                            min="0"
                            value={labourRow.wageRate}
                            onChange={(event) => setLabourRow((current) => ({ ...current, wageRate: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                      </div>

                      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Estimated Labour Cost</p>
                          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(labourPreview)}</p>
                        </div>
                        <button
                          type="button"
                          disabled={saving || !labourRow.date || !labourRow.labourers || !labourRow.time || !labourRow.wageRate}
                          onClick={handleAddLabourRow}
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {saving ? "Saving…" : "Add Row"}
                        </button>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <h3 className="text-lg font-semibold text-slate-900">Existing Labour Rows</h3>
                        {labourRows.length === 0 ? (
                          <p className="mt-4 text-sm text-slate-500">No labour rows have been recorded for this plot yet.</p>
                        ) : (
                          <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-left text-sm text-slate-700">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                  <th className="px-3 py-3">Date</th>
                                  <th className="px-3 py-3">Practice</th>
                                  <th className="px-3 py-3">Type</th>
                                  <th className="px-3 py-3">Labourers</th>
                                  <th className="px-3 py-3">Time</th>
                                  <th className="px-3 py-3">Wage Rate</th>
                                  <th className="px-3 py-3">Cost</th>
                                  <th className="px-3 py-3"> </th>
                                </tr>
                              </thead>
                              <tbody>
                                {labourRows.map((row) => {
                                  const labourers = safeNumber(row.labourers);
                                  const timeValue = safeNumber(row.time);
                                  let minutes = 0;
                                  if (row.timeUnit === "min") minutes = timeValue;
                                  if (row.timeUnit === "hr") minutes = timeValue * 60;
                                  if (row.timeUnit === "day") minutes = timeValue * DEFAULT_WORKING_HOURS * 60;
                                  const cost = labourers * (minutes / (DEFAULT_WORKING_HOURS * 60)) * safeNumber(row.wageRate);
                                  const rowId = row.id ?? row._id ?? `${activePlotId}-labour-${row.date}-${row.practice}`;
                                  return (
                                    <tr key={rowId} className="border-b border-slate-100 hover:bg-slate-50">
                                      <td className="px-3 py-3">{row.date || "—"}</td>
                                      <td className="px-3 py-3">{row.practice || "—"}</td>
                                      <td className="px-3 py-3">{row.costType || "—"}</td>
                                      <td className="px-3 py-3">{row.labourers ?? "—"}</td>
                                      <td className="px-3 py-3">{row.time ?? "—"} {row.timeUnit || ""}</td>
                                      <td className="px-3 py-3">{formatCurrency(row.wageRate)}</td>
                                      <td className="px-3 py-3">{formatCurrency(cost)}</td>
                                      <td className="px-3 py-3">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteLabourRow(rowId)}
                                          className="rounded-2xl bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                        >
                                          Delete
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : activeTab === "labour-ops" ? (
                    <div className="space-y-6">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Labour Operations (Disaggregated)</h3>
                        <p className="text-sm text-slate-600 mb-6">
                          Record labour days for each operation. Reference ranges are shown for {selectedPlot.treatment} ({selectedPlot.treatment === 'CA' ? 'Conservation Agriculture' : 'Conventional Farming'}).
                        </p>

                        <div className="space-y-5">
                          {/* Operation 1: Land Preparation */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 mb-3">
                              <div>
                                <label className="text-sm font-semibold text-slate-900">
                                  Operation 1 — Land Preparation (LP)
                                </label>
                                <p className="text-xs text-slate-500 mt-1">
                                  Reference range: {selectedPlot.treatment === 'CA' ? '2–5' : '8–15'} days/ha
                                </p>
                              </div>
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">Help:</span> "CA eliminates or minimises tillage from Season 1 — immediate system-dependent saving"
                              </p>
                            </div>
                            <input
                              type="number"
                              min="0"
                              placeholder="Days recorded for this plot"
                              value={labourOps.landPreparation}
                              onChange={(event) => setLabourOps((current) => ({ ...current, landPreparation: event.target.value }))}
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                          </div>

                          {/* Operation 2: Planting */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 mb-3">
                              <div>
                                <label className="text-sm font-semibold text-slate-900">
                                  Operation 2 — Planting (PL)
                                </label>
                                <p className="text-xs text-slate-500 mt-1">
                                  Reference range: {selectedPlot.treatment === 'CA' ? '3–6' : '4–8'} days/ha
                                </p>
                              </div>
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">Help:</span> "Decreases as mechanization matures. Lower under CA with jab planter or precision seeding."
                              </p>
                            </div>
                            <input
                              type="number"
                              min="0"
                              placeholder="Days recorded for this plot"
                              value={labourOps.planting}
                              onChange={(event) => setLabourOps((current) => ({ ...current, planting: event.target.value }))}
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                          </div>

                          {/* Operation 3: Weeding */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 mb-3">
                              <div>
                                <label className="text-sm font-semibold text-slate-900">
                                  Operation 3 — Weeding (WD)
                                </label>
                                <p className="text-xs text-slate-500 mt-1">
                                  Reference range: {selectedPlot.treatment === 'CA' ? '5–15' : '20–40'} days/ha
                                </p>
                              </div>
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">Help:</span> "Strongly decreasing from Season 2+ as mulch suppresses weed emergence. Key CA advantage."
                              </p>
                            </div>
                            <input
                              type="number"
                              min="0"
                              placeholder="Days recorded for this plot"
                              value={labourOps.weeding}
                              onChange={(event) => setLabourOps((current) => ({ ...current, weeding: event.target.value }))}
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                            {selectedPlot.treatment === 'CA' && labourOps.weeding && Number(labourOps.weeding) > 15 ? (
                              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                                <p className="text-sm text-amber-800">
                                  <span className="font-semibold">⚠️ High CA weeding labour</span> — Verify mulch coverage
                                </p>
                              </div>
                            ) : null}
                          </div>

                          {/* Operation 4: Harvesting */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 mb-3">
                              <div>
                                <label className="text-sm font-semibold text-slate-900">
                                  Operation 4 — Harvesting (HV)
                                </label>
                                <p className="text-xs text-slate-500 mt-1">
                                  Reference range: 8–14 days/ha (yield-adjusted from Season 2)
                                </p>
                              </div>
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">Help:</span> "Proportional to yield. CA harvest cost may exceed CF in mature seasons — this reflects higher productivity."
                              </p>
                            </div>
                            <input
                              type="number"
                              min="0"
                              placeholder="Days recorded for this plot"
                              value={labourOps.harvesting}
                              onChange={(event) => setLabourOps((current) => ({ ...current, harvesting: event.target.value }))}
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                          </div>

                          {/* Operation 5: Residue Management */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 mb-3">
                              <div>
                                <label className="text-sm font-semibold text-slate-900">
                                  Operation 5 — Residue Management (RM)
                                </label>
                                <p className="text-xs text-slate-500 mt-1">
                                  Reference range: {selectedPlot.treatment === 'CA' ? '3–8' : '0–2'} days/ha
                                </p>
                              </div>
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">Help:</span> "CA-specific. Elevated in Year 1 as residue cycling is established. SSA note: may increase overall labour."
                              </p>
                            </div>
                            <input
                              type="number"
                              min="0"
                              placeholder="Days recorded for this plot"
                              value={labourOps.residueManagement}
                              onChange={(event) => setLabourOps((current) => ({ ...current, residueManagement: event.target.value }))}
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                          </div>
                        </div>

                        {/* Totals and Comparison */}
                        {(labourOps.landPreparation || labourOps.planting || labourOps.weeding || labourOps.harvesting || labourOps.residueManagement) ? (
                          <div className="mt-6 space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <p className="text-sm text-slate-500">Auto-computed Total Labour Days</p>
                              <p className="mt-2 text-3xl font-semibold text-slate-900">
                                {(
                                  safeNumber(labourOps.landPreparation) +
                                  safeNumber(labourOps.planting) +
                                  safeNumber(labourOps.weeding) +
                                  safeNumber(labourOps.harvesting) +
                                  safeNumber(labourOps.residueManagement)
                                ).toFixed(1)} days
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-sm font-semibold text-slate-900 mb-2">Reference Comparison</p>
                              <p className="text-sm text-slate-700">
                                CA total reference: 21–48 days/ha | CF total reference: 40–79 days/ha
                              </p>
                              {selectedPlot.treatment === 'CA' && (
                                safeNumber(labourOps.landPreparation) +
                                safeNumber(labourOps.planting) +
                                safeNumber(labourOps.weeding) +
                                safeNumber(labourOps.harvesting) +
                                safeNumber(labourOps.residueManagement) > 48
                              ) ? (
                                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                                  <p className="text-sm text-amber-800">
                                    <span className="font-semibold">⚠️ CA labour exceeds reference range.</span> This may occur in SSA contexts where harvesting and residue management demands are higher (Montt & Luu, 2020).
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-slate-600">
                          {Object.values(labourOps).some(v => v) ? 'Ready to save labour operations' : 'Enter at least one operation to save'}
                        </p>
                        <button
                          type="button"
                          disabled={saving || !Object.values(labourOps).some(v => v)}
                          onClick={handleSaveLabourOps}
                          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {saving ? "Saving…" : "Save Labour Operations"}
                        </button>
                      </div>
                    </div>
                  ) : activeTab === "yield" ? (
                    <div className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Yield (kg/plot)</span>
                          <input
                            type="number"
                            min="0"
                            value={yieldRow.yieldKg}
                            onChange={(event) => setYieldRow((current) => ({ ...current, yieldKg: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Market Price override (RWF/kg)</span>
                          <input
                            type="number"
                            min="0"
                            value={yieldRow.priceOverride}
                            onChange={(event) => setYieldRow((current) => ({ ...current, priceOverride: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm text-slate-500">Gross Revenue preview</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(yieldPreview)}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-slate-600">
                          Current saved yield: {activePlotYield != null ? `${activePlotYield} kg/plot` : "Not recorded"}
                        </div>
                        <button
                          type="button"
                          disabled={saving || !yieldRow.yieldKg}
                          onClick={handleSaveYield}
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {saving ? "Saving…" : "Save Yield"}
                        </button>
                      </div>
                    </div>
                  ) : activeTab === "agronomic" ? (
                    <AgronomicEntry activePlotId={activePlotId} trialSeasonId={activePlot?.trialId} activePlotYield={activePlotYield} />
                  ) : (
                    <div>Default</div>
                  )}
                </>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
                  <p className="text-sm text-slate-600">This plot has not been created yet. Create the plot first to begin recording inputs, labour, and yield data.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
