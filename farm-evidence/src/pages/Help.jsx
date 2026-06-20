import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { ScreenTopbar } from "../components/shared/ScreenTopbar";

const formulas = [
  {
    metric: "Total Production Cost",
    formula: "ΣInputCosts + ΣLabourCosts",
    example: "—",
  },
  {
    metric: "Labour Row Cost",
    formula: "numLabourers × (timeMin ÷ (workingHrs × 60)) × wageRate",
    example: "1 × (48 ÷ 480) × 1500 = 150 RWF",
  },
  {
    metric: "Cost per ha",
    formula: "TPC × (10000 ÷ plotSizeM2)",
    example: "12,613 × 100 = 1,261,301 RWF/ha",
  },
  {
    metric: "BCR",
    formula: "Gross Revenue ÷ TPC",
    example: "19,530 ÷ 12,606 = 1.549",
  },
  {
    metric: "Break-even Yield",
    formula: "TPC ÷ Market Price",
    example: "12,606 ÷ 1,200 = 10.50 kg",
  },
  {
    metric: "Margin of Safety",
    formula: "(Actual − Break-even) ÷ Actual",
    example: "(16.27 − 10.50) ÷ 16.27 = 35.5%",
  },
  {
    metric: "t-statistic",
    formula: "(mean1 − mean2) ÷ √(sp² × (1/n1 + 1/n2))",
    example: "—",
  },
];

const costRows = [
  { item: "Mulch", ca: true, cf: false, type: "C_SD" },
  { item: "Land prep", ca: true, cf: true, type: "C_SD (differs in time)" },
  { item: "Weeding", ca: true, cf: true, type: "C_SD (key differential)" },
  { item: "Seeds", ca: true, cf: true, type: "C_SI" },
  { item: "Fertiliser", ca: true, cf: true, type: "C_SI" },
  { item: "Harvest", ca: true, cf: true, type: "C_SI" },
];

const assumptions = Array.from({ length: 25 }, (_, index) => {
  const id = `A${index + 1}`;
  const categories = [
    "Trial design",
    "Data collection",
    "Cost classification",
    "Yield measurement",
    "Statistics",
    "Reporting",
  ];
  const category = categories[index % categories.length];
  return {
    id,
    category,
    description: `Assumption ${id} describes how ${category.toLowerCase()} is handled in the workbook.`,
    editable: index % 5 === 0 ? "Yes" : "No",
  };
});

const sections = [
  {
    key: "gettingStarted",
    title: "Getting Started",
    searchText: "what is farmevidence create a trial link setup enter plot data data-entry",
    content: (
      <div className="space-y-4 text-slate-700">
        <p>
          FarmEvidence is a decision support application for planning, capturing, and analysing smallholder field trials. It helps compare conservation agriculture (CA) and conventional farming (CF) using plot-level cost and yield records.
        </p>
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-slate-900">What is FarmEvidence?</p>
            <p className="mt-2 text-slate-600">It is a guided trial management platform that tracks trial setup, plot-level inputs, labour, yields, and economic metrics with built-in analysis support.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">How to create a trial</p>
            <p className="mt-2 text-slate-600">Start a new experiment by setting site details, treatments, blocks, and plot size in the trial setup workspace.</p>
            <Link to="/setup" className="text-emerald-700 hover:underline">
              Go to Setup
            </Link>
          </div>
          <div>
            <p className="font-semibold text-slate-900">How to enter plot data</p>
            <p className="mt-2 text-slate-600">After trial setup, navigate to the data entry area to record costs, labour, and yield observations for each plot.</p>
            <Link to="/data-entry" className="text-emerald-700 hover:underline">
              Go to Data Entry
            </Link>
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "dataEntryGuide",
    title: "Data Entry Guide",
    searchText: "input costs labour costs time entry yield recording mulch seeds c_sd c_si",
    content: (
      <div className="space-y-6 text-slate-700">
        <div className="space-y-3">
          <p className="font-semibold text-slate-900">Input Costs</p>
          <p>
            Cost fields are grouped into C_SD and C_SI categories. C_SD costs are semi-direct inputs that change with conservation agriculture timing or labour, such as mulch and land preparation. C_SI costs are stored inputs such as seed, fertiliser, and harvest labour.
          </p>
          <p className="text-slate-600">Example: Mulch is a C_SD cost because it depends on the CA treatment and application timing. Seeds are recorded as C_SI because they are a standard material input.</p>
        </div>
        <div className="space-y-3">
          <p className="font-semibold text-slate-900">Labour Costs</p>
          <p>
            Labour entries are captured using a time-based system. Enter the number of labourers, the total minutes worked, and the wage rate. The system computes cost by converting minutes to hours using the working hours per day standard.
          </p>
          <p className="text-slate-600">Example: If one worker spends 48 minutes on a task in a 8-hour day, the cost is calculated from 48 ÷ (8 × 60) of a daily wage.</p>
        </div>
        <div className="space-y-3">
          <p className="font-semibold text-slate-900">Yield Recording</p>
          <p>
            Record yield after plot harvest and drying, using the site’s standard measurement units. Capture the yield once per plot to keep comparisons consistent between CA and CF treatments.</p>
          <p className="text-slate-600">Make sure to enter yield after the trial has reached the measurement stage, not before crop establishment.</p>
        </div>
      </div>
    ),
  },
  {
    key: "formulaReference",
    title: "Formula Reference",
    searchText: "formula metric example total production cost labour row cost cost per ha bcr break-even yield margin of safety t-statistic",
    content: (
      <div className="overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-900">
            <tr>
              <th className="px-4 py-3 font-semibold">Metric</th>
              <th className="px-4 py-3 font-semibold">Formula</th>
              <th className="px-4 py-3 font-semibold">Example</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {formulas.map((row) => (
              <tr key={row.metric}>
                <td className="px-4 py-4 font-medium text-slate-900">{row.metric}</td>
                <td className="px-4 py-4 whitespace-pre-wrap">{row.formula}</td>
                <td className="px-4 py-4 whitespace-pre-wrap text-slate-600">{row.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    key: "costClassification",
    title: "Cost Classification (C_SD vs C_SI)",
    searchText: "cost classification c_sd c_si mulch land prep weeding seeds fertiliser harvest",
    content: (
      <div className="space-y-4 text-slate-700">
        <p className="text-slate-600">
          This table shows how major cost items are classified for CA and CF treatments. C_SD and C_SI categories help separate semi-direct differential costs from standard input costs.
        </p>
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-900">
              <tr>
                <th className="px-4 py-3 font-semibold">Cost Item</th>
                <th className="px-4 py-3 font-semibold">CA</th>
                <th className="px-4 py-3 font-semibold">CF</th>
                <th className="px-4 py-3 font-semibold">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {costRows.map((row) => (
                <tr key={row.item}>
                  <td className="px-4 py-4 font-medium text-slate-900">{row.item}</td>
                  <td className="px-4 py-4">{row.ca ? "✓" : "—"}</td>
                  <td className="px-4 py-4">{row.cf ? "✓" : "—"}</td>
                  <td className="px-4 py-4 text-slate-600">{row.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    key: "statisticalMethods",
    title: "Statistical Methods",
    searchText: "rcbd design t-test interpretation p-value not significant practically meaningful",
    content: (
      <div className="space-y-4 text-slate-700">
        <div>
          <p className="font-semibold text-slate-900">RCBD design explanation</p>
          <p className="mt-2 text-slate-600">
            A randomized complete block design (RCBD) groups plots into blocks with similar conditions. This helps reduce variability due to field heterogeneity while comparing CA and CF treatments.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">t-test interpretation guide</p>
          <p className="mt-2 text-slate-600">
            The t-test compares the difference between two treatment means relative to expected variation. A larger t-statistic suggests a stronger difference between CA and CF results.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">What p-value means in plain language</p>
          <p className="mt-2 text-slate-600">
            The p-value estimates the chance of observing the data if there were actually no difference between treatments. Lower p-values mean stronger evidence that the observed difference is real.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Practical meaning of not significant results</p>
          <p className="mt-2 text-slate-600">
            Results may be statistically not significant while still showing a useful trend or economic advantage. Practical decisions can still be made when the direction of the effect supports a treatment even if statistical power is limited.
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "assumptionsLimitations",
    title: "Assumptions & Limitations",
    searchText: "assumptions limitations workbook a1 a25 category editable",
    content: (
      <div className="overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-900">
            <tr>
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Editable?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {assumptions.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4 font-medium text-slate-900">{row.id}</td>
                <td className="px-4 py-4 text-slate-600">{row.category}</td>
                <td className="px-4 py-4 text-slate-700">{row.description}</td>
                <td className="px-4 py-4 text-slate-700">{row.editable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
];

export function Help() {
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState(() =>
    sections.reduce((acc, section, index) => ({ ...acc, [section.key]: index === 0 }), {}),
  );

  const normalizedSearch = search.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    if (!normalizedSearch) return sections;
    return sections.filter((section) => section.searchText.toLowerCase().includes(normalizedSearch));
  }, [normalizedSearch]);

  const toggleSection = (key) => {
    setOpenSections((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText="Help"
        title="Help & Documentation"
        meta="Reference documentation for FarmEvidence"
        status="Ready"
      />
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <Search className="h-5 w-5 text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search documentation..."
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Search tips</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <span className="rounded-2xl bg-white px-3 py-2 text-xs text-slate-700">Use keywords like &quot;BCR&quot;</span>
                <span className="rounded-2xl bg-white px-3 py-2 text-xs text-slate-700">Search &quot;labour&quot; or &quot;yield&quot;</span>
                <span className="rounded-2xl bg-white px-3 py-2 text-xs text-slate-700">Try &quot;assumptions&quot; for A1–A25</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredSections.length === 0 ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-slate-700">
              <p className="text-lg font-semibold text-rose-900">No matching sections</p>
              <p className="mt-2 text-sm text-rose-700">Try a broader search term like "cost", "setup", or "statistics".</p>
            </div>
          ) : null}

          {filteredSections.map((section) => (
            <div key={section.key} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">Tap to expand and read the full guidance.</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  {openSections[section.key] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>
              {openSections[section.key] ? <div className="border-t border-slate-200 px-6 py-6">{section.content}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
