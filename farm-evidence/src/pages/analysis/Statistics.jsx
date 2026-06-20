import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ScreenTopbar } from "../../components/shared/ScreenTopbar";
import { useAnalysis } from "../../hooks/useAnalysis";

function safeNumber(val) {
  const n = Number(val);
  return !isNaN(n) ? n : 0;
}

function formatPValue(p) {
  if (p === null || p === undefined) return "—";
  const num = safeNumber(p);
  return num < 0.001 ? "<0.001" : num.toFixed(4);
}

function formatNumber(val, decimals = 2) {
  const n = safeNumber(val);
  return n.toFixed(decimals);
}

function significanceBadge(pValue) {
  const p = safeNumber(pValue);
  const isSignificant = p <= 0.05;
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
        isSignificant
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {isSignificant ? "Significant *" : "Not significant (ns)"}
    </span>
  );
}

export function Statistics() {
  const { trialId } = useParams();
  const { analysis, loading, error } = useAnalysis(trialId);
  const topbarStatus = loading ? "Loading…" : error ? "Error loading statistics" : "Ready";
  const topbarTone = loading ? "offline" : error ? "error" : "synced";
  const topbarMeta = analysis?.season ? `${analysis.season} · Statistics` : `Trial ${trialId ?? "unknown"}`;
  const activeFarmLabel = analysis?.trialName ?? trialId;

  const stats = useMemo(() => {
    if (!analysis?.stats) return null;
    return {
      yield: analysis.stats.yield,
      grossMargin: analysis.stats.grossMargin,
      csd: analysis.stats.csd,
    };
  }, [analysis]);

  const rcbd = useMemo(() => {
    if (!analysis?.rcbd) return null;
    return analysis.rcbd;
  }, [analysis]);

  const interpretations = useMemo(() => {
    if (!stats) return [];

    const results = [];

    // H₀a: Yield
    if (stats.yield?.tTest) {
      const yieldCA = safeNumber(stats.yield.descCA?.mean);
      const yieldCF = safeNumber(stats.yield.descCF?.mean);
      const tVal = safeNumber(stats.yield.tTest.tStatistic);
      const pVal = safeNumber(stats.yield.tTest.pValue);
      const df = safeNumber(stats.yield.tTest.df);
      const isSignificant = pVal <= 0.05 ? "Significant" : "Not significant";

      results.push({
        hypothesis: "H₀a: Yield Equivalence",
        text: `H₀a (Yield): No difference in crop yield between CA and CF treatments. Statistical decision: ${isSignificant} (t(${df}) = ${formatNumber(tVal, 3)}, p = ${formatPValue(pVal)}). Conclusion: CA yielded ${formatNumber(yieldCA, 1)} kg/plot vs CF ${formatNumber(yieldCF, 1)} kg/plot.`,
      });
    }

    // H₀b: Gross Margin
    if (stats.grossMargin?.tTest) {
      const gmCA = safeNumber(stats.grossMargin.descCA?.mean);
      const gmCF = safeNumber(stats.grossMargin.descCF?.mean);
      const tVal = safeNumber(stats.grossMargin.tTest.tStatistic);
      const pVal = safeNumber(stats.grossMargin.tTest.pValue);
      const df = safeNumber(stats.grossMargin.tTest.df);
      const isSignificant = pVal <= 0.05 ? "Significant" : "Not significant";

      results.push({
        hypothesis: "H₀b: Economic Profitability",
        text: `H₀b (Gross Margin): No difference in profitability between CA and CF treatments. Statistical decision: ${isSignificant} (t(${df}) = ${formatNumber(tVal, 3)}, p = ${formatPValue(pVal)}). Conclusion: CA gross margin was ${formatNumber(gmCA, 0)} RWF/plot vs CF ${formatNumber(gmCF, 0)} RWF/plot.`,
      });
    }

    // H₀c: System-Dependent Cost
    if (stats.csd?.tTest) {
      const csdCA = safeNumber(stats.csd.descCA?.mean);
      const csdCF = safeNumber(stats.csd.descCF?.mean);
      const tVal = safeNumber(stats.csd.tTest.tStatistic);
      const pVal = safeNumber(stats.csd.tTest.pValue);
      const df = safeNumber(stats.csd.tTest.df);
      const isSignificant = pVal <= 0.05 ? "Significant" : "Not significant";

      results.push({
        hypothesis: "H₀c: System-Dependent Costs",
        text: `H₀c (C_SD Cost): No difference in system-dependent costs between CA and CF treatments. Statistical decision: ${isSignificant} (t(${df}) = ${formatNumber(tVal, 3)}, p = ${formatPValue(pVal)}). Conclusion: CA C_SD cost was ${formatNumber(csdCA, 0)} RWF/plot vs CF ${formatNumber(csdCF, 0)} RWF/plot.`,
      });
    }

    return results;
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Analysis"
          title="Statistics"
          meta={topbarMeta}
          status={topbarStatus}
          statusTone={topbarTone}
          activeFarmLabel={activeFarmLabel}
        />
        <div className="flex items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4" />
            <p className="text-slate-600">Loading statistical analysis…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Analysis"
          title="Statistics"
          meta={topbarMeta}
          status={topbarStatus}
          statusTone={topbarTone}
          activeFarmLabel={activeFarmLabel}
        />
        <div className="rounded-3xl border border-red-200 bg-white p-12 shadow-sm">
          <h1 className="text-2xl font-semibold text-red-900">Error loading analysis</h1>
          <p className="mt-3 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!analysis || !stats) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Analysis"
          title="Statistics"
          meta={topbarMeta}
          status="No analysis"
          statusTone="offline"
          activeFarmLabel={activeFarmLabel}
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-slate-900">No statistical data available</h1>
          <p className="mt-3 text-slate-600">Statistical analysis will appear once trial data is processed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText="Analysis"
        title="Statistics"
        meta={topbarMeta}
        status={topbarStatus}
        statusTone={topbarTone}
        activeFarmLabel={activeFarmLabel}
      />
      <div className="max-w-7xl mx-auto space-y-8">
        <ValidationGate analysis={analysis} trial={trial || {}} plots={plots} />
        {/* SECTION 1: Experimental Design Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Experimental Design Summary</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">Design</span>
                <span className="text-slate-900">RCBD</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">Treatments</span>
                <span className="text-slate-900">2 (CA, CF)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">Replicates</span>
                <span className="text-slate-900">4</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">Total Units</span>
                <span className="text-slate-900">8</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">Plot Size</span>
                <span className="text-slate-900">100 m²</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">Test</span>
                <span className="text-slate-900">Independent t-test (two-tailed)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">α (Significance Level)</span>
                <span className="text-slate-900">0.05</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">df</span>
                <span className="text-slate-900">6</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">t-critical (two-tailed)</span>
                <span className="text-slate-900">2.447</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Descriptive Statistics */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm overflow-x-auto">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Descriptive Statistics</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Variable</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Treatment</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">n</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">Mean</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">SD</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">SE</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">95% CI Lower</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">95% CI Upper</th>
              </tr>
            </thead>
            <tbody>
              {/* Yield */}
              {stats.yield && (
                <>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-3 px-4 text-slate-900">Yield (kg/plot)</td>
                    <td className="py-3 px-4 text-slate-700">CA</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.yield.descCA?.n)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.descCA?.mean, 2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.descCA?.sd, 2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.descCA?.se, 2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.descCA?.ciLower, 2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.descCA?.ciUpper, 2)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-white">
                    <td className="py-3 px-4 text-slate-900">Yield (kg/plot)</td>
                    <td className="py-3 px-4 text-slate-700">CF</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.yield.descCF?.n)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.descCF?.mean, 2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.descCF?.sd, 2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.descCF?.se, 2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.descCF?.ciLower, 2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.descCF?.ciUpper, 2)}
                    </td>
                  </tr>
                </>
              )}

              {/* Gross Margin */}
              {stats.grossMargin && (
                <>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-3 px-4 text-slate-900">Gross Margin (RWF/plot)</td>
                    <td className="py-3 px-4 text-slate-700">CA</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.grossMargin.descCA?.n)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.descCA?.mean, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.descCA?.sd, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.descCA?.se, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.descCA?.ciLower, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.descCA?.ciUpper, 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-white">
                    <td className="py-3 px-4 text-slate-900">Gross Margin (RWF/plot)</td>
                    <td className="py-3 px-4 text-slate-700">CF</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.grossMargin.descCF?.n)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.descCF?.mean, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.descCF?.sd, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.descCF?.se, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.descCF?.ciLower, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.descCF?.ciUpper, 0)}
                    </td>
                  </tr>
                </>
              )}

              {/* C_SD Cost */}
              {stats.csd && (
                <>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-3 px-4 text-slate-900">C_SD Cost (RWF/plot)</td>
                    <td className="py-3 px-4 text-slate-700">CA</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.csd.descCA?.n)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.descCA?.mean, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.descCA?.sd, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.descCA?.se, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.descCA?.ciLower, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.descCA?.ciUpper, 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-white">
                    <td className="py-3 px-4 text-slate-900">C_SD Cost (RWF/plot)</td>
                    <td className="py-3 px-4 text-slate-700">CF</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.csd.descCF?.n)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.descCF?.mean, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.descCF?.sd, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.descCF?.se, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.descCF?.ciLower, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.descCF?.ciUpper, 0)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* SECTION 3: ANOVA Tables */}
        <div className="space-y-6">
          {/* Yield ANOVA */}
          {stats.yield?.anova && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm overflow-x-auto">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">ANOVA Table: Yield (kg/plot)</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Source of Variation</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">df</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">SS</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">MS</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">F-value</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">p-value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-3 px-4 text-slate-900">Treatment</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.yield.anova.treatmentDf)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.anova.treatmentSS, 2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.anova.treatmentMS, 2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.anova.fValue, 3)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatPValue(stats.yield.anova.pValue)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-white">
                    <td className="py-3 px-4 text-slate-900">Residual (Error)</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.yield.anova.errorDf)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.anova.errorSS, 2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.anova.errorMS, 2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                  </tr>
                  <tr className="bg-slate-50 font-medium">
                    <td className="py-3 px-4 text-slate-900">Total</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.yield.anova.totalDf)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.yield.anova.totalSS, 2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Gross Margin ANOVA */}
          {stats.grossMargin?.anova && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm overflow-x-auto">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">
                ANOVA Table: Gross Margin (RWF/plot)
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Source of Variation</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">df</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">SS</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">MS</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">F-value</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">p-value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-3 px-4 text-slate-900">Treatment</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.grossMargin.anova.treatmentDf)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.anova.treatmentSS, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.anova.treatmentMS, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.anova.fValue, 3)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatPValue(stats.grossMargin.anova.pValue)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-white">
                    <td className="py-3 px-4 text-slate-900">Residual (Error)</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.grossMargin.anova.errorDf)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.anova.errorSS, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.anova.errorMS, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                  </tr>
                  <tr className="bg-slate-50 font-medium">
                    <td className="py-3 px-4 text-slate-900">Total</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.grossMargin.anova.totalDf)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.grossMargin.anova.totalSS, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* C_SD Cost ANOVA */}
          {stats.csd?.anova && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm overflow-x-auto">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">ANOVA Table: C_SD Cost (RWF/plot)</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Source of Variation</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">df</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">SS</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">MS</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">F-value</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">p-value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-3 px-4 text-slate-900">Treatment</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.csd.anova.treatmentDf)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.anova.treatmentSS, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.anova.treatmentMS, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.anova.fValue, 3)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatPValue(stats.csd.anova.pValue)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-white">
                    <td className="py-3 px-4 text-slate-900">Residual (Error)</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.csd.anova.errorDf)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.anova.errorSS, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.anova.errorMS, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                  </tr>
                  <tr className="bg-slate-50 font-medium">
                    <td className="py-3 px-4 text-slate-900">Total</td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {safeNumber(stats.csd.anova.totalDf)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">
                      {formatNumber(stats.csd.anova.totalSS, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                    <td className="py-3 px-4 text-center text-slate-900">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 4: t-Test Results */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm overflow-x-auto">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">t-Test Results Summary</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Variable</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">CA Mean±SD</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">CF Mean±SD</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">Mean Diff</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">t-statistic</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">df</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">p-value</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">95% CI</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">Decision</th>
              </tr>
            </thead>
            <tbody>
              {stats.yield?.tTest && (
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="py-3 px-4 text-slate-900">Yield (kg/plot)</td>
                  <td className="py-3 px-4 text-slate-900">
                    {formatNumber(stats.yield.descCA?.mean, 2)} ± {formatNumber(stats.yield.descCA?.sd, 2)}
                  </td>
                  <td className="py-3 px-4 text-slate-900">
                    {formatNumber(stats.yield.descCF?.mean, 2)} ± {formatNumber(stats.yield.descCF?.sd, 2)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(stats.yield.tTest.meanDiff, 2)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(stats.yield.tTest.tStatistic, 3)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {safeNumber(stats.yield.tTest.df)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatPValue(stats.yield.tTest.pValue)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    [{formatNumber(stats.yield.tTest.ciLower, 2)}, {formatNumber(stats.yield.tTest.ciUpper, 2)}]
                  </td>
                  <td className="py-3 px-4 text-center">
                    {significanceBadge(stats.yield.tTest.pValue)}
                  </td>
                </tr>
              )}
              {stats.grossMargin?.tTest && (
                <tr className="border-b border-slate-200 bg-white">
                  <td className="py-3 px-4 text-slate-900">Gross Margin (RWF/plot)</td>
                  <td className="py-3 px-4 text-slate-900">
                    {formatNumber(stats.grossMargin.descCA?.mean, 0)} ± {formatNumber(stats.grossMargin.descCA?.sd, 0)}
                  </td>
                  <td className="py-3 px-4 text-slate-900">
                    {formatNumber(stats.grossMargin.descCF?.mean, 0)} ± {formatNumber(stats.grossMargin.descCF?.sd, 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(stats.grossMargin.tTest.meanDiff, 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(stats.grossMargin.tTest.tStatistic, 3)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {safeNumber(stats.grossMargin.tTest.df)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatPValue(stats.grossMargin.tTest.pValue)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    [{formatNumber(stats.grossMargin.tTest.ciLower, 0)}, {formatNumber(stats.grossMargin.tTest.ciUpper, 0)}]
                  </td>
                  <td className="py-3 px-4 text-center">
                    {significanceBadge(stats.grossMargin.tTest.pValue)}
                  </td>
                </tr>
              )}
              {stats.csd?.tTest && (
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="py-3 px-4 text-slate-900">C_SD Cost (RWF/plot)</td>
                  <td className="py-3 px-4 text-slate-900">
                    {formatNumber(stats.csd.descCA?.mean, 0)} ± {formatNumber(stats.csd.descCA?.sd, 0)}
                  </td>
                  <td className="py-3 px-4 text-slate-900">
                    {formatNumber(stats.csd.descCF?.mean, 0)} ± {formatNumber(stats.csd.descCF?.sd, 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(stats.csd.tTest.meanDiff, 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(stats.csd.tTest.tStatistic, 3)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {safeNumber(stats.csd.tTest.df)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatPValue(stats.csd.tTest.pValue)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    [{formatNumber(stats.csd.tTest.ciLower, 0)}, {formatNumber(stats.csd.tTest.ciUpper, 0)}]
                  </td>
                  <td className="py-3 px-4 text-center">
                    {significanceBadge(stats.csd.tTest.pValue)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SECTION 5: RCBD ANOVA */}
        {rcbd && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm overflow-x-auto">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">RCBD ANOVA Table</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Source</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">df</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">SS</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">MS</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">F-value</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">p-value</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Significance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="py-3 px-4 text-slate-900">Treatment</td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {safeNumber(rcbd.treatmentDf)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.treatmentSS, 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.treatmentMS, 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.fValue, 3)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatPValue(rcbd.pValue)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {significanceBadge(rcbd.pValue)}
                  </td>
                </tr>
                <tr className="border-b border-slate-200 bg-white">
                  <td className="py-3 px-4 text-slate-900">Block</td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {safeNumber(rcbd.blockDf)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.blockSS, 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.blockMS, 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">—</td>
                  <td className="py-3 px-4 text-center text-slate-900">—</td>
                  <td className="py-3 px-4 text-center text-slate-900">—</td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="py-3 px-4 text-slate-900">Error</td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {safeNumber(rcbd.errorDf)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.errorSS, 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.errorMS, 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">—</td>
                  <td className="py-3 px-4 text-center text-slate-900">—</td>
                  <td className="py-3 px-4 text-center text-slate-900">—</td>
                </tr>
                <tr className="bg-slate-50 font-medium">
                  <td className="py-3 px-4 text-slate-900">Total</td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {safeNumber(rcbd.totalDf)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.totalSS, 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900">—</td>
                  <td className="py-3 px-4 text-center text-slate-900">—</td>
                  <td className="py-3 px-4 text-center text-slate-900">—</td>
                  <td className="py-3 px-4 text-center text-slate-900">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* SECTION 6: Model Components */}
        {rcbd && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm overflow-x-auto">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Model Components (RCBD)</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Component</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Estimate</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="py-3 px-4 text-slate-900">μ̂ (Grand Mean)</td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.grandMean, 0)}
                  </td>
                  <td className="py-3 px-4 text-slate-700">Overall average response across all units</td>
                </tr>
                <tr className="border-b border-slate-200 bg-white">
                  <td className="py-3 px-4 text-slate-900">T̂₁ (CA Effect)</td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.treatmentEffectCA, 2)}
                  </td>
                  <td className="py-3 px-4 text-slate-700">Deviation of CA treatment from grand mean</td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="py-3 px-4 text-slate-900">T̂₂ (CF Effect)</td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.treatmentEffectCF, 2)}
                  </td>
                  <td className="py-3 px-4 text-slate-700">Deviation of CF treatment from grand mean</td>
                </tr>
                <tr className="border-b border-slate-200 bg-white">
                  <td className="py-3 px-4 text-slate-900">B̂₁ (Block 1 Effect)</td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.blockEffects?.[0], 2)}
                  </td>
                  <td className="py-3 px-4 text-slate-700">Deviation of block 1 from grand mean</td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="py-3 px-4 text-slate-900">B̂₂ (Block 2 Effect)</td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.blockEffects?.[1], 2)}
                  </td>
                  <td className="py-3 px-4 text-slate-700">Deviation of block 2 from grand mean</td>
                </tr>
                <tr className="border-b border-slate-200 bg-white">
                  <td className="py-3 px-4 text-slate-900">B̂₃ (Block 3 Effect)</td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.blockEffects?.[2], 2)}
                  </td>
                  <td className="py-3 px-4 text-slate-700">Deviation of block 3 from grand mean</td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="py-3 px-4 text-slate-900">B̂₄ (Block 4 Effect)</td>
                  <td className="py-3 px-4 text-center text-slate-900">
                    {formatNumber(rcbd.blockEffects?.[3], 2)}
                  </td>
                  <td className="py-3 px-4 text-slate-700">Deviation of block 4 from grand mean</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* SECTION 7: Scientific Interpretation */}
        {interpretations.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Scientific Interpretation</h2>
            <div className="space-y-6">
              {interpretations.map((interp, idx) => (
                <div key={idx} className="border-l-4 border-slate-300 pl-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{interp.hypothesis}</h3>
                  <p className="text-slate-700 leading-relaxed">{interp.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
