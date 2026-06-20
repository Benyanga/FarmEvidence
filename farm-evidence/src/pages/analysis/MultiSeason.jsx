import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useParams } from 'react-router-dom';
import { ValidationGate } from '../../components/shared/ValidationGate';

// Phase determination logic
const getPhase = (season) => {
  if (season < 7) return { name: 'Establishment', color: 'bg-amber-100', code: 'EST' };
  if (season < 13) return { name: 'Stabilization', color: 'bg-blue-100', code: 'STB' };
  return { name: 'Mature', color: 'bg-emerald-100', code: 'MAT' };
};

export function MultiSeason() {
  const { trialId } = useParams();
  const [seasons, setSeasons] = useState([]);
  const [cnbData, setCnbData] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChart, setActiveChart] = useState('deltac');

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [seasonRes, cnbRes, analysisRes] = await Promise.all([
          fetch(`/api/seasons/trajectory/${trialId}`),
          fetch(`/api/seasons/cnb/${trialId}`),
          fetch(`/api/analysis/${trialId}`),
        ]);

        if (!seasonRes.ok || !cnbRes.ok || !analysisRes.ok)
          throw new Error('Failed to fetch data');

        const seasonsData = await seasonRes.json();
        const cnbDataRes = await cnbRes.json();
        const analysisData = await analysisRes.json();

        setSeasons(Array.isArray(seasonsData) ? seasonsData : []);
        setCnbData(cnbDataRes);
        setCurrentAnalysis(analysisData);
      } catch (err) {
        console.error('[MultiSeason]', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (trialId) fetchData();
  }, [trialId]);

  // Derive milestones
  const milestones = useMemo(() => {
    if (!seasons.length || !cnbData) return [];
    const cards = [];

    // CA reached cost parity (ΔC ≥ 0)
    const paritySeason = seasons.find((s) => s.deltaCumulative >= 0);
    if (paritySeason) {
      cards.push({
        id: 'parity',
        title: `CA reached cost parity with CF at Season ${paritySeason.seasonNumber}`,
        color: 'emerald',
      });
    }

    // TTP: CA profit > CF profit
    if (cnbData.ttp) {
      cards.push({
        id: 'ttp',
        title: `Time-to-Profit reached at Season ${cnbData.ttp}`,
        color: 'emerald',
      });
    }

    // Phase transitions
    if (seasons.some((s) => s.seasonNumber === 7)) {
      cards.push({
        id: 'stabilization',
        title: 'Phase transition: Stabilization entered at Season 7',
        color: 'blue',
      });
    }

    if (seasons.some((s) => s.seasonNumber === 13)) {
      cards.push({
        id: 'mature',
        title: 'Phase transition: Mature phase entered at Season 13',
        color: 'emerald',
      });
    }

    // CNB break-even
    const cnbBEseason = seasons.find((s) => s.cnbCumulative >= 0);
    if (cnbBEseason) {
      cards.push({
        id: 'cnbbe',
        title: `CNB break-even: cumulative CA advantage turned positive at Season ${cnbBEseason.seasonNumber}`,
        color: 'emerald',
      });
    }

    return cards;
  }, [seasons, cnbData]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Season',
      'Phase',
      'ΔC',
      'CA ROI',
      'CF ROI',
      'CA Yield',
      'CF Yield',
      'CA Cost',
      'CF Cost',
      'CV% CA',
      'CV% CF',
      'CSI',
      'CNB This Season',
      'CNB Cumulative',
    ];

    const rows = seasons.map((s) => [
      s.seasonNumber,
      getPhase(s.seasonNumber).name,
      s.deltaCumulative?.toFixed(0) || '—',
      s.caROI?.toFixed(2) || '—',
      s.cfROI?.toFixed(2) || '—',
      s.caYield?.toFixed(1) || '—',
      s.cfYield?.toFixed(1) || '—',
      s.caCost?.toFixed(0) || '—',
      s.cfCost?.toFixed(0) || '—',
      s.cvCA?.toFixed(1) || '—',
      s.cvCF?.toFixed(1) || '—',
      s.csi?.toFixed(1) || '—',
      s.cnbSeason?.toFixed(0) || '—',
      s.cnbCumulative?.toFixed(0) || '—',
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multi-season-${trialId}.csv`;
    a.click();
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-600">Loading multi-season analysis...</p>
      </div>
    );

  if (error)
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
        <p className="text-rose-900">Error: {error}</p>
      </div>
    );

  if (!seasons.length)
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-slate-600">No closed seasons yet. Complete at least one season to view trajectory analysis.</p>
      </div>
    );

  // SECTION 1: Season Timeline Strip
  const timelineSeasons = seasons.filter((s) => s.isClosed);

  // SECTION 2: Trend Variables Table
  const ttpSeason = cnbData?.ttp;

  // SECTION 3: Chart Data
  const chartData = seasons.map((s) => ({
    season: s.seasonNumber,
    deltac: s.deltaCumulative,
    caROI: s.caROI,
    cfROI: s.cfROI,
    caYield: s.caYield,
    cfYield: s.cfYield,
    caYieldSD: s.caYieldSD || 0,
    cfYieldSD: s.cfYieldSD || 0,
    weedScore: s.weedScore,
    soilFauna: s.soilFauna,
    cropVigor: s.cropVigor,
    csi: s.csi,
  }));

  return (
    <div className="space-y-6">
      <ValidationGate analysis={currentAnalysis} trial={{}} plots={[]} />
      {/* SECTION 1: Season Timeline Strip */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Season Timeline</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {timelineSeasons.map((season, idx) => {
            const phase = getPhase(season.seasonNumber);
            const isPhaseBoundary =
              season.seasonNumber === 7 || season.seasonNumber === 13;

            return (
              <div key={season.seasonNumber} className="flex items-center gap-2 flex-shrink-0">
                {/* Phase Separator */}
                {idx > 0 && isPhaseBoundary && (
                  <div className="h-16 w-1 bg-gradient-to-b from-slate-300 to-slate-200" />
                )}

                {/* Season Circle */}
                <div
                  className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center font-semibold text-sm border-2 ${phase.color} border-slate-300`}
                >
                  <div className="text-slate-900">{season.seasonNumber}</div>
                  <div className="text-xs text-slate-600">{phase.code}</div>

                  {/* Mini Profit Bars */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 h-6 items-center">
                    <div
                      className="w-3 bg-emerald-600 rounded-sm"
                      style={{
                        height: `${Math.min(12, (season.caProfit || 0) / 1000)}px`,
                      }}
                    />
                    <div
                      className="w-3 bg-blue-600 rounded-sm"
                      style={{
                        height: `${Math.min(12, (season.cfProfit || 0) / 1000)}px`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Current Open Season */}
          {cnbData?.currentSeason && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="h-16 w-1 bg-gradient-to-b from-slate-300 to-slate-200" />
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center font-semibold text-sm border-4 border-amber-500 bg-amber-50 animate-pulse">
                <div className="text-slate-900 text-center">
                  <div>{cnbData.currentSeason}</div>
                  <div className="text-xs text-slate-600">Open</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="text-xs text-slate-600 mt-3">
          <p>
            <span className="font-semibold">Legend:</span> Green bar = CA profit, Blue
            bar = CF profit. Phase transitions marked at Season 7 (Stabilization) and Season
            13 (Mature).
          </p>
        </div>
      </div>

      {/* SECTION 2: Trend Variables Table */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">Trend Variables</h2>
          <button
            type="button"
            onClick={handleExportCSV}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-1 rounded-2xl bg-slate-200 hover:bg-slate-300"
          >
            📥 Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Season</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Phase</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">ΔC</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">CA ROI</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">CF ROI</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">CA Yield</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">CF Yield</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">CA Cost</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">CF Cost</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">CV% CA</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">CV% CF</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">CSI</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">CNB Season</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">CNB Cumul.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {seasons.map((season) => {
                const isTTP = season.seasonNumber === ttpSeason;
                const phase = getPhase(season.seasonNumber);

                return (
                  <tr
                    key={season.seasonNumber}
                    className={`hover:bg-slate-50 ${
                      isTTP ? 'border-2 border-emerald-500 bg-emerald-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      S{season.seasonNumber}
                      {isTTP && <span className="text-xs font-bold text-emerald-700"> (TTP)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${phase.color}`}>
                        {phase.name}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        (season.deltaCumulative || 0) >= 0
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {season.deltaCumulative ? `RWF ${(season.deltaCumulative).toFixed(0)}` : '—'}
                    </td>
                    <td className="px-4 py-3">{season.caROI?.toFixed(2) || '—'}</td>
                    <td className="px-4 py-3">{season.cfROI?.toFixed(2) || '—'}</td>
                    <td className="px-4 py-3">{season.caYield?.toFixed(1) || '—'} kg/ha</td>
                    <td className="px-4 py-3">{season.cfYield?.toFixed(1) || '—'} kg/ha</td>
                    <td className="px-4 py-3">
                      RWF {(season.caCost || 0).toFixed(0)}
                    </td>
                    <td className="px-4 py-3">
                      RWF {(season.cfCost || 0).toFixed(0)}
                    </td>
                    <td className="px-4 py-3">{season.cvCA?.toFixed(1) || '—'}%</td>
                    <td className="px-4 py-3">{season.cvCF?.toFixed(1) || '—'}%</td>
                    <td className="px-4 py-3 font-semibold">{season.csi?.toFixed(1) || '—'}</td>
                    <td className="px-4 py-3">
                      RWF {(season.cnbSeason || 0).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 font-semibold">{(season.cnbCumulative || 0).toFixed(0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Trend Charts */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {[
            { key: 'deltac', label: 'ΔC Trajectory' },
            { key: 'roi', label: 'ROI Evolution' },
            { key: 'yield', label: 'Yield Stability' },
            { key: 'soil', label: 'Soil Health' },
            { key: 'csi', label: 'CSI Trend' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveChart(tab.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                activeChart === tab.key
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ΔC Trajectory */}
        {activeChart === 'deltac' && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">ΔC Cumulative Trajectory</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="season" label={{ value: 'Season', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'ΔC (RWF)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(v) => `RWF ${v?.toFixed(0)}`} />
                <ReferenceLine y={0} stroke="#999" strokeDasharray="5 5" />
                <Line
                  type="monotone"
                  dataKey="deltac"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ fill: '#059669' }}
                  name="ΔC"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-4 text-sm text-slate-600">
              Positive values indicate CA cumulative advantage over CF. Reference line at 0 shows break-even point.
            </p>
          </div>
        )}

        {/* ROI Evolution */}
        {activeChart === 'roi' && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">ROI Evolution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="season" label={{ value: 'Season', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(v) => `${v?.toFixed(2)}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="caROI"
                  stroke="#059669"
                  strokeWidth={2}
                  name="CA ROI"
                  dot={{ fill: '#059669' }}
                />
                <Line
                  type="monotone"
                  dataKey="cfROI"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="CF ROI"
                  dot={{ fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-4 text-sm text-slate-600">
              Watch for crossover point where CA ROI exceeds CF ROI, indicating CA profitability superiority.
            </p>
          </div>
        )}

        {/* Yield Stability */}
        {activeChart === 'yield' && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Yield Mean ± SD per Season</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="season" label={{ value: 'Season', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'Yield (kg/ha)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(v) => `${v?.toFixed(1)} kg/ha`} />
                <Legend />
                <Bar dataKey="caYield" fill="#059669" name="CA Yield" />
                <Bar dataKey="cfYield" fill="#2563eb" name="CF Yield" />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-4 text-sm text-slate-600">
              SD shown as error bands. Stability improves with consistent yields across seasons.
            </p>
          </div>
        )}

        {/* Soil Health */}
        {activeChart === 'soil' && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Soil Health Indicators</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="season" label={{ value: 'Season', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'Score (0–5)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="weedScore"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Weed Pressure"
                  dot={{ fill: '#f59e0b' }}
                />
                <Line
                  type="monotone"
                  dataKey="soilFauna"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Soil Fauna"
                  dot={{ fill: '#8b5cf6' }}
                />
                <Line
                  type="monotone"
                  dataKey="cropVigor"
                  stroke="#059669"
                  strokeWidth={2}
                  name="Crop Vigor"
                  dot={{ fill: '#059669' }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-4 text-sm text-slate-600">
              Rising soil fauna and crop vigor, falling weed pressure indicate successful CA transition.
            </p>
          </div>
        )}

        {/* CSI Trend */}
        {activeChart === 'csi' && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Climate Smartness Index (CSI) Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="season" label={{ value: 'Season', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'CSI Score', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(v) => v?.toFixed(2)} />
                <Line
                  type="monotone"
                  dataKey="csi"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="CSI"
                  dot={{ fill: '#06b6d4' }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-4 text-sm text-slate-600">
              Rising CSI indicates improving site conditions and system adaptation to climate risks.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 4: Key Trajectory Milestones */}
      {milestones.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Trajectory Milestones</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`rounded-2xl border-2 p-4 ${
                  milestone.color === 'emerald'
                    ? 'border-emerald-500 bg-emerald-50'
                    : milestone.color === 'blue'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    milestone.color === 'emerald'
                      ? 'text-emerald-900'
                      : milestone.color === 'blue'
                      ? 'text-blue-900'
                      : 'text-slate-900'
                  }`}
                >
                  ✓ {milestone.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: Farm-level vs Research Info */}
      <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">ℹ️ Multi-season analysis:</span> This view aggregates
          closed seasons only. Current (open) season data is updated live as field data is
          entered. Complete the current season to add it to the trajectory.
        </p>
      </div>
    </div>
  );
}
