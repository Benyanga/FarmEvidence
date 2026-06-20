import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { ChevronDown, AlertCircle, ArrowRight } from 'lucide-react';
import { ScreenTopbar } from '../../components/shared/ScreenTopbar';
import { useTrialContext } from '../../context/TrialContext';

const PALETTE = ['#10b981', '#059669', '#047857', '#f97316', '#c2410c', '#0ea5e9', '#0284c7', '#8b5cf6'];
const seasonOrder = { A: 1, B: 2, C: 3 };

const LABELS = {
  en: {
    title: 'Season Comparison',
    timeline: 'All Seasons Timeline',
    profitability: 'Profitability Changes — Same Crop Seasons',
    agronomic: 'Soil & Crop Health — Season to Season',
    noProfitability: "You don't yet have two seasons with the same crop to compare. Profitability trends will appear here once you've recorded the same crop in a later season.",
    noAgronomic: 'Record at least 2 seasons of farm conditions data to see trends here.',
    crop: 'Crop',
    yield: 'Yield',
    netBenefit: 'Net Benefit',
    bcr: 'BCR',
    totalCost: 'Total Cost',
    grossRevenue: 'Gross Revenue',
    seasonA: 'Season A',
    seasonB: 'Season B',
    comparisonBadge: 'Comparison',
    insightBadge: 'Insight',
    interpretation: 'Interpretation',
    incomplete: 'Incomplete',
    seasonTransition: 'Season Transition',
    cropChange: 'Crop Change?',
    weedDelta: 'Weed Δ',
    faunaDelta: 'Soil Fauna Δ',
    colorDelta: 'Soil Color Δ',
    vigorDelta: 'Crop Vigor Δ',
    pestDelta: 'Pest Δ',
    yes: 'Yes',
    no: 'No',
    continueEntry: 'Continue Data Entry',
    viewAlerts: 'View Alerts',
    farm: 'Farm',
    selectFarm: 'Select a Farm',
    noFarms: 'No farms found. Create one in Setup.',
    loading: 'Loading...',
    error: 'Error loading comparison',
    good: 'Improving',
    bad: 'Worsening',
    same: 'No change',
  },
  kin: {
    title: 'Kugereranya Ibihembwe',
    timeline: 'Ibyiciro Byose',
    profitability: 'Imihindagurikire y\'inyungu — Ibihembwe Bimwe',
    agronomic: 'Ubuziranenge bw\'ubutaka n\'ibihingwa — Ibihembwe ku birihembwe',
    noProfitability: 'Nta bihembwe bibiri by\'igihingwa kimwe byabonetse ngo ugereranye. Imigendekere y\'inyungu izagaragara hano umaze kwandika ibihingwa nk\'ibyo mu gihe kizaza.',
    noAgronomic: 'Andika nibura ibihe bibiri by\'ibikorwa by\'ubutaka urebe imigendekere hano.',
    crop: 'Igihingwa',
    yield: 'Umusaruro',
    netBenefit: 'Inyungu Nyinshi',
    bcr: 'BCR',
    totalCost: 'Igiciro cyose',
    grossRevenue: 'Inyungu y\'amafaranga',
    seasonA: 'Ibihembwe A',
    seasonB: 'Ibihembwe B',
    comparisonBadge: 'Gereranya',
    insightBadge: 'Ibisobanuro',
    interpretation: 'Ibisobanuro',
    incomplete: 'Ntabwo birangiye',
    seasonTransition: 'Guhinduranya Ibihembwe',
    cropChange: 'Kwimura Igihingwa?',
    weedDelta: 'Impanuka z\'ibimera Δ',
    faunaDelta: 'Δ ya Fauna y\'ubutaka',
    colorDelta: 'Δ y\'Ibara ry\'ubutaka',
    vigorDelta: 'Δ y\'Imbaraga z\'igihingwa',
    pestDelta: 'Δ y\'udukoko',
    yes: 'Yego',
    no: 'Oya',
    continueEntry: 'Komeza Kwinjiza Amakuru',
    viewAlerts: 'Reba Imenyesha',
    farm: 'Ubutaka',
    selectFarm: 'Hitamo Ubutaka',
    noFarms: 'Nta butaka bubonetse. Tegura kimwe mu Igenamiterere.',
    loading: 'Birimo gupakurura...',
    error: 'Ikibazo mu kugereranya',
    good: 'Biragenda neza',
    bad: 'Biragenda nabi',
    same: 'Nta mpinduka',
  },
};

function getCropColor(crop) {
  let hash = 0;
  for (let i = 0; i < crop.length; i += 1) {
    hash = (hash << 5) - hash + crop.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function seasonLabel(item) {
  return `${item.season} ${item.year}`;
}

function formatValue(value, suffix = '') {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const rounded = typeof value === 'number' ? Math.round(value) : Number(value);
  return `${rounded.toLocaleString()}${suffix}`;
}

function deltaLabel(value, invert = false) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const val = Number(value);
  const arrow = val > 0 ? '↑' : val < 0 ? '↓' : '→';
  const abs = Math.abs(val).toFixed(1);
  return `${arrow} ${abs}%`;
}

function compareColor(value, invert = false) {
  if (value == null || Number.isNaN(Number(value))) return 'text-slate-600';
  const val = Number(value);
  const improved = invert ? val < 0 : val > 0;
  return improved ? 'text-emerald-700' : val === 0 ? 'text-slate-600' : 'text-rose-700';
}

function SeasonComparison() {
  const navigate = useNavigate();
  const { activeFarm, lang } = useTrialContext();
  const labels = LABELS[lang === 'kin' ? 'kin' : 'en'];

  const [farmList, setFarmList] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(activeFarm);
  const [trajectory, setTrajectory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const loadFarms = async () => {
      try {
        const res = await fetch('/api/farms');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const list = Array.isArray(data) ? data : [];
        setFarmList(list);
        if (!selectedFarm && list.length > 0) {
          setSelectedFarm(list[0]);
        }
      } catch (err) {
        setError(err.message || labels.error);
      }
    };
    loadFarms();
  }, [labels.error]);

  useEffect(() => {
    const loadTrajectory = async () => {
      if (!selectedFarm?._id) return;
      try {
        setIsLoading(true);
        setError('');
        const res = await fetch(`/api/farm-analysis/${selectedFarm._id}/trajectory`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setTrajectory(data);
      } catch (err) {
        setError(err.message || labels.error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTrajectory();
  }, [selectedFarm, labels.error]);

  const timeline = trajectory?.timeline || [];
  const profitabilityComparisons = trajectory?.profitabilityComparisons || [];
  const agronomicComparisons = trajectory?.agronomicComparisons || [];

  const cropHistory = useMemo(() => {
    if (!timeline.length) return {};
    return timeline.reduce((map, item) => {
      const name = item.crop || 'Unknown';
      map[name] = map[name] || [];
      map[name].push({
        name: seasonLabel(item),
        netBenefit: item.netBenefit || 0,
        year: item.year,
        season: item.season,
      });
      return map;
    }, {});
  }, [timeline]);

  const chartData = useMemo(() => {
    if (!agronomicComparisons.length) return [];
    return agronomicComparisons.map((item, index) => ({
      label: seasonLabel(item),
      weedPressure: item.weedPressure ?? null,
      soilFauna: item.soilFauna ?? null,
      soilColor: item.soilColor ?? null,
      cropVigour: item.cropVigour ?? null,
      crop: item.crop || item.seasonCrop || 'Unknown',
      index,
    }));
  }, [agronomicComparisons]);

  const transitionRows = useMemo(() => {
    return agronomicComparisons.map((item) => ({
      transition: `${item.fromSeason || item.prevSeason || item.season} → ${item.toSeason || item.season}`,
      cropChange: item.cropChange ? labels.yes : labels.no,
      weedDelta: item.weedDelta,
      faunaDelta: item.soilFaunaDelta,
      colorDelta: item.soilColorDelta,
      vigorDelta: item.cropVigourDelta,
      pestDelta: item.pestDelta,
      interpretation: item.interpretation || item.message || '',
    }));
  }, [agronomicComparisons]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText={labels.title}
        title={selectedFarm?.farmName || labels.farm}
        meta={selectedFarm?.location || ''}
        status={isLoading ? labels.loading : 'Ready'}
        statusTone={isLoading ? 'offline' : 'synced'}
      />

      <div className="mx-auto max-w-7xl space-y-8">
        {error && (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">
            <AlertCircle className="inline h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{labels.farm}</h2>
              <p className="text-sm text-slate-600">{selectedFarm?.farmName}</p>
            </div>
            {farmList.length > 1 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  {labels.selectFarm}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-lg">
                    {farmList.map((farm) => (
                      <button
                        key={farm._id}
                        type="button"
                        onClick={() => {
                          setSelectedFarm(farm);
                          setDropdownOpen(false);
                        }}
                        className={`block w-full px-4 py-3 text-left text-sm hover:bg-slate-100 ${
                          farm._id === selectedFarm?._id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {farm.farmName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-slate-900">{labels.timeline}</h2>
            <button
              type="button"
              onClick={() => navigate('/data-entry')}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              {labels.continueEntry}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-x-auto py-2">
            <div className="flex gap-4 pb-4">
              {timeline.map((item) => {
                const crop = item.crop || item.seasonCrop || 'Unknown';
                const color = getCropColor(crop);
                const incomplete = !item.yield || item.yield === 0;
                return (
                  <div
                    key={`${item.year}-${item.season}-${crop}`}
                    className={`min-w-[260px] rounded-[2rem] border p-5 shadow-sm transition ${
                      incomplete ? 'border-slate-200 bg-slate-100 text-slate-500 opacity-70' : 'border-slate-200 bg-white'
                    }`}
                    style={{ borderColor: incomplete ? '#cbd5e1' : color }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{seasonLabel(item)}</p>
                        <div className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: color }}>
                          {crop}
                        </div>
                      </div>
                      {incomplete && <span className="text-xs uppercase text-slate-500">{labels.incomplete}</span>}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500">{labels.yield}</p>
                        <p className="text-lg font-semibold text-slate-900">{formatValue(item.yield, ' kg')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">{labels.netBenefit}</p>
                        <p className="text-lg font-semibold text-slate-900">{formatValue(item.netBenefit, ' RWF')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">{labels.bcr}</p>
                        <p className="text-lg font-semibold text-slate-900">{item.bcr ? item.bcr.toFixed(2) : '—'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">{labels.profitability}</h2>
          {profitabilityComparisons.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-slate-600">
              {labels.noProfitability}
            </div>
          ) : (
            <div className="space-y-6">
              {profitabilityComparisons.map((comparison, index) => {
                const cropName = comparison.cropName || comparison.crop || 'Unknown';
                const history = cropHistory[cropName] || [];
                return (
                  <div key={`${cropName}-${index}`} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{cropName}: {comparison.seasonA || comparison.fromSeason} → {comparison.seasonB || comparison.toSeason}</h3>
                      </div>
                      <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {comparison.interpretation ? 'Summary' : 'Comparison'}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { label: 'Total Cost', a: comparison.totalCostA, b: comparison.totalCostB, invert: true },
                        { label: 'Gross Revenue', a: comparison.grossRevenueA, b: comparison.grossRevenueB },
                        { label: 'Net Benefit', a: comparison.netBenefitA, b: comparison.netBenefitB },
                        { label: 'Yield', a: comparison.yieldA, b: comparison.yieldB },
                        { label: 'BCR', a: comparison.bcrA, b: comparison.bcrB },
                      ].map((metric) => {
                        const change = metric.a != null && metric.b != null ? ((metric.b - metric.a) / Math.max(Math.abs(metric.a), 1)) * 100 : null;
                        return (
                          <div key={metric.label} className="rounded-3xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between text-sm text-slate-500">
                              <span>{metric.label}</span>
                              <span className={compareColor(change, metric.invert)}>{deltaLabel(change, metric.invert)}</span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
                              <div className="rounded-2xl bg-slate-50 p-3">
                                <div className="text-xs uppercase text-slate-500">A</div>
                                <div className="mt-2 font-semibold">{formatValue(metric.a, metric.label === 'BCR' ? '' : metric.label === 'Yield' ? ' kg' : metric.label === 'Total Cost' || metric.label === 'Gross Revenue' || metric.label === 'Net Benefit' ? ' RWF' : '')}</div>
                              </div>
                              <div className="rounded-2xl bg-slate-50 p-3">
                                <div className="text-xs uppercase text-slate-500">B</div>
                                <div className="mt-2 font-semibold">{formatValue(metric.b, metric.label === 'BCR' ? '' : metric.label === 'Yield' ? ' kg' : metric.label === 'Total Cost' || metric.label === 'Gross Revenue' || metric.label === 'Net Benefit' ? ' RWF' : '')}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {comparison.interpretation && (
                      <div className="mt-4 rounded-[1.5rem] bg-emerald-50 p-4 text-slate-700">
                        <p className="text-sm font-semibold text-emerald-700">{labels.insightBadge}</p>
                        <p className="mt-2 text-sm">{comparison.interpretation}</p>
                      </div>
                    )}

                    {history.length > 1 && (
                      <div className="mt-6">
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `${Math.round(value).toLocaleString()} RWF`} />
                            <Legend />
                            <Line type="monotone" dataKey="netBenefit" stroke={getCropColor(cropName)} strokeWidth={3} dot />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">{labels.agronomic}</h2>
          {agronomicComparisons.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-slate-600">
              {labels.noAgronomic}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="weedPressure" stroke="#f97316" strokeWidth={3} name="Weed Pressure" />
                    <Line type="monotone" dataKey="soilFauna" stroke="#10b981" strokeWidth={3} name="Soil Fauna" />
                    <Line type="monotone" dataKey="soilColor" stroke="#2563eb" strokeWidth={3} name="Soil Color" />
                    <Line type="monotone" dataKey="cropVigour" stroke="#8b5cf6" strokeWidth={3} name="Crop Vigor" />
                    {chartData.map((item, index) => {
                      const next = chartData[index + 1];
                      if (!next || item.crop === next.crop) return null;
                      return (
                        <ReferenceLine
                          key={`${item.label}-${next.label}`}
                          x={next.label}
                          stroke="#94a3b8"
                          strokeDasharray="4 4"
                          label={{
                            value: `${item.crop} → ${next.crop}`,
                            position: 'insideTop',
                            fill: '#475569',
                            fontSize: 11,
                          }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 font-semibold">{labels.seasonTransition}</th>
                      <th className="px-4 py-3 font-semibold">{labels.cropChange}</th>
                      <th className="px-4 py-3 font-semibold">{labels.weedDelta}</th>
                      <th className="px-4 py-3 font-semibold">{labels.faunaDelta}</th>
                      <th className="px-4 py-3 font-semibold">{labels.colorDelta}</th>
                      <th className="px-4 py-3 font-semibold">{labels.vigorDelta}</th>
                      <th className="px-4 py-3 font-semibold">{labels.pestDelta}</th>
                      <th className="px-4 py-3 font-semibold">{labels.interpretation}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transitionRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-3">{row.transition}</td>
                        <td className="px-4 py-3">{row.cropChange}</td>
                        <td className={`px-4 py-3 ${row.weedDelta < 0 ? 'text-emerald-700' : row.weedDelta > 0 ? 'text-rose-700' : 'text-slate-700'}`}>{deltaLabel(row.weedDelta)}</td>
                        <td className={`px-4 py-3 ${row.faunaDelta > 0 ? 'text-emerald-700' : row.faunaDelta < 0 ? 'text-rose-700' : 'text-slate-700'}`}>{deltaLabel(row.faunaDelta)}</td>
                        <td className={`px-4 py-3 ${row.colorDelta > 0 ? 'text-emerald-700' : row.colorDelta < 0 ? 'text-rose-700' : 'text-slate-700'}`}>{deltaLabel(row.colorDelta)}</td>
                        <td className={`px-4 py-3 ${row.vigorDelta > 0 ? 'text-emerald-700' : row.vigorDelta < 0 ? 'text-rose-700' : 'text-slate-700'}`}>{deltaLabel(row.vigorDelta)}</td>
                        <td className={`px-4 py-3 ${row.pestDelta < 0 ? 'text-emerald-700' : row.pestDelta > 0 ? 'text-rose-700' : 'text-slate-700'}`}>{deltaLabel(row.pestDelta)}</td>
                        <td className="px-4 py-3 text-slate-600">{row.interpretation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default SeasonComparison;
