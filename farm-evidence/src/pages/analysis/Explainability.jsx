import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ScreenTopbar } from "../../components/shared/ScreenTopbar";
import { useAnalysis } from "../../hooks/useAnalysis";

function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatNumber(value, digits = 0) {
  const num = safeNumber(value);
  return num.toFixed(digits);
}

function formatRWF(value) {
  const num = safeNumber(value);
  if (num === 0) return "0";
  return Math.round(num).toLocaleString();
}

function formatRatio(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : "—";
}

function formatPercent(value, digits = 1) {
  const num = safeNumber(value);
  return `${num.toFixed(digits)}%`;
}

function firstDefined(plot, keys) {
  for (const key of keys) {
    if (plot?.[key] !== undefined && plot?.[key] !== null) {
      return plot[key];
    }
  }
  return null;
}

function sumCostRows(value) {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return safeNumber(value);
  if (Array.isArray(value)) {
    return value.reduce((sum, row) => {
      if (!row) return sum;
      const rowValue = firstDefined(row, ["cost", "amount", "totalCost", "total_cost", "value"]);
      return sum + safeNumber(rowValue);
    }, 0);
  }
  return 0;
}

function getPlotValue(plot, keys) {
  return firstDefined(plot, keys);
}

function getNumericPlotValue(plot, keys) {
  return safeNumber(getPlotValue(plot, keys));
}

function getTotalCost(plot) {
  const explicitTotal = getPlotValue(plot, ["total_cost", "totalCost", "totalCostPerPlot"]);
  if (explicitTotal !== null && explicitTotal !== undefined) {
    const total = safeNumber(explicitTotal);
    if (total > 0) return total;
  }

  const inputCost = getPlotValue(plot, ["input_costs", "inputCosts", "inputs", "inputCost"]);
  const labourCost = getPlotValue(plot, ["labor_costs", "labour_costs", "labourCosts", "labour_cost", "laborCosts"]);
  return sumCostRows(inputCost) + sumCostRows(labourCost);
}

function getYieldKg(plot) {
  return getNumericPlotValue(plot, ["yield_kg", "yieldKg", "yield"]);
}

function getGrossRevenue(plot) {
  const explicitRevenue = getPlotValue(plot, ["gross_revenue", "grossRevenue", "revenue", "revenue_kg"]);
  if (explicitRevenue !== null && explicitRevenue !== undefined) {
    return safeNumber(explicitRevenue);
  }
  const yieldKg = getYieldKg(plot);
  const price = getNumericPlotValue(plot, ["price", "marketPrice", "market_price", "marketPricePerKg"]);
  return yieldKg * price;
}

function getProfit(plot) {
  const explicitProfit = getPlotValue(plot, ["profit", "net_benefit", "netBenefit", "gross_profit"]);
  if (explicitProfit !== null && explicitProfit !== undefined) {
    return safeNumber(explicitProfit);
  }
  return getGrossRevenue(plot) - getTotalCost(plot);
}

function getBcr(plot) {
  const explicitBcr = getPlotValue(plot, ["bcr", "BCR", "benefitCostRatio"]);
  if (explicitBcr !== null && explicitBcr !== undefined) {
    return safeNumber(explicitBcr);
  }
  const totalCost = getTotalCost(plot);
  if (totalCost === 0) return 0;
  return getGrossRevenue(plot) / totalCost;
}

function getCsD(plot) {
  return getNumericPlotValue(plot, ["c_sd", "cSd", "C_SD", "csd"]);
}

function getLabourTime(plot) {
  return getNumericPlotValue(plot, ["labour_time", "labor_time", "labourTime", "laborMinutes", "totalLabourMinutes"]);
}

function getMulchCost(plot) {
  const inputCosts = getPlotValue(plot, ["input_costs", "inputCosts", "inputs", "inputCost"]);
  if (Array.isArray(inputCosts)) {
    return inputCosts.reduce((sum, row) => {
      if (!row) return sum;
      const description = String(getPlotValue(row, ["description", "item", "name", "label"]) ?? "").toLowerCase();
      if (/mulch|residue|crop residue|cover crop/.test(description)) {
        return sum + safeNumber(firstDefined(row, ["cost", "amount", "totalCost", "value", "unitCost"]));
      }
      return sum;
    }, 0);
  }
  return sumCostRows(inputCosts);
}

function average(values) {
  const numeric = values.filter((n) => Number.isFinite(n));
  if (numeric.length === 0) return 0;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function chooseWinner(caValue, cfValue, compareHigher = true) {
  if (caValue === cfValue) return "Tie";
  if (compareHigher) {
    return caValue > cfValue ? "CA" : "CF";
  }
  return caValue < cfValue ? "CA" : "CF";
}

function parseYieldSignificance(stats) {
  if (!stats) return null;
  const tTest = stats.tTest ?? stats?.t_test ?? null;
  if (!tTest) return null;
  if (typeof tTest.significant === "boolean") return tTest.significant;
  const pValue = getNumericPlotValue(tTest, ["pValue", "p_value", "p", "pVal"]);
  if (pValue === 0) return null;
  return pValue <= 0.05;
}

export function Explainability() {
  const { trialId } = useParams();
  const { analysis, loading, error } = useAnalysis(trialId);
  const topbarStatus = loading ? "Loading…" : error ? "Error loading explainability" : "Ready";
  const topbarTone = loading ? "offline" : error ? "error" : "synced";
  const topbarMeta = analysis?.season ? `${analysis.season} · Farm evidence explainability` : `Trial ${trialId ?? "unknown"}`;
  const activeFarmLabel = analysis?.trialName ?? trialId;

  const report = useMemo(() => {
    if (!analysis) return null;

    const plots = Array.isArray(analysis.plots) ? analysis.plots : [];
    const caPlots = plots.filter((plot) => String(getPlotValue(plot, ["treatment"])).toUpperCase() === "CA");
    const cfPlots = plots.filter((plot) => String(getPlotValue(plot, ["treatment"])).toUpperCase() === "CF");

    const caYields = caPlots.map(getYieldKg);
    const cfYields = cfPlots.map(getYieldKg);
    const caAvgYield = average(caYields);
    const cfAvgYield = average(cfYields);
    const yieldDiff = caAvgYield - cfAvgYield;
    const yieldPct = cfAvgYield > 0 ? (yieldDiff / cfAvgYield) * 100 : 0;

    const caCosts = caPlots.map(getTotalCost);
    const cfCosts = cfPlots.map(getTotalCost);
    const caAvgCost = average(caCosts);
    const cfAvgCost = average(cfCosts);
    const costDiff = caAvgCost - cfAvgCost;

    const caProfit = average(caPlots.map(getProfit));
    const cfProfit = average(cfPlots.map(getProfit));

    const caBcr = average(caPlots.map(getBcr));
    const cfBcr = average(cfPlots.map(getBcr));

    const caCsd = average(caPlots.map(getCsD));
    const cfCsd = average(cfPlots.map(getCsD));

    const caLabour = average(caPlots.map(getLabourTime));
    const cfLabour = average(cfPlots.map(getLabourTime));

    const caMulch = average(caPlots.map(getMulchCost));
    const cfMulch = average(cfPlots.map(getMulchCost));

    const statsYield = analysis.stats?.yield ?? null;
    const yieldSignificant = parseYieldSignificance(statsYield);
    const caCv = getNumericPlotValue(statsYield?.descCA ?? {}, ["cv"]);
    const cfCv = getNumericPlotValue(statsYield?.descCF ?? {}, ["cv"]);
    const caYieldSpread = caYields.length ? Math.max(...caYields) - Math.min(...caYields) : 0;
    const cfYieldSpread = cfYields.length ? Math.max(...cfYields) - Math.min(...cfYields) : 0;

    const yieldWinner = chooseWinner(caAvgYield, cfAvgYield, true);
    const costWinner = chooseWinner(caAvgCost, cfAvgCost, false);
    const netWinner = chooseWinner(caProfit, cfProfit, true);
    const bcrWinner = chooseWinner(caBcr, cfBcr, true);
    const csdWinner = chooseWinner(caCsd, cfCsd, false);
    const evidenceWinner = yieldSignificant ? (yieldDiff > 0 ? "CA" : yieldDiff < 0 ? "CF" : "Tie") : "Mixed";

    const criteria = [
      {
        label: "Yield",
        winner: yieldWinner,
        detail: `CA ${yieldWinner === "CA" ? "led" : yieldWinner === "CF" ? "lagged" : "matched"} with ${formatNumber(caAvgYield, 1)} vs ${formatNumber(cfAvgYield, 1)} kg/plot`,
      },
      {
        label: "Production cost",
        winner: costWinner,
        detail: `${costWinner} had the lower average cost (${formatRWF(costWinner === "CA" ? caAvgCost : cfAvgCost)} RWF/plot)`,
      },
      {
        label: "Net benefit",
        winner: netWinner,
        detail: `${netWinner} returned ${formatRWF(netWinner === "CA" ? caProfit : cfProfit)} RWF/plot`,
      },
      {
        label: "Benefit-cost ratio",
        winner: bcrWinner,
        detail: `${formatRatio(caBcr)} vs ${formatRatio(cfBcr)} BCR`,
      },
      {
        label: "System-dependent cost",
        winner: csdWinner,
        detail: `${formatRWF(caCsd)} vs ${formatRWF(cfCsd)} RWF`,
      },
      {
        label: "Yield evidence",
        winner: evidenceWinner,
        detail: yieldSignificant === null
          ? "Statistical evidence unavailable"
          : yieldSignificant
          ? `${yieldWinner} difference is statistically significant`
          : "Yield difference is not statistically significant",
      },
    ];

    const caWins = criteria.filter((item) => item.winner === "CA").length;
    const cfWins = criteria.filter((item) => item.winner === "CF").length;
    const recommendation =
      caWins >= 4
        ? { tone: "emerald", title: "Adopt Conservation Agriculture", subtitle: `CA wins ${caWins} of 6 criteria.` }
        : cfWins >= 4
        ? { tone: "blue", title: "Retain Conventional Farming", subtitle: `CF wins ${cfWins} of 6 criteria.` }
        : { tone: "amber", title: "Results are mixed — multi-season validation recommended", subtitle: `CA won ${caWins}, CF won ${cfWins}, remaining evidence is mixed.` };

    return {
      plots,
      caPlots,
      cfPlots,
      caAvgYield,
      cfAvgYield,
      yieldDiff,
      yieldPct,
      caAvgCost,
      cfAvgCost,
      costDiff,
      caProfit,
      cfProfit,
      caBcr,
      cfBcr,
      caCsd,
      cfCsd,
      caLabour,
      cfLabour,
      caMulch,
      cfMulch,
      caYieldSpread,
      cfYieldSpread,
      caCv,
      cfCv,
      yieldSignificant,
      criteria,
      recommendation,
      yieldWinner,
      costWinner,
      netWinner,
      bcrWinner,
      csdWinner,
      evidenceWinner,
    };
  }, [analysis]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Analysis"
          title="Explainability"
          meta={topbarMeta}
          status={topbarStatus}
          statusTone={topbarTone}
          activeFarmLabel={activeFarmLabel}
        />
        <div className="flex items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4" />
            <p className="text-slate-600">Loading explainability report…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">        <ScreenTopbar
          superText="Analysis"
          title="Explainability"
          meta={topbarMeta}
          status={topbarStatus}
          statusTone={topbarTone}
          activeFarmLabel={activeFarmLabel}
        />        <div className="rounded-3xl border border-red-200 bg-white p-12 shadow-sm">
          <h1 className="text-2xl font-semibold text-red-900">Error loading explainability data</h1>
          <p className="mt-3 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Analysis"
          title="Explainability"
          meta={topbarMeta}
          status={topbarStatus}
          statusTone={topbarTone}
          activeFarmLabel={activeFarmLabel}
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-slate-900">No explainability data available</h1>
          <p className="mt-3 text-slate-600">Explainability insights will appear once the trial analysis is processed.</p>
        </div>
      </div>
    );
  }

  const comparisonTone = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    blue: "bg-sky-50 border-sky-200 text-sky-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
  }[report.recommendation.tone];

  const summaryCards = [
    {
      title: "Yield difference",
      body: `CA produced ${formatNumber(report.caAvgYield, 1)} kg/plot vs CF ${formatNumber(report.cfAvgYield, 1)} kg/plot — a difference of ${formatNumber(report.yieldDiff, 1)} kg (${formatPercent(report.yieldPct)}).`,
    },
    {
      title: "Cost difference",
      body: `CA total cost was ${formatRWF(report.caAvgCost)} RWF vs CF ${formatRWF(report.cfAvgCost)} RWF — CA costs ${report.costDiff > 0 ? "more" : report.costDiff < 0 ? "less" : "the same"} by ${formatRWF(Math.abs(report.costDiff))} RWF.`,
    },
    {
      title: "Net benefit",
      body: `CA net benefit was ${formatRWF(report.caProfit)} RWF/plot vs CF ${formatRWF(report.cfProfit)} RWF/plot.`,
    },
    {
      title: "Benefit-cost ratio",
      body: `CA BCR = ${formatRatio(report.caBcr)} vs CF BCR = ${formatRatio(report.cfBcr)} — every 1 RWF invested in CA returns ${formatRatio(report.caBcr)} RWF.`,
    },
  ];

  const whyCards = [
    {
      title: "Why yield differs",
      body: `CA has ${formatPercent(report.caCv)} CV vs CF ${formatPercent(report.cfCv)} CV with a replicate spread of ${formatNumber(report.caYieldSpread, 1)} kg for CA and ${formatNumber(report.cfYieldSpread, 1)} kg for CF. ${report.yieldSignificant === null ? "Significance could not be determined." : report.yieldSignificant ? "The yield gap is statistically significant." : "The yield gap is not statistically significant."}`,
    },
    {
      title: "Why cost differs",
      body: `CA has higher C_SD (${formatRWF(report.caCsd)} RWF) due to mulch-related input spend (${formatRWF(report.caMulch)} RWF) but lower reported labour time. CF has lower C_SD (${formatRWF(report.cfCsd)} RWF) but higher total labour time (${formatNumber(report.cfLabour, 0)} min vs CA ${formatNumber(report.caLabour, 0)} min).`,
    },
    {
      title: "Why BCR differs",
      body: `CA's BCR of ${formatRatio(report.caBcr)} and net benefit of ${formatRWF(report.caProfit)} RWF/plot ${report.caBcr > report.cfBcr ? "outperform" : report.caBcr < report.cfBcr ? "trail" : "match"} CF's BCR of ${formatRatio(report.cfBcr)} and net benefit of ${formatRWF(report.cfProfit)} RWF/plot.`,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText="Analysis"
        title="Explainability"
        meta={topbarMeta}
        status={topbarStatus}
        statusTone={topbarTone}
        activeFarmLabel={activeFarmLabel}
      />
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900">Explainability & Insights</h1>
            <p className="mt-3 max-w-3xl text-slate-600">Plain-language findings derived from the current trial analysis across yield, cost and profitability.</p>
          </div>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900">What changed</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {summaryCards.map((card) => (
                <div key={card.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">{card.title}</h3>
                  <p className="text-slate-700">{card.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900">Why it changed</h2>
            <div className="grid gap-6 lg:grid-cols-3">
              {whyCards.map((card) => (
                <div key={card.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">{card.title}</h3>
                  <p className="text-slate-700">{card.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900">How the metrics are calculated</h2>
            <div className="space-y-4">
              <details className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <summary className="cursor-pointer text-lg font-semibold text-slate-900">How Total Production Cost is calculated</summary>
                <p className="mt-3 text-slate-600">TPC = Σ Input Costs + Σ Labour Costs. Labour Cost is included as the total cost of hired work, own labour or time spent on weeding, planting and soil management.</p>
              </details>
              <details className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <summary className="cursor-pointer text-lg font-semibold text-slate-900">How BCR is calculated</summary>
                <p className="mt-3 text-slate-600">BCR = Gross Revenue / Total Production Cost. A BCR above 1 means revenue exceeds production cost, while a BCR below 1 means the system is losing money on average per plot.</p>
              </details>
              <details className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <summary className="cursor-pointer text-lg font-semibold text-slate-900">How Net Benefit is calculated</summary>
                <p className="mt-3 text-slate-600">Net Benefit = Gross Revenue − Total Production Cost. This captures the average return per plot after all input and labour costs are paid.</p>
              </details>
              <details className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <summary className="cursor-pointer text-lg font-semibold text-slate-900">How C_SD vs C_SI are classified</summary>
                <p className="mt-3 text-slate-600">C_SD are system-dependent costs such as mulch, cover crop seed and extra tillage that change with farming practices. C_SI are system-independent costs such as fixed land rent, irrigation infrastructure or constant equipment use.</p>
              </details>
            </div>
          </section>

          <section className="space-y-6">
            <div className={`rounded-3xl border p-6 shadow-sm ${comparisonTone}`}>
              <h2 className="text-2xl font-semibold">{report.recommendation.title}</h2>
              <p className="mt-2 text-slate-700">{report.recommendation.subtitle}</p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-1 gap-0 border-b border-slate-200 bg-slate-50 px-6 py-4 md:grid-cols-[2fr_1fr_1fr]">
                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Criterion</span>
                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Winner</span>
                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Detail</span>
              </div>
              {report.criteria.map((item) => (
                <div key={item.label} className="grid grid-cols-1 gap-0 border-b border-slate-200 px-6 py-4 md:grid-cols-[2fr_1fr_1fr]">
                  <span className="text-slate-700 font-medium">{item.label}</span>
                  <span className="text-slate-900">{item.winner}</span>
                  <span className="text-slate-600">{item.detail}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
