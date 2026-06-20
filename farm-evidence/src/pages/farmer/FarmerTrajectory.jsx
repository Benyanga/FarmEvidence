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

const LABELS = {
  en: {
    title: 'Farm Trajectory',
    phaseProgress: 'Phase Progress',
    netBenefit: 'Net Benefit Over Time',
    csi: 'CSI Over Time',
    noData: 'No farm seasons found. Record at least one season to view your trajectory.',
    transitionLabel: 'Transition (1-6)',
    stabilizationLabel: 'Stabilization (7-12)',
    matureLabel: 'Mature (13+)',
    currentPhase: 'You are in Season {t} of your conservation farming journey — {phase} phase.',
    improvingProfit: 'Your profitability has been improving season over season.',
    decliningProfit: 'Your profitability has been declining across the last two recorded seasons.',
    adoptionDecaying: 'Your initial setup costs are decreasing — by Season 6 they will be negligible.',
    netBenefitAxis: 'Net Benefit (RWF)',
    csiAxis: 'CSI (0-1)',
    continueEntry: 'Continue Data Entry',
    farm: 'Farm',
    selectFarm: 'Select a Farm',
    loading: 'Loading...',
    error: 'Error loading trajectory',
    yes: 'Yes',
    no: 'No',
  },
  kin: {
    title: 'Inzira y\'Ubutaka',
    phaseProgress: 'Umurongo w\'Inzira',
    netBenefit: 'Inyungu Nyinshi ku Gihe',
    csi: 'CSI ku Gihe',
    noData: 'Nta bihembwe by\'ubutaka byabonetse. Andika nibura igihembwe kimwe kugira ngo urebe inzira yawe.',
    transitionLabel: 'Guhinduka (1-6)',
    stabilizationLabel: 'Gutungana (7-12)',
    matureLabel: 'Kubyara (13+)',
    currentPhase: 'Uri mu Ibihembwe {t} by\'ingendo yawe y\'ubuhinzi bw\'uburinzi — icyiciro {phase}.',
    improvingProfit: 'Inyungu zawe zirimo kuzamuka buri gihembwe.',
    decliningProfit: 'Inyungu zawe zaragabanutse mu bihe bibiri bishize byanditswe.',
    adoptionDecaying: 'Amafaranga y\'ibanze yo gutangira ari kugabanuka — mu gihembwe cya 6 azaba atarimo.',
    netBenefitAxis: 'Inyungu Nyinshi (RWF)',
    csiAxis: 'CSI (0-1)',
    continueEntry: 'Komeza Kwinjiza Amakuru',
    farm: 'Ubutaka',
    selectFarm: 'Hitamo Ubutaka',
    loading: 'Birimo gupakurura...',
    error: 'Ikibazo mu gupakira inzira',
    yes: 'Yego',
    no: 'Oya',
  },
};

function seasonLabel(item) {
  return `${item.season} ${item.year}`;
}

function formatValue(value, suffix = '') {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const rounded = typeof value === 'number' ? Math.round(value) : Number(value);
  return `${rounded.toLocaleString()}${suffix}`;
}

function FarmerTrajectory() {
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
  const latestSeason = timeline[timeline.length - 1] || null;

  const chartData = useMemo(() => {
    return timeline.map((item) => ({
      name: seasonLabel(item),
      netBenefit: item.netBenefit ?? null,
      csi: item.csi ?? null,
      cAdopt: item.cAdopt ?? null,
      phase: item.phase || '—',
      t: item.t,
    }));
  }, [timeline]);

  const currentMarker = useMemo(() => {
    if (!latestSeason) return 0;
    const position = Math.min(100, Math.max(0, ((latestSeason.t - 1) / 12) * 100));
    return position;
  }, [latestSeason]);

  const summaryText = useMemo(() => {
    if (!latestSeason) return labels.noData;
    const phaseText = labels.currentPhase.replace('{t}', String(latestSeason.t)).replace('{phase}', latestSeason.phase);
    const trend = timeline.length >= 2
      ? timeline[timeline.length - 1].netBenefit >= timeline[timeline.length - 2].netBenefit
      : null;
    const trendText = trend === null
      ? ''
      : trend
        ? ` ${labels.improvingProfit}`
        : ` ${labels.decliningProfit}`;
    const adoptionText = latestSeason.cAdopt > 0 && timeline[0]?.cAdopt > latestSeason.cAdopt
      ? ` ${labels.adoptionDecaying}`
      : '';
    return `${phaseText}${trendText}${adoptionText}`.trim();
  }, [latestSeason, labels, timeline]);

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
                        className={`block w-full px-4 py-3 text-left text-sm hover:bg-slate-100 ${farm._id === selectedFarm?._id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-900'}`}
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
            <h2 className="text-2xl font-semibold text-slate-900">{labels.phaseProgress}</h2>
            <button
              type="button"
              onClick={() => navigate('/data-entry')}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              {labels.continueEntry}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4 text-sm text-slate-600">
              <span>{labels.transitionLabel}</span>
              <span>{labels.stabilizationLabel}</span>
              <span>{labels.matureLabel}</span>
            </div>
            <div className="relative h-6 overflow-hidden rounded-full bg-slate-100">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-emerald-200" />
              <div className="absolute inset-y-0 left-1/3 w-1/3 bg-emerald-400" />
              <div className="absolute inset-y-0 left-2/3 w-1/3 bg-emerald-700" />
              <div className="absolute left-0 top-0 h-6 w-full bg-gradient-to-r from-black/0 to-black/0" />
              <div
                className="absolute left-0 top-full -translate-y-1/2 h-8 w-0.5 bg-slate-900"
                style={{ left: `${currentMarker}%` }}
              />
              <div
                className="absolute top-0 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-700"
                style={{ left: `${currentMarker}%` }}
              >
                ●
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-700">{latestSeason ? labels.currentPhase.replace('{t}', String(latestSeason.t)).replace('{phase}', latestSeason.phase) : labels.noData}</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">{labels.netBenefit}</h2>
          {timeline.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-slate-600">{labels.noData}</div>
          ) : (
            <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 24, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `${value}`} />
                    <Tooltip formatter={(value) => `${formatValue(value, ' RWF')}`} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="netBenefit" stroke="#2D5016" strokeWidth={3} dot />
                    <Line type="monotone" dataKey="cAdopt" stroke="#2D5016" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Adoption Cost" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-sm text-slate-600">
                {summaryText}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">{labels.csi}</h2>
          {timeline.length === 0 ? null : (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 24, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 1]} tickFormatter={(value) => value.toFixed(1)} />
                    <Tooltip formatter={(value) => typeof value === 'number' ? value.toFixed(2) : '—'} />
                    <Line type="monotone" dataKey="csi" stroke="#2D5016" strokeWidth={3} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default FarmerTrajectory;
