import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTrialContext } from "../context/TrialContext";
import { createPlot, createTrial, getTrial, getTrials, updateTrial } from "../services/api";
import { ScreenTopbar } from "../components/shared/ScreenTopbar";

const SEASONS = ["A", "B", "C"];
const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_TREATMENTS = [
  { name: "CA", code: "CA" },
  { name: "CF", code: "CF" },
];

const DEFAULT_FORM = {
  trialName: "",
  crop: "Beans (Phaseolus vulgaris)",
  variety: "",
  plantingDate: "",
  location: "",
  marketPriceRWF: 1200,
  wageRateRWF: 1500,
  workingHoursPerDay: 8,
  plotSizeM2: 100,
  alpha: 0.05,
  replicates: 4,
};

function parseYear(seasonText) {
  if (!seasonText) return null;
  const match = String(seasonText).match(/(\d{4})$/);
  return match ? match[1] : null;
}

function normalizeTrialName(trial) {
  return trial.trialName ?? trial.name ?? "Unnamed trial";
}

function getStatus(trial) {
  const plotCount = Number(trial.plotCount ?? trial.plots?.length ?? 0);
  const yieldCount = Number(
    trial.yieldCount ?? trial.plots?.filter((plot) => plot?.yield != null).length ?? 0,
  );

  if (plotCount > 0 && yieldCount === plotCount) return "Complete";
  if (yieldCount > 0) return "In Progress";
  return "Empty";
}

function makePlotPreview(treatments, replicates) {
  const preview = [];
  for (const treatment of treatments) {
    for (let r = 1; r <= replicates; r += 1) {
      preview.push(`${treatment.code}-R${r}`);
      if (preview.length >= 6) return preview;
    }
  }
  return preview;
}

function suggestCode(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 6);
}

export function Setup() {
  const { year, season, trialId } = useParams();
  const navigate = useNavigate();
  const { user } = useTrialContext();

  const [allTrials, setAllTrials] = useState([]);
  const [seasonTrials, setSeasonTrials] = useState([]);
  const [form, setForm] = useState(() => ({
    ...DEFAULT_FORM,
    marketPriceRWF: user?.defaultMarketPriceRWF ?? 1200,
    wageRateRWF: user?.defaultWageRateRWF ?? 1500,
    workingHoursPerDay: user?.defaultWorkingHoursPerDay ?? 8,
    plotSizeM2: user?.defaultPlotSizeM2 ?? 100,
  }));
  const [treatments, setTreatments] = useState(DEFAULT_TREATMENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const hasYear = Boolean(year);
  const hasSeason = Boolean(season);
  const isNewTrial = trialId === "new";
  const isEditTrial = Boolean(trialId) && !isNewTrial;

  useEffect(() => {
    if (!user || isEditTrial) return;
    if (
      form.marketPriceRWF === DEFAULT_FORM.marketPriceRWF &&
      form.wageRateRWF === DEFAULT_FORM.wageRateRWF &&
      form.workingHoursPerDay === DEFAULT_FORM.workingHoursPerDay &&
      form.plotSizeM2 === DEFAULT_FORM.plotSizeM2
    ) {
      setForm((current) => ({
        ...current,
        marketPriceRWF: user.defaultMarketPriceRWF ?? 1200,
        wageRateRWF: user.defaultWageRateRWF ?? 1500,
        workingHoursPerDay: user.defaultWorkingHoursPerDay ?? 8,
        plotSizeM2: user.defaultPlotSizeM2 ?? 100,
      }));
    }
  }, [user, isEditTrial, form.marketPriceRWF, form.wageRateRWF, form.workingHoursPerDay, form.plotSizeM2]);

  const topbarTitle = useMemo(() => {
    if (isEditTrial) return "Edit Trial";
    if (isNewTrial) return "New Trial";
    if (hasSeason) return `Trials for Season ${season}`;
    if (hasYear) return `Season overview for ${year}`;
    return "Setup";
  }, [hasSeason, hasYear, isEditTrial, isNewTrial, season, year]);

  const topbarMeta = useMemo(() => {
    if (isEditTrial) return "Update trial parameters without regenerating plots.";
    if (isNewTrial) return "Create a new trial before moving to data entry.";
    if (hasSeason) return "Browse all trials for the selected season.";
    if (hasYear) return "Select a season to review or create trials.";
    return "Choose a year to begin trial setup.";
  }, [hasSeason, hasYear, isEditTrial, isNewTrial]);

  useEffect(() => {
    setIsLoading(true);
    setPageError("");
    void getTrials()
      .then((result) => {
        if (!result || result.error) {
          throw new Error(result?.error || "Unable to fetch trials.");
        }
        setAllTrials(Array.isArray(result) ? result : []);
      })
      .catch((error) => {
        setPageError(error?.message || "Failed to load trials.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!hasYear || !hasSeason) {
      setSeasonTrials([]);
      return;
    }

    setIsLoading(true);
    setPageError("");
    void getTrials({ year, season })
      .then((result) => {
        if (!result || result.error) {
          throw new Error(result?.error || "Unable to fetch season trials.");
        }
        setSeasonTrials(Array.isArray(result) ? result : []);
      })
      .catch((error) => {
        setPageError(error?.message || "Failed to load season trials.");
      })
      .finally(() => setIsLoading(false));
  }, [hasYear, hasSeason, year, season]);

  useEffect(() => {
    if (!isEditTrial) {
      return;
    }

    setIsLoading(true);
    setPageError("");
    void getTrial(trialId)
      .then((result) => {
        if (!result || result.error) {
          throw new Error(result?.error || "Unable to load trial details.");
        }
        setForm({
          trialName: result.trialName ?? result.name ?? "",
          crop: result.crop ?? "Beans (Phaseolus vulgaris)",
          variety: result.variety ?? "",
          plantingDate: result.plantingDate ?? result.planting_date ?? "",
          location: result.location ?? "",
          marketPriceRWF: result.marketPriceRWF ?? result.marketPrice ?? result.market_price ?? 1200,
          wageRateRWF: result.wageRateRWF ?? result.wageRate ?? result.wage_rate ?? 1500,
          workingHoursPerDay: result.workingHoursPerDay ?? result.hoursPerDay ?? result.working_hours_per_day ?? 8,
          plotSizeM2: result.plotSizeM2 ?? result.plotSize ?? result.plot_size ?? 100,
          alpha: result.alpha ?? 0.05,
          replicates: result.replicates ?? result.replications ?? 4,
        });
        setTreatments(Array.isArray(result.treatments) && result.treatments.length >= 2 ? result.treatments : DEFAULT_TREATMENTS);
      })
      .catch((error) => {
        setPageError(error?.message || "Failed to load trial details.");
      })
      .finally(() => setIsLoading(false));
  }, [isEditTrial, trialId]);

  const yearCounts = useMemo(() => {
    const counts = {};
    allTrials.forEach((trial) => {
      const trialYear = parseYear(trial.season);
      if (!trialYear) return;
      counts[trialYear] = (counts[trialYear] || 0) + 1;
    });
    return counts;
  }, [allTrials]);

  const years = useMemo(() => {
    const yearList = [];
    for (let y = 2026; y <= 2050; y += 1) {
      yearList.push(String(y));
    }
    return yearList;
  }, []);

  const seasonCounts = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0 };
    allTrials.forEach((trial) => {
      if (parseYear(trial.season) !== year) return;
      const match = String(trial.season || "").match(/Season\s*([ABC])/i);
      const seasonKey = match ? match[1].toUpperCase() : null;
      if (seasonKey && counts[seasonKey] != null) {
        counts[seasonKey] += 1;
      }
    });
    return counts;
  }, [allTrials, year]);

  const trialList = useMemo(() => {
    return seasonTrials.map((trial) => {
      const treatmentCount = Array.isArray(trial.treatments) ? trial.treatments.length : Number(trial.treatmentCount ?? 2);
      const replicates = Number(trial.replicates ?? trial.replications ?? 0);
      return {
        ...trial,
        displayName: normalizeTrialName(trial),
        crop: trial.crop ?? "—",
        variety: trial.variety ?? "—",
        treatmentCount,
        replicates,
        plotCount: treatmentCount * replicates,
        status: getStatus(trial),
      };
    });
  }, [seasonTrials]);

  const breadcrumbItems = useMemo(() => {
    const items = [{ label: "Setup", to: "/setup" }];
    if (hasYear) items.push({ label: year, to: `/setup/${year}` });
    if (hasSeason) items.push({ label: `Season ${season}`, to: `/setup/${year}/${season}` });
    return items;
  }, [hasSeason, hasYear, season, year]);

  const breadcrumbLastLabel = useMemo(() => {
    if (isNewTrial) return "New Trial";
    if (isEditTrial) return "Edit Trial";
    return breadcrumbItems[breadcrumbItems.length - 1]?.label ?? "Setup";
  }, [breadcrumbItems, isEditTrial, isNewTrial]);

  const formValidation = () => {
    const nextErrors = {};
    if (!form.trialName.trim()) nextErrors.trialName = "Trial Name is required.";
    if (!form.location.trim()) nextErrors.location = "Location / Site Name is required.";
    if (!form.plantingDate.trim()) nextErrors.plantingDate = "Planting Date is required.";
    const replicates = Number(form.replicates);
    if (!Number.isFinite(replicates) || replicates < 2) nextErrors.replicates = "Replicates must be 2 or more.";
    if (!Array.isArray(treatments) || treatments.length < 2) nextErrors.treatments = "At least 2 treatments are required.";
    treatments.forEach((treatment, index) => {
      if (!String(treatment.name).trim()) {
        nextErrors[`treatmentName_${index}`] = "Treatment name is required.";
      }
      if (!String(treatment.code).trim()) {
        nextErrors[`treatmentCode_${index}`] = "Treatment code is required.";
      }
    });
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const designPlotCount = useMemo(() => {
    const reps = Number(form.replicates);
    return Number.isFinite(reps) && reps > 0 ? reps * treatments.length : 0;
  }, [form.replicates, treatments.length]);

  const plotPreviews = useMemo(() => makePlotPreview(treatments, Number(form.replicates)), [treatments, form.replicates]);

  const handleAddTreatment = () => {
    setTreatments((current) => [...current, { name: "", code: "" }]);
  };

  const handleRemoveTreatment = (index) => {
    if (treatments.length <= 2) return;
    setTreatments((current) => current.filter((_, idx) => idx !== index));
  };

  const handleTreatmentChange = (index, field, value) => {
    setTreatments((current) =>
      current.map((treatment, idx) => {
        if (idx !== index) return treatment;
        if (field === "name") {
          return {
            ...treatment,
            name: value,
            code: treatment.code ? treatment.code : suggestCode(value),
          };
        }
        return {
          ...treatment,
          [field]: value,
        };
      }),
    );
  };

  const handleCreateTrial = async (event) => {
    event.preventDefault();
    setPageError("");
    setStatusMessage("");
    if (!formValidation()) return;
    if (!hasYear || !hasSeason) {
      setPageError("Year and season must be selected before creating a trial.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.trialName.trim(),
        crop: form.crop.trim(),
        variety: form.variety.trim(),
        plantingDate: form.plantingDate,
        location: form.location.trim(),
        year,
        season,
        design: "RCBD",
        replicates: Number(form.replicates),
        treatments: treatments.map((treatment) => ({
          name: treatment.name.trim(),
          code: treatment.code.trim(),
        })),
        marketPriceRWF: Number(form.marketPriceRWF),
        wageRateRWF: Number(form.wageRateRWF),
        workingHoursPerDay: Number(form.workingHoursPerDay),
        plotSizeM2: Number(form.plotSizeM2),
        alpha: Number(form.alpha),
      };

      const result = await createTrial(payload);
      if (!result || result.error) {
        throw new Error(result?.error || "Failed to create trial.");
      }

      const newTrialId = result.trialId ?? result.id ?? result._id;
      if (!newTrialId) {
        throw new Error("Server did not return a trial identifier.");
      }

      const plotPromises = [];
      payload.treatments.forEach((treatment) => {
        for (let replicateIndex = 1; replicateIndex <= payload.replicates; replicateIndex += 1) {
          plotPromises.push(
            createPlot({
              trialId: newTrialId,
              plotId: `${treatment.code}-R${replicateIndex}`,
              treatment: treatment.name,
              replicate: `R${replicateIndex}`,
              plotSizeM2: payload.plotSizeM2,
            }),
          );
        }
      });

      await Promise.all(plotPromises);
      navigate(`/data-entry/${year}/${season}/${encodeURIComponent(newTrialId)}`);
    } catch (error) {
      setPageError(error?.message || "Unable to create trial.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTrial = async (event) => {
    event.preventDefault();
    setPageError("");
    setStatusMessage("");
    if (!formValidation()) return;
    if (!trialId) return;

    setIsSaving(true);
    try {
      const updates = {
        trialName: form.trialName.trim(),
        crop: form.crop.trim(),
        variety: form.variety.trim(),
        plantingDate: form.plantingDate,
        location: form.location.trim(),
        replicates: Number(form.replicates),
        marketPriceRWF: Number(form.marketPriceRWF),
        wageRateRWF: Number(form.wageRateRWF),
        workingHoursPerDay: Number(form.workingHoursPerDay),
        plotSizeM2: Number(form.plotSizeM2),
        alpha: Number(form.alpha),
        treatments: treatments.map((treatment) => ({
          name: treatment.name.trim(),
          code: treatment.code.trim(),
        })),
      };

      const result = await updateTrial(trialId, updates);
      if (!result || result.error) {
        throw new Error(result?.error || "Failed to update trial.");
      }
      setStatusMessage("Trial parameters updated successfully.");
    } catch (error) {
      setPageError(error?.message || "Unable to update trial.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/setup/${year}/${season}`);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText="Setup"
        title={topbarTitle}
        meta={topbarMeta}
        status={isLoading ? "Loading…" : isSaving ? "Saving…" : "Ready"}
        statusTone={isLoading ? "offline" : isSaving ? "saving" : "synced"}
      />

      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            {breadcrumbItems.map((item, index) => (
              <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
                {index > 0 && <span className="text-slate-300">/</span>}
                <button
                  type="button"
                  onClick={() => navigate(item.to)}
                  className="font-semibold text-slate-900 hover:text-emerald-700"
                >
                  {item.label}
                </button>
              </span>
            ))}
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-900">{breadcrumbLastLabel}</span>
          </div>
          {hasSeason ? (
            <button
              type="button"
              onClick={() => navigate(`/setup/${year}`)}
              className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to seasons
            </button>
          ) : hasYear ? (
            <button
              type="button"
              onClick={() => navigate("/setup")}
              className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to years
            </button>
          ) : null}
        </div>

        {pageError ? (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">{pageError}</div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-12 text-center text-slate-600">Loading setup data…</div>
        ) : null}

        {!hasYear ? (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Years</h2>
              <p className="mt-2 text-sm text-slate-600">Select a year to explore season setup and trial creation.</p>
            </div>
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-5">
              {years.map((yearLabel) => (
                <button
                  key={yearLabel}
                  type="button"
                  onClick={() => navigate(`/setup/${yearLabel}`)}
                  className="group rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <p className="text-2xl font-semibold text-slate-900">{yearLabel}</p>
                  {yearCounts[yearLabel] ? (
                    <p className="mt-2 text-xs text-slate-500">{yearCounts[yearLabel]} trial{yearCounts[yearLabel] !== 1 ? 's' : ''}</p>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        ) : !hasSeason ? (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Seasons for {year}</h2>
              <p className="mt-2 text-sm text-slate-600">Choose a season to review existing trials or create a new one.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {SEASONS.map((seasonKey) => (
                <button
                  key={seasonKey}
                  type="button"
                  onClick={() => navigate(`/setup/${year}/${seasonKey}`)}
                  className="group rounded-[2rem] border border-slate-200 bg-white p-8 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <p className="text-xl font-semibold text-slate-900">Season {seasonKey}</p>
                  <p className="mt-3 text-sm text-slate-500">{seasonCounts[seasonKey] || 0} trials</p>
                </button>
              ))}
            </div>
          </section>
        ) : trialId ? (
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{isNewTrial ? "Create New Trial" : "Edit Trial"}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {isNewTrial
                      ? "Fill in trial details and generate initial plots."
                      : "Update trial parameters without regenerating plot documents."}
                  </p>
                </div>
                <div className="rounded-3xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">RCBD design</div>
              </div>

              <form
                className="mt-10 space-y-8"
                onSubmit={isNewTrial ? handleCreateTrial : handleUpdateTrial}
                noValidate
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Year</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{year}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Season</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">Season {season}</p>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-900">Trial Identity</h3>
                    <p className="mt-2 text-sm text-slate-600">Define the trial and site metadata.</p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {[
                      { key: "trialName", label: "Trial Name", type: "text" },
                      { key: "crop", label: "Crop", type: "text" },
                      { key: "variety", label: "Variety", type: "text" },
                      { key: "plantingDate", label: "Planting Date", type: "date" },
                      { key: "location", label: "Location / Site Name", type: "text" },
                    ].map(({ key, label, type }) => (
                      <label key={key} className="block">
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                        <input
                          value={form[key]}
                          type={type}
                          onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                          className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                            fieldErrors[key] ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-white"
                          }`}
                        />
                        {fieldErrors[key] ? <p className="mt-2 text-xs text-rose-600">{fieldErrors[key]}</p> : null}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">Trial Design</h3>
                      <p className="mt-2 text-sm text-slate-600">Treatments and plot structure for the trial.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">Treatments</div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Design</span>
                      <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">RCBD</div>
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Number of Replicates</span>
                      <input
                        type="number"
                        min="2"
                        value={form.replicates}
                        onChange={(event) => setForm((current) => ({ ...current, replicates: Number(event.target.value) }))}
                        className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                          fieldErrors.replicates ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-white"
                        }`}
                      />
                      {fieldErrors.replicates ? <p className="mt-2 text-xs text-rose-600">{fieldErrors.replicates}</p> : null}
                    </label>
                  </div>

                  <div className="mt-6 space-y-4">
                    {treatments.map((treatment, index) => (
                      <div key={`treatment-${index}`} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto]">
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Treatment Name</span>
                          <input
                            value={treatment.name}
                            type="text"
                            onChange={(event) => handleTreatmentChange(index, "name", event.target.value)}
                            className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                              fieldErrors[`treatmentName_${index}`] ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-white"
                            }`}
                          />
                          {fieldErrors[`treatmentName_${index}`] ? (
                            <p className="mt-2 text-xs text-rose-600">{fieldErrors[`treatmentName_${index}`]}</p>
                          ) : null}
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Treatment Code</span>
                          <input
                            value={treatment.code}
                            type="text"
                            onChange={(event) => handleTreatmentChange(index, "code", event.target.value)}
                            className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                              fieldErrors[`treatmentCode_${index}`] ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-white"
                            }`}
                          />
                          {fieldErrors[`treatmentCode_${index}`] ? (
                            <p className="mt-2 text-xs text-rose-600">{fieldErrors[`treatmentCode_${index}`]}</p>
                          ) : null}
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveTreatment(index)}
                          disabled={treatments.length <= 2}
                          className="inline-flex h-12 min-h-[3rem] items-center justify-center rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddTreatment}
                      className="inline-flex items-center rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    >
                      + Add Treatment
                    </button>
                  </div>

                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm font-semibold text-slate-700">Total plots</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{designPlotCount}</p>
                    <p className="mt-4 text-sm text-slate-600">Plot IDs will be:</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{plotPreviews.join(", ")}</p>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-900">Economic Parameters</h3>
                    <p className="mt-2 text-sm text-slate-600">These values feed cost and profitability calculations.</p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      { key: "marketPriceRWF", label: "Market Price (RWF/kg)", step: 1 },
                      { key: "wageRateRWF", label: "Wage Rate (RWF/day)", step: 1 },
                      { key: "workingHoursPerDay", label: "Working Hours Per Day", step: 1 },
                      { key: "plotSizeM2", label: "Plot Size (m²)", step: 1 },
                      { key: "alpha", label: "Alpha (significance level)", step: 0.001 },
                    ].map(({ key, label, step }) => (
                      <label key={key} className="block">
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                        <input
                          value={form[key]}
                          type="number"
                          step={step}
                          min={step > 0 ? step : 0}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, [key]: Number(event.target.value) }))}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm font-semibold text-slate-700">Extrapolation Factor</p>
                    <p className="mt-3 text-xl font-semibold text-slate-900">
                      {Number.isFinite(Number(form.plotSizeM2)) && Number(form.plotSizeM2) > 0
                        ? `${(10000 / Number(form.plotSizeM2)).toFixed(2)}×`
                        : "0.00×"}
                    </p>
                  </div>
                </div>

                {pageError ? (
                  <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">{pageError}</div>
                ) : null}
                {statusMessage ? (
                  <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-emerald-700">{statusMessage}</div>
                ) : null}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-600">
                    {isNewTrial
                      ? "Create the trial and generate plot records before data entry."
                      : "Update trial parameters; existing plots will remain unchanged."}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-2xl border border-slate-300 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400"
                    >
                      {isSaving ? "Saving…" : isNewTrial ? "Create Trial" : "Update Parameters"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Trials for Season {season}</h2>
                <p className="mt-2 text-sm text-slate-600">Review existing trials or create a new one for this year and season.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/setup/${year}/${season}/new`)}
                className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                + Create New Trial
              </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {trialList.length === 0 ? (
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-10 text-slate-600">
                  No trials found for Season {season} {year}. Use the button above to create one.
                </div>
              ) : (
                trialList.map((trial) => {
                  const trialKey = trial.trialId ?? trial.id ?? trial._id;
                  return (
                    <article
                      key={trialKey}
                      className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{trial.status}</p>
                          <h3 className="mt-3 text-2xl font-semibold text-slate-900">{trial.displayName}</h3>
                          <p className="mt-2 text-sm text-slate-600">{trial.crop} · {trial.variety}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">{trial.treatmentCount} treatments</p>
                          </div>
                          <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">{trial.replicates} replicates</p>
                          </div>
                          <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">{trial.plotCount} plots</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/data-entry/${year}/${season}/${encodeURIComponent(trialKey)}`)}
                            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            Open in Data Entry
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/setup/${year}/${season}/${encodeURIComponent(trialKey)}`)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                          >
                            Edit Trial
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
