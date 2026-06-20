import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ScreenTopbar } from "../../components/shared/ScreenTopbar";
import { useAnalysis } from "../../hooks/useAnalysis";

function fmtRWF(value) {
  const num = Number(value ?? 0);
  return `${Math.round(num).toLocaleString()} RWF`;
}

function fmtKg(value) {
  const num = Number(value ?? 0);
  return `${num.toFixed(2)} kg`;
}

function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function consistencyLabel(value) {
  if (value === "CA") return "CA is more consistent";
  if (value === "CF") return "CF is more consistent";
  return "Both systems have equal variability";
}

export function Trends() {
  const { trialId } = useParams();
  const { analysis, loading, error, refresh } = useAnalysis(trialId);
  const activeFarmLabel = analysis?.trialName ?? trialId;
  const topbarStatus = loading ? "Loading…" : error ? "Error loading data" : "Ready";
  const topbarTone = loading ? "offline" : error ? "error" : "synced";
  const topbarMeta = analysis?.season ? `${analysis.season} · Trend analysis` : `Trial ${trialId ?? "unknown"}`;

  const plots = useMemo(() => {
    if (!analysis?.plots?.length) return [];
    return [...analysis.plots]
      .map((plot) => ({
        replicate: plot.replicate,
        treatment: String(plot.treatment || "").toUpperCase(),
        yieldKg: safeNumber(plot.yieldKg),
        netBenefit: safeNumber(plot.netBenefit),
        tpc: safeNumber(plot.tpc),
        labourTimeMin: safeNumber(plot.labourTimeMin),
      }))
      .sort((a, b) => {
        if (a.replicate !== b.replicate) return a.replicate - b.replicate;
        return a.treatment.localeCompare(b.treatment);
      });
  }, [analysis]);

  const replicateRows = useMemo(() => {
    const rows = [1, 2, 3, 4].map((replicate) => ({
      replicate,
      ca: null,
      cf: null,
    }));

    plots.forEach((plot) => {
      const row = rows.find((item) => item.replicate === plot.replicate);
      if (!row) return;
      if (plot.treatment === "CA") {
        row.ca = plot;
      } else if (plot.treatment === "CF") {
        row.cf = plot;
      }
    });

    return rows;
  }, [plots]);

  const chartData = useMemo(() => {
    return replicateRows.map((row) => ({
      replicate: `R${row.replicate}`,
      CA: row.ca?.yieldKg ?? 0,
      CF: row.cf?.yieldKg ?? 0,
    }));
  }, [replicateRows]);

  const netBenefitChartData = useMemo(() => {
    return replicateRows.map((row) => ({
      replicate: `R${row.replicate}`,
      CA: row.ca?.netBenefit ?? 0,
      CF: row.cf?.netBenefit ?? 0,
    }));
  }, [replicateRows]);

  const costChartData = useMemo(() => {
    return replicateRows.map((row) => ({
      replicate: `R${row.replicate}`,
      CA: row.ca?.tpc ?? 0,
      CF: row.cf?.tpc ?? 0,
    }));
  }, [replicateRows]);

  const labourChartData = useMemo(() => {
    return replicateRows.map((row) => ({
      replicate: `R${row.replicate}`,
      CA: row.ca?.labourTimeMin ?? 0,
      CF: row.cf?.labourTimeMin ?? 0,
    }));
  }, [replicateRows]);

  const consistency = useMemo(() => {
    const calcRange = (values) => {
      if (!values.length) return 0;
      return Math.max(...values) - Math.min(...values);
    };

    const caYield = plots.filter((plot) => plot.treatment === "CA").map((plot) => plot.yieldKg);
    const cfYield = plots.filter((plot) => plot.treatment === "CF").map((plot) => plot.yieldKg);
    const caCost = plots.filter((plot) => plot.treatment === "CA").map((plot) => plot.tpc);
    const cfCost = plots.filter((plot) => plot.treatment === "CF").map((plot) => plot.tpc);
    const caNet = plots.filter((plot) => plot.treatment === "CA").map((plot) => plot.netBenefit);
    const cfNet = plots.filter((plot) => plot.treatment === "CF").map((plot) => plot.netBenefit);

    const yieldRangeCA = calcRange(caYield);
    const yieldRangeCF = calcRange(cfYield);
    const costRangeCA = calcRange(caCost);
    const costRangeCF = calcRange(cfCost);
    const netRangeCA = calcRange(caNet);
    const netRangeCF = calcRange(cfNet);

    return {
      yield: yieldRangeCA < yieldRangeCF ? "CA" : yieldRangeCF < yieldRangeCA ? "CF" : "Tie",
      cost: costRangeCA < costRangeCF ? "CA" : costRangeCF < costRangeCA ? "CF" : "Tie",
      netBenefit: netRangeCA < netRangeCF ? "CA" : netRangeCF < netRangeCA ? "CF" : "Tie",
    };
  }, [plots]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Analysis"
          title="Trend analysis"
          meta={topbarMeta}
          status={topbarStatus}
          statusTone={topbarTone}
          activeFarmLabel={activeFarmLabel}
        />
        <div className="flex items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4" />
            <p className="text-slate-600">Loading trend analysis…</p>
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
          title="Trend analysis"
          meta={topbarMeta}
          status={topbarStatus}
          statusTone={topbarTone}
          activeFarmLabel={activeFarmLabel}
        />
        <div className="rounded-3xl border border-red-200 bg-white p-12 shadow-sm">
          <h1 className="text-2xl font-semibold text-red-900">Error loading trends</h1>
          <p className="mt-3 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!analysis || !plots.length) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Analysis"
          title="Trend analysis"
          meta={topbarMeta}
          status="No plot data"
          statusTone="offline"
          activeFarmLabel={activeFarmLabel}
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-slate-900">No trend data available</h1>
          <p className="mt-3 text-slate-600">Trend charts will appear once plot-level analysis is available for this trial.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText="Analysis"
        title="Trend analysis"
        meta={topbarMeta}
        status={topbarStatus}
        statusTone={topbarTone}
        activeFarmLabel={activeFarmLabel}
      />
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Trend analysis</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Per-Replicate Patterns</h1>
            <p className="mt-2 text-slate-600">Plot-level performance across CA and CF replicates.</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Yield by Replicate</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="replicate" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmtKg(value)} />
                  <Legend />
                  <Bar dataKey="CA" fill="#2D5016" name="CA Yield" />
                  <Bar dataKey="CF" fill="#4A90D9" name="CF Yield" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Net Benefit by Replicate</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={netBenefitChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="replicate" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmtRWF(value)} />
                  <Legend />
                  <Bar dataKey="CA" fill="#2D5016" name="CA Net Benefit" />
                  <Bar dataKey="CF" fill="#4A90D9" name="CF Net Benefit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Total Production Cost by Replicate</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="replicate" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmtRWF(value)} />
                  <Legend />
                  <Bar dataKey="CA" fill="#2D5016" name="CA Cost" />
                  <Bar dataKey="CF" fill="#4A90D9" name="CF Cost" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Labour Time by Replicate</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={labourChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="replicate" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Math.round(value)} min`} />
                  <Legend />
                  <Bar dataKey="CA" fill="#2D5016" name="CA Labour" />
                  <Bar dataKey="CF" fill="#4A90D9" name="CF Labour" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Replicate Data Table</h2>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Replicate</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">CA Yield</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">CF Yield</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">CA Cost</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">CF Cost</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">CA Net Benefit</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">CF Net Benefit</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">CA Labour (min)</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">CF Labour (min)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {replicateRows.map((row) => (
                <tr key={row.replicate}>
                  <td className="px-4 py-3 text-slate-900">R{row.replicate}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{fmtKg(row.ca?.yieldKg ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{fmtKg(row.cf?.yieldKg ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{fmtRWF(row.ca?.tpc ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{fmtRWF(row.cf?.tpc ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{fmtRWF(row.ca?.netBenefit ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{fmtRWF(row.cf?.netBenefit ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{Math.round(row.ca?.labourTimeMin ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{Math.round(row.cf?.labourTimeMin ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Trend Interpretation</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800 mb-2">Yield Consistency</p>
              <p className="text-slate-700">{consistencyLabel(consistency.yield)} based on range analysis across replicates.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800 mb-2">Cost Consistency</p>
              <p className="text-slate-700">{consistencyLabel(consistency.cost)} based on replicate cost variability.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800 mb-2">Net Benefit Consistency</p>
              <p className="text-slate-700">{consistencyLabel(consistency.netBenefit)} based on variability in net benefit across replicates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
