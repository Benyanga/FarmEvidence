import { useEffect, useMemo, useState } from "react";
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
  ReferenceLine,
} from "recharts";
import { ScreenTopbar } from "../../components/shared/ScreenTopbar";
import { getTrajectory, getSeasonCnb } from "../../api";

function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function fmtRWF(value) {
  const num = safeNumber(value);
  return `${Math.round(num).toLocaleString()} RWF`;
}

function formatSeasonLabel(seasonIndex) {
  return `S${seasonIndex}`;
}

export default function Trajectory() {
  const { trialId } = useParams();
  const [trajectory, setTrajectory] = useState([]);
  const [cnbSummary, setCnbSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!trialId) return;
    setLoading(true);
    setError(null);

    Promise.all([getTrajectory(trialId), getSeasonCnb(trialId)])
      .then(([trajectoryRes, cnbRes]) => {
        setTrajectory(trajectoryRes?.data ?? []);
        setCnbSummary(cnbRes?.data ?? null);
      })
      .catch((err) => {
        setError(err?.message ?? "Unable to load trajectory data");
      })
      .finally(() => setLoading(false));
  }, [trialId]);

  const records = trajectory ?? [];

  const seasonRows = useMemo(() => {
    const grouped = new Map();

    records.forEach((record) => {
      const seasonIndex = Number(record?.seasonIndex ?? 0);
      const row = grouped.get(seasonIndex) || {
        seasonIndex,
        phase: record?.phase || "",
        csi: record?.csi ?? null,
        ca: null,
        cf: null,
      };

      if (record?.treatment === "CA") {
        row.ca = record;
      } else if (record?.treatment === "CF") {
        row.cf = record;
      }

      grouped.set(seasonIndex, row);
    });

    return Array.from(grouped.values()).sort((a, b) => a.seasonIndex - b.seasonIndex);
  }, [records]);

  const profitChartData = useMemo(
    () =>
      seasonRows.map((row) => ({
        season: formatSeasonLabel(row.seasonIndex),
        CA: safeNumber(row.ca?.profit),
        CF: safeNumber(row.cf?.profit),
      })),
    [seasonRows],
  );

  const cnbChartData = useMemo(
    () =>
      seasonRows.map((row) => ({
        season: formatSeasonLabel(row.seasonIndex),
        CA: safeNumber(row.ca?.cnbCumulative),
        CF: safeNumber(row.cf?.cnbCumulative),
      })),
    [seasonRows],
  );

  const latestRow = seasonRows[seasonRows.length - 1] || null;
  const currentSeason = cnbSummary?.currentSeason ?? seasonRows.length;
  const ttpSeason = cnbSummary?.ttp ?? null;
  const currentPhase = latestRow?.phase || "Unknown";
  const currentCsi = latestRow?.csi ?? null;
  const topbarStatus = loading ? "Loading…" : error ? "Error loading trajectory" : "Ready";
  const topbarTone = loading ? "offline" : error ? "error" : "synced";
  const topbarMeta = `Trial ${trialId ?? "unknown"} · Trajectory`;
  const activeFarmLabel = trialId;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Analysis"
          title="Trajectory"
          meta={topbarMeta}
          status={topbarStatus}
          statusTone={topbarTone}
          activeFarmLabel={activeFarmLabel}
        />
        <div className="flex items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4" />
            <p className="text-slate-600">Loading seasonal trajectory…</p>
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
          title="Trajectory"
          meta={topbarMeta}
          status={topbarStatus}
          statusTone={topbarTone}
          activeFarmLabel={activeFarmLabel}
        />
        <div className="rounded-3xl border border-red-200 bg-white p-12 shadow-sm">
          <h1 className="text-2xl font-semibold text-red-900">Unable to load trajectory data</h1>
          <p className="mt-3 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Analysis"
          title="Trajectory"
          meta={topbarMeta}
          status="No season records"
          statusTone="offline"
          activeFarmLabel={activeFarmLabel}
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-slate-900">No season trajectory data available</h1>
          <p className="mt-3 text-slate-600">Seasonal trajectory charts will appear once closed season records exist for this trial.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText="Analysis"
        title="Trajectory"
        meta={topbarMeta}
        status={topbarStatus}
        statusTone={topbarTone}
        activeFarmLabel={activeFarmLabel}
      />
      <div className="max-w-7xl mx-auto space-y-8">
        <ValidationGate analysis={analysis} trial={trial || {}} plots={plots} />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Trajectory analysis</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Seasonal performance trajectory</h1>
            <p className="mt-2 text-slate-600 max-w-2xl">
              Track profit, cumulative net benefit, and phase progress across closed seasons for CA and CF.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Current season</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{currentSeason}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Active phase</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{currentPhase}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">CSI</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{currentCsi != null ? currentCsi.toFixed(2) : "—"}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Profit trajectory</h2>
                <p className="mt-2 text-sm text-slate-600">Seasonal profit comparison for CA and CF.</p>
              </div>
              <div className="text-sm text-slate-500">Unit: RWF</div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="season" />
                  <YAxis tickFormatter={(value) => `${Math.round(value).toLocaleString()}`} />
                  <Tooltip formatter={(value) => fmtRWF(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="CA" stroke="#2D5016" strokeWidth={3} dot />
                  <Line type="monotone" dataKey="CF" stroke="#4A90D9" strokeWidth={3} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Cumulative net benefit</h2>
                <p className="mt-2 text-sm text-slate-600">Cumulative return path with time-to-payback marker.</p>
              </div>
              <div className="text-sm text-slate-500">Unit: RWF</div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cnbChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="season" />
                  <YAxis tickFormatter={(value) => `${Math.round(value).toLocaleString()}`} />
                  <Tooltip formatter={(value) => fmtRWF(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="CA" stroke="#047857" strokeWidth={3} dot />
                  <Line type="monotone" dataKey="CF" stroke="#2563EB" strokeWidth={3} dot />
                  {ttpSeason ? (
                    <ReferenceLine x={formatSeasonLabel(ttpSeason)} stroke="#D97706" strokeDasharray="4 4" label={{ position: "top", value: "TTP" }} />
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Season trajectory table</h2>
              <p className="mt-2 text-sm text-slate-600">Detailed season-level performance for closed trial records.</p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">
              Time-to-payback: {ttpSeason ? `Season ${ttpSeason}` : "Not reached yet"}
            </div>
          </div>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Season</th>
                <th className="px-4 py-3 text-left font-semibold">Phase</th>
                <th className="px-4 py-3 text-left font-semibold">CSI</th>
                <th className="px-4 py-3 text-right font-semibold">CA Profit</th>
                <th className="px-4 py-3 text-right font-semibold">CF Profit</th>
                <th className="px-4 py-3 text-right font-semibold">CA CNB</th>
                <th className="px-4 py-3 text-right font-semibold">CF CNB</th>
                <th className="px-4 py-3 text-center font-semibold">TTP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {seasonRows.map((row) => (
                <tr key={row.seasonIndex}>
                  <td className="px-4 py-4 text-slate-900">{formatSeasonLabel(row.seasonIndex)}</td>
                  <td className="px-4 py-4 text-slate-700">{row.phase || "—"}</td>
                  <td className="px-4 py-4 text-slate-700">{row.csi != null ? row.csi.toFixed(2) : "—"}</td>
                  <td className="px-4 py-4 text-right text-slate-900">{fmtRWF(row.ca?.profit)}</td>
                  <td className="px-4 py-4 text-right text-slate-900">{fmtRWF(row.cf?.profit)}</td>
                  <td className="px-4 py-4 text-right text-slate-900">{fmtRWF(row.ca?.cnbCumulative)}</td>
                  <td className="px-4 py-4 text-right text-slate-900">{fmtRWF(row.cf?.cnbCumulative)}</td>
                  <td className="px-4 py-4 text-center text-slate-700">{row.ca?.ttpReachedThisSeason || row.cf?.ttpReachedThisSeason ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
