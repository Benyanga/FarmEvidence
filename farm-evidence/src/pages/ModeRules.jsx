import { useMemo, useState } from "react";
import { CheckCircle, PauseCircle, X, ChevronRight } from "lucide-react";

const modeCards = [
  {
    key: "RESEARCH",
    title: "Research Mode",
    description: "RCBD trial management with full statistical analysis. Designed for multi-plot comparative trials.",
    features: [
      "Multiple plots per treatment",
      "C_SD vs C_SI classification",
      "t-test and ANOVA",
      "RCBD analysis",
      "Sensitivity & partial budget",
      "PDF reports",
    ],
    badge: "Active",
    accent: "emerald",
    color: "#2D5016",
  },
  {
    key: "FARMER",
    title: "Farmer Mode",
    description: "Single-farm seasonal profitability tracking. No system comparison logic.",
    features: [
      "Single farm",
      "Single season",
      "Input/output cost tracking",
      "Profit calculation",
      "Break-even only",
      "Simple PDF summary",
    ],
    badge: "Inactive",
    accent: "sky",
    color: "#0f766e",
  },
];

const researchRules = [
  "Minimum 2 treatments (CA and CF)",
  "Minimum 2 replicates per treatment (4 recommended)",
  "All plots must have the same plot size unless explicitly overridden",
  "C_SD costs must be correctly classified — they drive the C_SD differential test",
  "Yield must be recorded for all plots before statistical analysis runs",
  "Labour time must be entered in min, hr, or day — no free text",
  "Market price and wage rate are set at trial level but can be overridden per plot",
  "Extrapolation is always linear: TPC × (10,000 ÷ plotSizeM2)",
  "t-test is always two-tailed at α = 0.05",
  "BCR and ROI are computed from plot averages, not from totals",
];

const costClassifications = [
  { item: "Mulch", sd: true, si: false, notes: "Applied input associated with CA differential" },
  { item: "Land prep", sd: true, si: false, notes: "Always C_SD; time differs across systems" },
  { item: "Weeding", sd: true, si: false, notes: "Operational cost that varies by treatment" },
  { item: "Seeds", sd: false, si: true, notes: "Standard input cost independent of management system" },
  { item: "Fertiliser", sd: false, si: true, notes: "Standard input cost independent of system" },
  { item: "Harvest", sd: false, si: true, notes: "Harvest labour and handling recorded as C_SI" },
];

export function ModeRules() {
  const [mode, setMode] = useState("RESEARCH");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);

  const modeLabel = mode === "RESEARCH" ? "Research Mode" : "Farmer Mode";

  const handleToggle = () => {
    if (mode === "RESEARCH") {
      setPendingMode("FARMER");
      setShowConfirm(true);
      return;
    }
    setMode("RESEARCH");
  };

  const confirmSwitch = () => {
    setMode(pendingMode || "FARMER");
    setPendingMode(null);
    setShowConfirm(false);
  };

  const cancelSwitch = () => {
    setPendingMode(null);
    setShowConfirm(false);
  };

  const activeModeCard = useMemo(
    () => modeCards.find((card) => card.key === mode),
    [mode],
  );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText="Mode Rules"
        title="Operational modes"
        meta="Research and Farmer mode guidance for FarmEvidence"
        status="Ready"
      />
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Mode Overview</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Operational modes for FarmEvidence</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Learn how Research and Farmer modes differ, and review the rules that keep research analysis consistent.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">Current mode</span>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{modeLabel}</span>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <span>{mode === "RESEARCH" ? "Switch to Farmer Mode" : "Switch to Research Mode"}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {modeCards.map((card) => (
              <article
                key={card.key}
                className={`rounded-[2rem] border p-7 shadow-sm ${card.key === mode ? "border-emerald-500 bg-emerald-50/40" : "border-slate-200 bg-white"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">{card.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${card.badge === "Active" ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-700"}`}
                  >
                    {card.badge}
                  </span>
                </div>
                <div className="mt-7 space-y-3">
                  {card.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <CheckCircle className={`h-4 w-4 ${card.key === "RESEARCH" ? "text-emerald-600" : "text-sky-500"}`} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Research Mode Rules</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">Active research rules</h2>
            </div>
            <div className="rounded-3xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">Research mode enforces trial structure</div>
          </div>
          <ol className="mt-8 space-y-4 text-slate-700">
            {researchRules.map((rule, index) => (
              <li key={rule} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">{index + 1}</span>
                <span className="ml-4 text-sm text-slate-700">{rule}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Cost Classification Rules</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">How costs are classified</h2>
            </div>
            <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Rule table</div>
          </div>
          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-900">
                <tr>
                  <th className="px-4 py-4 font-semibold">Cost Item</th>
                  <th className="px-4 py-4 font-semibold">Always C_SD</th>
                  <th className="px-4 py-4 font-semibold">Always C_SI</th>
                  <th className="px-4 py-4 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {costClassifications.map((row) => (
                  <tr key={row.item}>
                    <td className="px-4 py-4 font-medium text-slate-900">{row.item}</td>
                    <td className="px-4 py-4">{row.sd ? "✓" : "—"}</td>
                    <td className="px-4 py-4">{row.si ? "✓" : "—"}</td>
                    <td className="px-4 py-4 text-slate-600">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Mode Switch</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">Switch mode (UI only)</h2>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">No backend changes</div>
          </div>

          <div className="mt-8 flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Current mode:</p>
              <p className="mt-2 text-sm text-slate-600">{mode === "RESEARCH" ? "Research Mode is active." : "Farmer Mode is active."}</p>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className={`inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold transition ${mode === "RESEARCH" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-sky-600 text-white hover:bg-sky-700"}`}
            >
              {mode === "RESEARCH" ? "Switch to Farmer Mode" : "Switch to Research Mode"}
            </button>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">How the toggle works</p>
            <p className="mt-3">
              Toggling to Farmer Mode will hide RCBD, statistical analysis, and comparison pages in the UI model. Your trial data remains preserved in the frontend state, and this switch only affects mode visibility.
            </p>
          </div>
        </section>
      </div>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">Switch to Farmer Mode?</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Switching to Farmer Mode will hide the RCBD, statistical analysis, and comparison pages. Your data will not be deleted.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelSwitch}
                className="rounded-full border border-slate-200 bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelSwitch}
                className="rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSwitch}
                className="rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Switch
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
