import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ScreenTopbar } from "../../components/shared/ScreenTopbar";
import { ValidationGate } from '../../components/shared/ValidationGate';
import { useAnalysis } from "../../hooks/useAnalysis";

const tabs = ["Yield Stability", "Break-Even", "Sensitivity", "Partial Budget"];

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fmtRWF(value) {
  return `${Math.round(safeNumber(value)).toLocaleString()} RWF`;
}

function fmtKg(value) {
  return `${safeNumber(value).toFixed(2)} kg`;
}

function fmtPercent(value) {
  return `${safeNumber(value).toFixed(1)}%`;
}

function fmtRatio(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
}

function getCVBadge(cv) {
  const value = safeNumber(cv);
  if (value < 10) {
    return { label: "Low risk", className: "bg-emerald-100 text-emerald-900" };
  }
  if (value < 20) {
    return { label: "Moderate risk", className: "bg-amber-100 text-amber-900" };
  }
  return { label: "High risk", className: "bg-red-100 text-red-900" };
}

function getTrafficLightBadge(mos) {
  const value = safeNumber(mos);
  if (value >= 30) {
    return { label: "Strong", className: "bg-emerald-100 text-emerald-900" };
  }
  if (value >= 15) {
    return { label: "Moderate", className: "bg-amber-100 text-amber-900" };
  }
  return { label: "Weak", className: "bg-red-100 text-red-900" };
}

export function RiskScenarios() {
  const { trialId } = useParams();
  const { analysis, loading, error, refresh } = useAnalysis(trialId);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const topbarStatus = loading ? "Loading…" : error ? "Error loading risk scenarios" : "Ready";
  const topbarTone = loading ? "offline" : error ? "error" : "synced";
  const topbarMeta = analysis?.season ? `${analysis.season} · Risk scenarios` : `Trial ${trialId ?? "unknown"}`;
  const activeFarmLabel = analysis?.trialName ?? trialId;

  const stability = useMemo(() => analysis?.stability ?? {}, [analysis?.stability]);
  const breakEven = useMemo(() => analysis?.breakEven ?? {}, [analysis?.breakEven]);
  const sensitivity = useMemo(() => analysis?.sensitivity ?? {}, [analysis?.sensitivity]);
  const partial = useMemo(() => analysis?.partial ?? {}, [analysis?.partial]);

  const stabilityCA = stability.ca ?? {};
  const stabilityCF = stability.cf ?? {};

  const stabilityChartData = useMemo(() => [
    { name: "CV", CA: safeNumber(stabilityCA.cv), CF: safeNumber(stabilityCF.cv) },
  ], [stabilityCA.cv, stabilityCF.cv]);

  const breakEvenChartData = useMemo(() => [
    {
      name: "CA",
      "Break-Even": safeNumber(breakEven.ca?.yield?.breakEvenYield) || safeNumber(breakEven.ca?.yield?.break_even_yield),
      Actual: safeNumber(breakEven.ca?.yield?.actualYield) || safeNumber(breakEven.ca?.yield?.actual_yield),
    },
    {
      name: "CF",
      "Break-Even": safeNumber(breakEven.cf?.yield?.breakEvenYield) || safeNumber(breakEven.cf?.yield?.break_even_yield),
      Actual: safeNumber(breakEven.cf?.yield?.actualYield) || safeNumber(breakEven.cf?.yield?.actual_yield),
    },
  ], [breakEven.ca, breakEven.cf]);

  const scenarioDefinitions = useMemo(() => {
    if (Array.isArray(sensitivity.scenarios) && sensitivity.scenarios.length) {
      return sensitivity.scenarios.map((scenario) => ({
        name: scenario.name || scenario.label,
        priceChange: safeNumber(scenario.priceChangePercent ?? scenario.price_change_percent),
        newPrice: safeNumber(scenario.newPrice ?? scenario.new_price),
        labourChange: safeNumber(scenario.labourChangePercent ?? scenario.labour_change_percent),
        newWage: safeNumber(scenario.newWage ?? scenario.new_wage),
      }));
    }
    return [
      {
        name: "Pessimistic",
        priceChange: safeNumber(sensitivity.pessimistic?.priceChangePercent ?? sensitivity.pessimistic?.price_change_percent),
        newPrice: safeNumber(sensitivity.pessimistic?.newPrice ?? sensitivity.pessimistic?.new_price),
        labourChange: safeNumber(sensitivity.pessimistic?.labourChangePercent ?? sensitivity.pessimistic?.labour_change_percent),
        newWage: safeNumber(sensitivity.pessimistic?.newWage ?? sensitivity.pessimistic?.new_wage),
      },
      {
        name: "Expected",
        priceChange: safeNumber(sensitivity.expected?.priceChangePercent ?? sensitivity.expected?.price_change_percent),
        newPrice: safeNumber(sensitivity.expected?.newPrice ?? sensitivity.expected?.new_price),
        labourChange: safeNumber(sensitivity.expected?.labourChangePercent ?? sensitivity.expected?.labour_change_percent),
        newWage: safeNumber(sensitivity.expected?.newWage ?? sensitivity.expected?.new_wage),
      },
      {
        name: "Optimistic",
        priceChange: safeNumber(sensitivity.optimistic?.priceChangePercent ?? sensitivity.optimistic?.price_change_percent),
        newPrice: safeNumber(sensitivity.optimistic?.newPrice ?? sensitivity.optimistic?.new_price),
        labourChange: safeNumber(sensitivity.optimistic?.labourChangePercent ?? sensitivity.optimistic?.labour_change_percent),
        newWage: safeNumber(sensitivity.optimistic?.newWage ?? sensitivity.optimistic?.new_wage),
      },
    ];
  }, [sensitivity]);

  const sensitivityChartData = useMemo(() => {
    const ca = sensitivity.ca?.scenarios ?? sensitivity.ca?.scenarioResults ?? [];
    const cf = sensitivity.cf?.scenarios ?? sensitivity.cf?.scenarioResults ?? [];
    return scenarioDefinitions.map((scenario, index) => ({
      name: scenario.name,
      CA: safeNumber(ca[index]?.grossMargin ?? ca[index]?.gross_margin ?? ca[index]?.revenue ?? 0),
      CF: safeNumber(cf[index]?.grossMargin ?? cf[index]?.gross_margin ?? cf[index]?.revenue ?? 0),
    }));
  }, [scenarioDefinitions, sensitivity.ca, sensitivity.cf]);

  const scenarioSummary = useMemo(() => {
    return scenarioDefinitions.map((scenario, index) => {
      const caMetrics = sensitivity.ca?.scenarios?.[index] ?? sensitivity.ca?.scenarioResults?.[index] ?? {};
      const cfMetrics = sensitivity.cf?.scenarios?.[index] ?? sensitivity.cf?.scenarioResults?.[index] ?? {};
      const caGM = safeNumber(caMetrics.grossMargin ?? caMetrics.gross_margin);
      const cfGM = safeNumber(cfMetrics.grossMargin ?? cfMetrics.gross_margin);
      const caCost = safeNumber(caMetrics.totalCost ?? caMetrics.total_cost);
      const cfCost = safeNumber(cfMetrics.totalCost ?? cfMetrics.total_cost);
      const caBCR = safeNumber(caMetrics.BCR ?? caMetrics.bcr);
      const cfBCR = safeNumber(cfMetrics.BCR ?? cfMetrics.bcr);
      const caROI = safeNumber(caMetrics.ROI ?? caMetrics.roi);
      const cfROI = safeNumber(cfMetrics.ROI ?? cfMetrics.roi);
      const caCPK = safeNumber(caMetrics.costPerKg ?? caMetrics.cost_per_kg);
      const cfCPK = safeNumber(cfMetrics.costPerKg ?? cfMetrics.cost_per_kg);
      return {
        name: scenario.name,
        revenue: caGM >= cfGM ? "CA" : "CF",
        totalCost: caCost <= cfCost ? "CA" : "CF",
        grossMargin: caGM >= cfGM ? "CA" : "CF",
        bcr: caBCR >= cfBCR ? "CA" : "CF",
        costPerKg: caCPK <= cfCPK ? "CA" : "CF",
        roi: caROI >= cfROI ? "CA" : "CF",
      };
    });
  }, [scenarioDefinitions, sensitivity.ca, sensitivity.cf]);

  const partialBenefits = partial.additionalBenefits ?? partial.benefits ?? {};
  const partialCosts = partial.additionalCosts ?? partial.costs ?? {};

  const benefitRows = [
    {
      label: "Additional Yield Revenue",
      plot: safeNumber(partialBenefits.additionalYieldRevenue ?? partialBenefits.additional_yield_revenue),
      ha: safeNumber(partialBenefits.additionalYieldRevenueHa ?? partialBenefits.additional_yield_revenue_ha),
    },
    {
      label: "Labour Cost Savings",
      plot: safeNumber(partialBenefits.labourCostSavings ?? partialBenefits.labour_cost_savings),
      ha: safeNumber(partialBenefits.labourCostSavingsHa ?? partialBenefits.labour_cost_savings_ha),
    },
  ];

  const costRows = [
    {
      label: "Mulch Acquisition Cost",
      plot: safeNumber(partialCosts.mulchAcquisitionCost ?? partialCosts.mulch_acquisition_cost),
      ha: safeNumber(partialCosts.mulchAcquisitionCostHa ?? partialCosts.mulch_acquisition_cost_ha),
    },
    {
      label: "C_SD Labour Increase",
      plot: safeNumber(partialCosts.csdLabourIncrease ?? partialCosts.csd_labour_increase),
      ha: safeNumber(partialCosts.csdLabourIncreaseHa ?? partialCosts.csd_labour_increase_ha),
    },
  ];

  const benefitSubtotal = benefitRows.reduce((sum, row) => sum + row.plot, 0);
  const costSubtotal = costRows.reduce((sum, row) => sum + row.plot, 0);
  const netPlot = benefitSubtotal - costSubtotal;
  const netHa = benefitRows.reduce((sum, row) => sum + row.ha, 0) - costRows.reduce((sum, row) => sum + row.ha, 0);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Analysis"
          title="Risk scenarios"
          meta={topbarMeta}
          status={topbarStatus}
          statusTone={topbarTone}
          activeFarmLabel={activeFarmLabel}
        />
        <div className="flex items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4" />
            <p className="text-slate-600">Loading risk scenario analysis…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">        <ScreenTopbar
          superText="Analysis"
          title="Risk scenarios"
          meta={topbarMeta}
          status={topbarStatus}
          statusTone={topbarTone}
          activeFarmLabel={activeFarmLabel}
        />        <div className="rounded-3xl border border-red-200 bg-white p-12 shadow-sm">
          <h1 className="text-2xl font-semibold text-red-900">Error loading risk scenarios</h1>
          <p className="mt-3 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText="Analysis"
        title="Risk scenarios"
        meta={topbarMeta}
        status={topbarStatus}
        statusTone={topbarTone}
        activeFarmLabel={activeFarmLabel}
      />
      <div className="max-w-7xl mx-auto space-y-6">
        <ValidationGate analysis={analysis} trial={trial || {}} plots={plots} />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Risk & Scenarios</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Conservation Agriculture vs Conventional Farming</h1>
            </div>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "Yield Stability" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {[{ label: "CA", values: stabilityCA }, { label: "CF", values: stabilityCF }].map((item) => {
                const badge = getCVBadge(item.values.cv);
                return (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-slate-900">{item.label} Stability</h2>
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${badge.className}`}>{badge.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                      <div className="space-y-3">
                        <div><span className="font-semibold text-slate-900">Mean:</span> {fmtKg(item.values.mean)}</div>
                        <div><span className="font-semibold text-slate-900">SD:</span> {fmtKg(item.values.sd)}</div>
                        <div><span className="font-semibold text-slate-900">Variance:</span> {safeNumber(item.values.variance).toFixed(2)}</div>
                        <div><span className="font-semibold text-slate-900">CV:</span> {fmtPercent(item.values.cv)}</div>
                      </div>
                      <div className="space-y-3">
                        <div><span className="font-semibold text-slate-900">Min:</span> {fmtKg(item.values.min)}</div>
                        <div><span className="font-semibold text-slate-900">Max:</span> {fmtKg(item.values.max)}</div>
                        <div><span className="font-semibold text-slate-900">Median:</span> {fmtKg(item.values.median)}</div>
                        <div><span className="font-semibold text-slate-900">Range:</span> {fmtKg(item.values.range)}</div>
                      </div>
                    </div>
                    <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                      <div><span className="font-semibold text-slate-900">Downside Risk:</span> {fmtPercent(item.values.downsideRisk)}</div>
                      <div><span className="font-semibold text-slate-900">Probability Below Average:</span> {fmtPercent(item.values.probBelowAvg)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Stability Comparison</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stabilityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => fmtPercent(value)} />
                    <Legend />
                    <Bar dataKey="CA" fill="#2D5016" />
                    <Bar dataKey="CF" fill="#4A90D9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Stability Conclusion</h2>
              <p className="text-slate-700">
                {safeNumber(stabilityCA.cv) < safeNumber(stabilityCF.cv)
                  ? "CA is more stable than CF because it has a lower coefficient of variation across yield outcomes. This suggests stronger downside protection and more predictable performance."
                  : safeNumber(stabilityCF.cv) < safeNumber(stabilityCA.cv)
                  ? "CF is more stable than CA because it has a lower coefficient of variation across yield outcomes. This suggests CF is less volatile and more consistent in this trial."
                  : "Both CA and CF show similar variability, so neither system clearly dominates on stability in this trial."}
              </p>
            </div>
          </div>
        )}

        {activeTab === "Break-Even" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {[
                { label: "CA", data: breakEven.ca ?? {} },
                { label: "CF", data: breakEven.cf ?? {} },
              ].map((item) => {
                const yieldData = item.data?.yield ?? item.data?.breakEvenYield ?? {};
                const priceData = item.data?.price ?? item.data?.breakEvenPrice ?? {};
                const yieldMos = safeNumber(yieldData.marginOfSafety ?? yieldData.mos ?? yieldData.margin_of_safety);
                const priceMos = safeNumber(priceData.priceMoS ?? priceData.price_mos ?? priceData.marginOfSafety);
                const yieldBadge = getTrafficLightBadge(yieldMos);
                const priceBadge = getTrafficLightBadge(priceMos);
                return (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">{item.label}</h2>
                    <div className="grid gap-4">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <h3 className="font-semibold text-slate-900 mb-3">Break-Even Yield</h3>
                        <div className="grid gap-2 text-sm text-slate-700">
                          <div><span className="font-semibold text-slate-900">Avg Cost:</span> {fmtRWF(yieldData.avgCost ?? yieldData.avg_cost)}</div>
                          <div><span className="font-semibold text-slate-900">Market Price:</span> {fmtRWF(yieldData.marketPrice ?? yieldData.market_price)}</div>
                          <div><span className="font-semibold text-slate-900">Break-Even Yield:</span> {fmtKg(yieldData.breakEvenYield ?? yieldData.break_even_yield)}</div>
                          <div><span className="font-semibold text-slate-900">Break-Even Yield (ha):</span> {fmtKg(yieldData.breakEvenYieldHa ?? yieldData.break_even_yield_ha)}</div>
                          <div><span className="font-semibold text-slate-900">Actual Yield:</span> {fmtKg(yieldData.actualYield ?? yieldData.actual_yield)}</div>
                          <div><span className="font-semibold text-slate-900">Yield Surplus:</span> {fmtKg(yieldData.yieldSurplus ?? yieldData.yield_surplus)}</div>
                          <div className="flex items-center gap-2"><span className="font-semibold text-slate-900">Margin of Safety:</span> {fmtPercent(yieldMos)}<span className={`rounded-full px-2 py-1 text-xs font-semibold ${yieldBadge.className}`}>{yieldBadge.label}</span></div>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <h3 className="font-semibold text-slate-900 mb-3">Break-Even Price</h3>
                        <div className="grid gap-2 text-sm text-slate-700">
                          <div><span className="font-semibold text-slate-900">Avg Cost:</span> {fmtRWF(priceData.avgCost ?? priceData.avg_cost)}</div>
                          <div><span className="font-semibold text-slate-900">Actual Yield:</span> {fmtKg(priceData.actualYield ?? priceData.actual_yield)}</div>
                          <div><span className="font-semibold text-slate-900">Break-Even Price:</span> {fmtRWF(priceData.breakEvenPrice ?? priceData.break_even_price)}</div>
                          <div><span className="font-semibold text-slate-900">Current Market Price:</span> {fmtRWF(priceData.currentMarketPrice ?? priceData.current_market_price)}</div>
                          <div><span className="font-semibold text-slate-900">Price Surplus:</span> {fmtRWF(priceData.priceSurplus ?? priceData.price_surplus)}</div>
                          <div className="flex items-center gap-2"><span className="font-semibold text-slate-900">Price MoS:</span> {fmtPercent(priceMos)}<span className={`rounded-full px-2 py-1 text-xs font-semibold ${priceBadge.className}`}>{priceBadge.label}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Break-Even Yield vs Actual Yield</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakEvenChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => fmtKg(value)} />
                    <Legend />
                    <Bar dataKey="Break-Even" fill="#2D5016" />
                    <Bar dataKey="Actual" fill="#4A90D9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Sensitivity" && (
          <div className="space-y-6">
            {/* Probability-Weighted Expected Profit Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Probability-Weighted Expected Profit</h2>
              
              <div className="mb-6 rounded-2xl bg-blue-50 border border-blue-100 p-4">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Weights are CSI-adjusted.</span> Your site CSI = {safeNumber(analysis?.fullCBA?.csi).toFixed(2)} ({analysis?.fullCBA?.csiCategory || "Standard"}) — scenario weights set accordingly.
                </p>
              </div>

              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Scenario</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Weight (%)</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">CA Profit</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">CF Profit</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">ΔC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {scenarioDefinitions.map((scenario, index) => {
                    const weights = analysis?.fullCBA?.scenarioWeights ?? {};
                    const scenarioWeight = safeNumber(
                      weights[scenario.name.toLowerCase()] ?? 
                      weights[scenario.name] ?? 
                      (index === 0 ? 25 : index === 1 ? 50 : 25)
                    );
                    const caProfit = safeNumber(
                      analysis?.fullCBA?.ca?.scenarioResults?.[index]?.profit ?? 
                      analysis?.fullCBA?.ca?.scenarios?.[index]?.profit ?? 0
                    );
                    const cfProfit = safeNumber(
                      analysis?.fullCBA?.cf?.scenarioResults?.[index]?.profit ?? 
                      analysis?.fullCBA?.cf?.scenarios?.[index]?.profit ?? 0
                    );
                    const deltaC = caProfit - cfProfit;
                    return (
                      <tr key={scenario.name}>
                        <td className="px-4 py-3 text-slate-900">{scenario.name}</td>
                        <td className="px-4 py-3 text-right text-slate-900">{fmtPercent(scenarioWeight)}</td>
                        <td className="px-4 py-3 text-right text-slate-900">{fmtRWF(caProfit)}</td>
                        <td className="px-4 py-3 text-right text-slate-900">{fmtRWF(cfProfit)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${deltaC >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          {fmtRWF(deltaC)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-4 py-3 text-slate-900">Expected Value (Weighted)</td>
                    <td className="px-4 py-3 text-right text-slate-900">100.0%</td>
                    <td className="px-4 py-3 text-right text-slate-900">
                      {fmtRWF(safeNumber(analysis?.fullCBA?.ca?.expectedProfit) ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900">
                      {fmtRWF(safeNumber(analysis?.fullCBA?.cf?.expectedProfit) ?? 0)}
                    </td>
                    <td className={`px-4 py-3 text-right ${
                      (safeNumber(analysis?.fullCBA?.ca?.expectedProfit) ?? 0) - (safeNumber(analysis?.fullCBA?.cf?.expectedProfit) ?? 0) >= 0 
                        ? "text-emerald-700" 
                        : "text-red-700"
                    }`}>
                      {fmtRWF((safeNumber(analysis?.fullCBA?.ca?.expectedProfit) ?? 0) - (safeNumber(analysis?.fullCBA?.cf?.expectedProfit) ?? 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expected Profit Confidence Band Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Expected Profit Confidence Band</h2>
              
              <div className="space-y-8">
                {[
                  { 
                    label: "CA", 
                    expected: safeNumber(analysis?.fullCBA?.ca?.expectedProfit), 
                    stdDev: safeNumber(analysis?.fullCBA?.ca?.profitStdDev),
                    barBgClass: "bg-emerald-100",
                    barBorderClass: "border-emerald-300",
                    dotClass: "bg-emerald-600",
                    lineClass: "bg-emerald-400"
                  },
                  { 
                    label: "CF", 
                    expected: safeNumber(analysis?.fullCBA?.cf?.expectedProfit), 
                    stdDev: safeNumber(analysis?.fullCBA?.cf?.profitStdDev),
                    barBgClass: "bg-blue-100",
                    barBorderClass: "border-blue-300",
                    dotClass: "bg-blue-600",
                    lineClass: "bg-blue-400"
                  }
                ].map((item) => {
                  const lower = item.expected - item.stdDev;
                  const upper = item.expected + item.stdDev;
                  const minVal = Math.min(lower, 0);
                  const maxVal = Math.max(upper, 0);
                  const totalRange = maxVal - minVal;
                  const lowerPct = totalRange > 0 ? ((lower - minVal) / totalRange) * 100 : 0;
                  const expectedPct = totalRange > 0 ? ((item.expected - minVal) / totalRange) * 100 : 50;
                  const upperPct = totalRange > 0 ? ((upper - minVal) / totalRange) * 100 : 100;
                  
                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-slate-900">{item.label} Profit Range</p>
                        <div className="text-right text-sm text-slate-600">
                          <div>Expected: <span className="font-semibold text-slate-900">{fmtRWF(item.expected)}</span></div>
                          <div>±1 SD: <span className="font-semibold text-slate-900">{fmtRWF(item.stdDev)}</span></div>
                        </div>
                      </div>
                      
                      <div className="relative h-12 bg-slate-100 rounded-lg overflow-hidden">
                        {/* Range bar background */}
                        <div 
                          className={`absolute top-2 bottom-2 border-2 ${item.barBgClass} ${item.barBorderClass}`}
                          style={{
                            left: `${lowerPct}%`,
                            right: `${100 - upperPct}%`
                          }}
                        />
                        
                        {/* Mean dot */}
                        <div 
                          className={`absolute top-1/2 w-6 h-6 -translate-y-1/2 -translate-x-1/2 ${item.dotClass} rounded-full border-2 border-white shadow-md z-10`}
                          style={{ left: `${expectedPct}%` }}
                          title={`Mean: ${fmtRWF(item.expected)}`}
                        />
                        
                        {/* Lower bound line */}
                        <div 
                          className={`absolute top-0 bottom-0 w-1 ${item.lineClass}`}
                          style={{ left: `${lowerPct}%` }}
                        />
                        
                        {/* Upper bound line */}
                        <div 
                          className={`absolute top-0 bottom-0 w-1 ${item.lineClass}`}
                          style={{ right: `${100 - upperPct}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>{fmtRWF(lower)}</span>
                        <span>{fmtRWF(item.expected)}</span>
                        <span>{fmtRWF(upper)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Scenario Definitions</h2>
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Scenario</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Price Change</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">New Price</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Labour Change</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">New Wage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {scenarioDefinitions.map((scenario) => (
                    <tr key={scenario.name}>
                      <td className="px-4 py-3 text-slate-900">{scenario.name}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{fmtPercent(scenario.priceChange)}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{fmtRWF(scenario.newPrice)}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{fmtPercent(scenario.labourChange)}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{fmtRWF(scenario.newWage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {[
                { label: "CA", data: sensitivity.ca?.scenarios ?? sensitivity.ca?.scenarioResults ?? [] },
                { label: "CF", data: sensitivity.cf?.scenarios ?? sensitivity.cf?.scenarioResults ?? [] },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">{item.label} Scenario Results</h2>
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Metric</th>
                        {scenarioDefinitions.map((scenario) => (
                          <th key={scenario.name} className="px-4 py-3 text-right font-semibold text-slate-700">{scenario.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {[
                        { label: "Revenue", key: "revenue" },
                        { label: "Total Cost", key: "totalCost" },
                        { label: "Gross Margin", key: "grossMargin" },
                        { label: "BCR", key: "bcr" },
                        { label: "Cost per kg", key: "costPerKg" },
                        { label: "ROI (%)", key: "roi" },
                      ].map((metric) => (
                        <tr key={metric.key}>
                          <td className="px-4 py-3 text-slate-900">{metric.label}</td>
                          {scenarioDefinitions.map((scenario, index) => {
                            const cell = item.data[index] ?? {};
                            const value = safeNumber(cell[metric.key] ?? cell[metric.key.toLowerCase()]);
                            return (
                              <td key={scenario.name} className="px-4 py-3 text-right text-slate-900">
                                {metric.key === "bcr" || metric.key === "costPerKg" || metric.key === "roi"
                                  ? metric.key === "roi"
                                    ? fmtPercent(value)
                                    : metric.key === "costPerKg"
                                    ? fmtRWF(value)
                                    : fmtRatio(value)
                                  : metric.key === "revenue" || metric.key === "grossMargin" || metric.key === "totalCost"
                                  ? fmtRWF(value)
                                  : value}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Gross Margin Scenario Comparison</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sensitivityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => fmtRWF(value)} />
                    <Legend />
                    <Bar dataKey="CA" fill="#2D5016" />
                    <Bar dataKey="CF" fill="#4A90D9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Scenario Comparison Summary</h2>
              <div className="space-y-4">
                {scenarioSummary.map((scenario) => (
                  <div key={scenario.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900 mb-2">{scenario.name}</p>
                    <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-3">
                      <div>Revenue winner: <span className="font-semibold">{scenario.revenue}</span></div>
                      <div>Cost winner: <span className="font-semibold">{scenario.totalCost}</span></div>
                      <div>Gross Margin winner: <span className="font-semibold">{scenario.grossMargin}</span></div>
                      <div>BCR winner: <span className="font-semibold">{scenario.bcr}</span></div>
                      <div>Cost/kg winner: <span className="font-semibold">{scenario.costPerKg}</span></div>
                      <div>ROI winner: <span className="font-semibold">{scenario.roi}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Partial Budget" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Additional Benefits</h2>
                <div className="space-y-4 text-sm text-slate-700">
                  {benefitRows.map((row) => (
                    <div key={row.label} className="flex justify-between border-b border-emerald-100 pb-3">
                      <div>{row.label}</div>
                      <div className="text-right">
                        <div>{fmtRWF(row.plot)}</div>
                        <div className="text-slate-500 text-xs">{fmtRWF(row.ha)}/ha</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-4 text-sm font-semibold text-slate-900">
                    <div>Subtotal</div>
                    <div>{fmtRWF(benefitSubtotal)}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Additional Costs</h2>
                <div className="space-y-4 text-sm text-slate-700">
                  {costRows.map((row) => (
                    <div key={row.label} className="flex justify-between border-b border-red-100 pb-3">
                      <div>{row.label}</div>
                      <div className="text-right">
                        <div>{fmtRWF(row.plot)}</div>
                        <div className="text-slate-500 text-xs">{fmtRWF(row.ha)}/ha</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-4 text-sm font-semibold text-slate-900">
                    <div>Subtotal</div>
                    <div>{fmtRWF(costSubtotal)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Net Change</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{fmtRWF(netPlot)} per plot</p>
                  <p className="text-sm text-slate-600">{fmtRWF(netHa)} per hectare</p>
                </div>
                <div className={`rounded-full px-4 py-2 text-sm font-semibold ${netPlot >= 0 ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"}`}>
                  {netPlot >= 0
                    ? `Adopt Conservation Agriculture — Net gain of ${fmtRWF(netPlot)} per plot`
                    : "Retain Conventional Farming — No net gain from adoption"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
