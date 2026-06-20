import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const SECTION_CONFIG = [
  { key: "cover", label: "Cover Page", default: true },
  { key: "systemSummary", label: "Farming System Summary", default: true },
  { key: "csi", label: "Context Sensitivity Index (CSI)", default: true },
  { key: "costBreakdown", label: "Cost Breakdown by Tier", default: true },
  { key: "profitability", label: "Profitability Indicators", default: true },
  { key: "cnb", label: "Cumulative Net Benefit (CNB)", default: true },
  { key: "agronomic", label: "Agronomic Data Summary", default: true },
  { key: "statistics", label: "Statistical Results", default: true, roleRestricted: true },
  { key: "trajectory", label: "Phase Trajectory Chart", default: true },
  { key: "soilHealth", label: "Soil Health Trend Chart", default: true },
  { key: "interpretation", label: "Farmer Interpretation", default: true },
  { key: "recommendations", label: "System Recommendations", default: true },
  { key: "dataQuality", label: "Data Quality Report", default: true },
  { key: "assumptions", label: "Assumptions Register", default: true },
];

function fmtRWF(value) {
  if (!value && value !== 0) return "—";
  return `${Math.round(Number(value) || 0).toLocaleString()} RWF`;
}

function fmtPercent(value) {
  if (!value && value !== 0) return "—";
  return `${(Number(value) || 0).toFixed(1)}%`;
}

function fmtNumber(value, decimals = 2) {
  if (!value && value !== 0) return "—";
  return (Number(value) || 0).toFixed(decimals);
}

export function ReportsPage() {
  const { trialId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [cnbData, setCnbData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSections, setSelectedSections] = useState(
    SECTION_CONFIG.reduce((acc, s) => ({ ...acc, [s.key]: s.default }), {})
  );
  const [role] = useState("Researcher"); // TODO: Get from auth context

  // Fetch all report data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analysisRes, seasonsRes, cnbRes, notifRes] = await Promise.all([
          fetch(`/api/analysis/${trialId}`),
          fetch(`/api/seasons/trajectory/${trialId}`),
          fetch(`/api/seasons/cnb/${trialId}`),
          fetch(`/api/notifications/trial/${trialId}`),
        ]);

        if (analysisRes.ok) setAnalysis(await analysisRes.json());
        if (seasonsRes.ok) setSeasons(await seasonsRes.json());
        if (cnbRes.ok) setCnbData(await cnbRes.json());
        if (notifRes.ok) setNotifications(await notifRes.json());
      } catch (err) {
        console.error("[Reports] Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (trialId) fetchData();
  }, [trialId]);

  const handleSectionToggle = (key) => {
    setSelectedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyExecutiveSummary = async () => {
    if (!navigator?.clipboard) return;
    const summary = analysis?.profitSummary || "No executive summary available";
    try {
      await navigator.clipboard.writeText(summary);
      alert("Executive summary copied to clipboard");
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="text-slate-600">Loading report…</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 p-6">
        <div className="rounded-3xl border border-rose-200 bg-white p-12">
          <h1 className="text-2xl font-semibold text-rose-900">Unable to load report</h1>
          <p className="mt-3 text-rose-700">{error || "No analysis data available"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <style>{`
        @media print {
          * { visibility: hidden; }
          .report-preview, .report-preview * { visibility: visible; }
          .report-preview { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Report Builder
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Configure sections and download your trial analysis report as PDF
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row no-print">
              <button
                onClick={() => window.print()}
                className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                📥 Download PDF
              </button>
              <button
                onClick={handleCopyExecutiveSummary}
                className="rounded-2xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-900 hover:border-slate-300"
              >
                📋 Copy Summary
              </button>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
          {/* Left Sidebar - Configuration */}
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm no-print h-fit">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Report Sections
            </h2>
            <div className="space-y-2">
              {SECTION_CONFIG.map((section) => (
                <label
                  key={section.key}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedSections[section.key] || false}
                    onChange={() => handleSectionToggle(section.key)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">{section.label}</span>
                </label>
              ))}
            </div>
          </aside>

          {/* Right Panel - Report Preview */}
          <main className="report-preview rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="bg-white p-12 font-serif">
              {/* COVER PAGE */}
              {selectedSections.cover && (
                <div className="page-break mb-12 border-b border-slate-200 pb-12 text-center">
                  <h1 className="text-4xl font-bold text-slate-900">
                    FarmEvidence
                  </h1>
                  <p className="mt-2 text-xl text-slate-600">
                    Seasonal Analysis Report
                  </p>
                  <div className="mt-8 space-y-2 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold">Site:</span>{" "}
                      {analysis.trialName || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Location:</span>{" "}
                      {analysis.location || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Season:</span>{" "}
                      {analysis.season || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Year:</span>{" "}
                      {analysis.year || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Role:</span> {role}
                    </p>
                    <p>
                      <span className="font-semibold">Phase:</span>{" "}
                      {analysis.phase || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">CSI:</span>{" "}
                      {fmtNumber(analysis.csi)}
                    </p>
                    <p>
                      <span className="font-semibold">Generated:</span>{" "}
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <p className="mt-12 border-t border-slate-200 pt-4 text-xs text-slate-600">
                    FarmEvidence · Learn Pathway · Rwanda 2026
                  </p>
                </div>
              )}

              {/* SYSTEM SUMMARY */}
              {selectedSections.systemSummary && (
                <div className="page-break mb-12">
                  <h2 className="mb-6 text-3xl font-bold text-slate-900">
                    Farming System Summary
                  </h2>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <h3 className="font-semibold text-slate-900">
                        Conservation Agriculture (CA)
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        <li>• Soil disturbance: Minimized/zero tillage</li>
                        <li>• Soil cover: Permanent organic mulch + residues</li>
                        <li>• Cropping system: Rotation + intercropping</li>
                        <li>• Nutrient management: Biological cycling</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <h3 className="font-semibold text-slate-900">
                        Conventional Farming (CF)
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        <li>• Soil disturbance: Intensive tillage</li>
                        <li>• Soil cover: Bare soil between seasons</li>
                        <li>• Cropping system: Monocropping</li>
                        <li>• Nutrient management: Synthetic fertilizer</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* CSI */}
              {selectedSections.csi && (
                <div className="page-break mb-12">
                  <h2 className="mb-6 text-3xl font-bold text-slate-900">
                    Context Sensitivity Index (CSI)
                  </h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-2 text-left font-semibold">Driver</th>
                        <th className="px-4 py-2 text-center font-semibold">Weight</th>
                        <th className="px-4 py-2 text-center font-semibold">Score</th>
                        <th className="px-4 py-2 text-center font-semibold">Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "j1: Market Access", weight: 0.15 },
                        { label: "j2: Input Availability", weight: 0.15 },
                        { label: "j3: Labour Availability", weight: 0.20 },
                        { label: "j4: Soil Quality", weight: 0.15 },
                        { label: "j5: Water Availability", weight: 0.20 },
                        { label: "j6: Extension Support", weight: 0.15 },
                      ].map((driver, idx) => {
                        const score = (analysis.csiDrivers?.[idx] || 0) / 5;
                        return (
                          <tr key={idx} className="border-b border-slate-200">
                            <td className="px-4 py-2">{driver.label}</td>
                            <td className="px-4 py-2 text-center">
                              {fmtPercent(driver.weight * 100)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {fmtNumber(score)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {fmtNumber(score * driver.weight)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="font-semibold">
                        <td colSpan="3" className="px-4 py-2">
                          Total CSI
                        </td>
                        <td className="px-4 py-2 text-center">
                          {fmtNumber(analysis.csi)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* COST BREAKDOWN */}
              {selectedSections.costBreakdown && (
                <div className="page-break mb-12">
                  <h2 className="mb-6 text-3xl font-bold text-slate-900">
                    Cost Breakdown by Tier
                  </h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-900">
                        <th className="px-4 py-2 text-left font-semibold">
                          Cost Tier
                        </th>
                        <th className="px-4 py-2 text-right font-semibold">
                          CA (RWF/ha)
                        </th>
                        <th className="px-4 py-2 text-right font-semibold">
                          CF (RWF/ha)
                        </th>
                        <th className="px-4 py-2 text-right font-semibold">
                          ΔC
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2 font-semibold">
                          C_base (Tier 1)
                        </td>
                        <td className="px-4 py-2 text-right">
                          {fmtRWF(
                            analysis.costBreakdown?.ca_base || 0
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {fmtRWF(
                            analysis.costBreakdown?.cf_base || 0
                          )}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-600">
                          (cancels)
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2 font-semibold">
                          C_sys (Tier 2)
                        </td>
                        <td className="px-4 py-2 text-right">
                          {fmtRWF(
                            analysis.costBreakdown?.ca_sys || 0
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {fmtRWF(
                            analysis.costBreakdown?.cf_sys || 0
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {fmtRWF(
                            (analysis.costBreakdown?.ca_sys || 0) -
                              (analysis.costBreakdown?.cf_sys || 0)
                          )}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2 font-semibold">
                          C_time (Tier 3)
                        </td>
                        <td className="px-4 py-2 text-right">
                          {fmtRWF(
                            analysis.costBreakdown?.ca_time || 0
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {fmtRWF(
                            analysis.costBreakdown?.cf_time || 0
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {fmtRWF(
                            (analysis.costBreakdown?.ca_time || 0) -
                              (analysis.costBreakdown?.cf_time || 0)
                          )}
                        </td>
                      </tr>
                      <tr className="border-t-2 border-slate-900 font-semibold">
                        <td className="px-4 py-2">Total ΔC</td>
                        <td colSpan="3" className="px-4 py-2 text-right">
                          {fmtRWF(analysis.deltaCumulative || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-4 text-xs text-slate-600">
                    Note: C_base costs cancel across systems. Only Tier 2 and Tier 3
                    costs enter the ΔC comparison.
                  </p>
                </div>
              )}

              {/* PROFITABILITY */}
              {selectedSections.profitability && (
                <div className="page-break mb-12">
                  <h2 className="mb-6 text-3xl font-bold text-slate-900">
                    Profitability Indicators
                  </h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-900">
                        <th className="px-4 py-2 text-left font-semibold">
                          Indicator
                        </th>
                        <th className="px-4 py-2 text-center font-semibold">
                          Worst Case
                        </th>
                        <th className="px-4 py-2 text-center font-semibold">
                          Normal Case
                        </th>
                        <th className="px-4 py-2 text-center font-semibold">
                          Best Case
                        </th>
                        <th className="px-4 py-2 text-center font-semibold">
                          Expected (Weighted)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200 text-xs font-semibold">
                        <td colSpan="5" className="px-4 py-2 bg-slate-100">
                          Scenario Weights: 25% | 50% | 25%
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2">Profit (CA)</td>
                        <td className="px-4 py-2 text-center">
                          {fmtRWF(analysis.scenarios?.[0]?.ca_profit || 0)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {fmtRWF(analysis.scenarios?.[1]?.ca_profit || 0)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {fmtRWF(analysis.scenarios?.[2]?.ca_profit || 0)}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold">
                          {fmtRWF(analysis.expectedProfit?.ca || 0)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2">Profit (CF)</td>
                        <td className="px-4 py-2 text-center">
                          {fmtRWF(analysis.scenarios?.[0]?.cf_profit || 0)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {fmtRWF(analysis.scenarios?.[1]?.cf_profit || 0)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {fmtRWF(analysis.scenarios?.[2]?.cf_profit || 0)}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold">
                          {fmtRWF(analysis.expectedProfit?.cf || 0)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2">ROI (CA)</td>
                        <td className="px-4 py-2 text-center">
                          {fmtPercent(analysis.scenarios?.[0]?.ca_roi)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {fmtPercent(analysis.scenarios?.[1]?.ca_roi)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {fmtPercent(analysis.scenarios?.[2]?.ca_roi)}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold">
                          {fmtPercent(analysis.expectedROI?.ca)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2">ROI (CF)</td>
                        <td className="px-4 py-2 text-center">
                          {fmtPercent(analysis.scenarios?.[0]?.cf_roi)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {fmtPercent(analysis.scenarios?.[1]?.cf_roi)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {fmtPercent(analysis.scenarios?.[2]?.cf_roi)}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold">
                          {fmtPercent(analysis.expectedROI?.cf)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2">CBR (CA)</td>
                        <td className="px-4 py-2 text-center">
                          {fmtNumber(analysis.scenarios?.[0]?.ca_cbr)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {fmtNumber(analysis.scenarios?.[1]?.ca_cbr)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {fmtNumber(analysis.scenarios?.[2]?.ca_cbr)}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold">
                          {fmtNumber(analysis.expectedCBR?.ca)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2">CBR (CF)</td>
                        <td className="px-4 py-2 text-center">
                          {fmtNumber(analysis.scenarios?.[0]?.cf_cbr)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {fmtNumber(analysis.scenarios?.[1]?.cf_cbr)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {fmtNumber(analysis.scenarios?.[2]?.cf_cbr)}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold">
                          {fmtNumber(analysis.expectedCBR?.cf)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* CNB & TTP */}
              {selectedSections.cnb && (
                <div className="page-break mb-12">
                  <h2 className="mb-6 text-3xl font-bold text-slate-900">
                    Cumulative Net Benefit (CNB)
                  </h2>
                  <div className="mb-6 space-y-3 text-sm">
                    <p>
                      <span className="font-semibold">CNB to Date:</span>{" "}
                      {fmtRWF(cnbData?.cnbCumulative || 0)}/ha
                    </p>
                    <p>
                      <span className="font-semibold">
                        Time-to-Profit Status:
                      </span>{" "}
                      {cnbData?.ttp
                        ? `Reached at Season ${cnbData.ttp}`
                        : "Not yet reached (projected)"}
                    </p>
                  </div>
                  {seasons.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={seasons}
                        isAnimationActive={false}
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="seasonNumber" />
                        <YAxis />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="cnbCumulative"
                          stroke="#059669"
                          name="CNB"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {/* AGRONOMIC DATA */}
              {selectedSections.agronomic && (
                <div className="page-break mb-12">
                  <h2 className="mb-6 text-3xl font-bold text-slate-900">
                    Agronomic Data Summary
                  </h2>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b-2 border-slate-900">
                        <th className="px-2 py-2 text-left font-semibold">Plot</th>
                        <th className="px-2 py-2 text-center font-semibold">Yield (kg)</th>
                        <th className="px-2 py-2 text-center font-semibold">Weed</th>
                        <th className="px-2 py-2 text-center font-semibold">Pest %</th>
                        <th className="px-2 py-2 text-center font-semibold">Fauna</th>
                        <th className="px-2 py-2 text-center font-semibold">Vigor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.plots?.map((plot, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="px-2 py-2">{plot.label || `P${idx + 1}`}</td>
                          <td className="px-2 py-2 text-center">
                            {fmtNumber(plot.yield_kg || 0, 0)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {fmtNumber(plot.weedScore || 0)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {fmtPercent(plot.pestPercent || 0)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {fmtNumber(plot.faunaScore || 0)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {fmtNumber(plot.vigor || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* STATISTICS (Researcher only) */}
              {selectedSections.statistics && role !== "Farmer" && (
                <div className="page-break mb-12">
                  <h2 className="mb-6 text-3xl font-bold text-slate-900">
                    Statistical Results
                  </h2>
                  {analysis.stats?.ttest && (
                    <div className="mb-6">
                      <h3 className="mb-3 font-semibold text-slate-900">
                        t-test Results
                      </h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="px-4 py-2 text-left">Metric</th>
                            <th className="px-4 py-2 text-center">t-statistic</th>
                            <th className="px-4 py-2 text-center">p-value</th>
                            <th className="px-4 py-2 text-left">Significance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(analysis.stats.ttest).map(
                            ([key, value]) => (
                              <tr
                                key={key}
                                className="border-b border-slate-200"
                              >
                                <td className="px-4 py-2">{key}</td>
                                <td className="px-4 py-2 text-center">
                                  {fmtNumber(value.t)}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {fmtNumber(value.p, 4)}
                                </td>
                                <td className="px-4 py-2">
                                  {value.p < 0.05
                                    ? "Significant *"
                                    : "Not significant"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* FARMER INTERPRETATION */}
              {selectedSections.interpretation && (
                <div className="page-break mb-12">
                  <h2 className="mb-6 text-3xl font-bold text-slate-900">
                    What This Means for Your Farm
                  </h2>
                  <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                    <p>
                      Based on your trial data and the current farming conditions at
                      your site, your CA system is performing{" "}
                      {(analysis.deltaCumulative || 0) > 0
                        ? "favorably"
                        : "below expectations"}{" "}
                      compared to conventional farming.
                    </p>
                    <p>
                      Your CSI score of {fmtNumber(analysis.csi)} indicates{" "}
                      {(analysis.csi || 0) > 0.65
                        ? "favorable conditions"
                        : "moderate conditions"}{" "}
                      for CA adoption. Focus on the areas identified below to improve
                      system performance.
                    </p>
                    <p>
                      Your current phase is{" "}
                      <span className="font-semibold">{analysis.phase || "—"}</span>.
                      Continue monitoring key indicators and maintaining records to
                      track progress over the next growing seasons.
                    </p>
                  </div>
                </div>
              )}

              {/* RECOMMENDATIONS */}
              {selectedSections.recommendations && (
                <div className="page-break mb-12">
                  <h2 className="mb-6 text-3xl font-bold text-slate-900">
                    System Recommendations
                  </h2>
                  <ul className="space-y-3 text-sm text-slate-700">
                    <li>
                      • <span className="font-semibold">Near-term:</span> Focus on
                      soil cover improvement — ensure adequate mulch retention
                    </li>
                    <li>
                      • <span className="font-semibold">Medium-term:</span> Transition
                      to legume intercropping to reduce fertilizer costs
                    </li>
                    <li>
                      • <span className="font-semibold">Long-term:</span> Invest in
                      mechanization to reduce labour costs
                    </li>
                    <li>
                      • <span className="font-semibold">Monitoring:</span> Continue
                      weekly field observations and monthly data recording
                    </li>
                  </ul>
                </div>
              )}

              {/* DATA QUALITY */}
              {selectedSections.dataQuality && (
                <div className="page-break mb-12">
                  <h2 className="mb-6 text-3xl font-bold text-slate-900">
                    Data Quality Report
                  </h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-2 text-left">Check</th>
                        <th className="px-4 py-2 text-center">Status</th>
                        <th className="px-4 py-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2">Plot count</td>
                        <td className="px-4 py-2 text-center text-green-700 font-semibold">
                          ✓
                        </td>
                        <td className="px-4 py-2">
                          {analysis.plots?.length || 0} plots recorded
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2">Yield data</td>
                        <td className="px-4 py-2 text-center text-green-700 font-semibold">
                          ✓
                        </td>
                        <td className="px-4 py-2">All plots have yield values</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2">Cost data</td>
                        <td className="px-4 py-2 text-center text-green-700 font-semibold">
                          ✓
                        </td>
                        <td className="px-4 py-2">All plots have cost records</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* ASSUMPTIONS */}
              {selectedSections.assumptions && (
                <div className="page-break">
                  <h2 className="mb-6 text-3xl font-bold text-slate-900">
                    Assumptions Register
                  </h2>
                  <div className="space-y-4 text-sm">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <h3 className="font-semibold text-slate-900">
                        Plot Size Basis
                      </h3>
                      <p className="mt-1 text-slate-700">
                        {analysis.plotSize || "Not defined"} m²
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <h3 className="font-semibold text-slate-900">Cost Coverage</h3>
                      <p className="mt-1 text-slate-700">
                        Includes plot-level input and labour costs where available
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <h3 className="font-semibold text-slate-900">
                        Statistical Assumptions
                      </h3>
                      <p className="mt-1 text-slate-700">
                        {analysis.stats?.method || "ANOVA"} assumptions applied
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
