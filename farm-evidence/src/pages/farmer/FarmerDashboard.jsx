import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChevronDown, AlertCircle, ArrowRight } from 'lucide-react';
import { useTrialContext } from '../../context/TrialContext';
import { ScreenTopbar } from '../../components/shared/ScreenTopbar';

const LABELS = {
  en: {
    welcomeBack: 'Welcome back',
    phase: 'Phase',
    phaseIndicator: 'Phase Indicator',
    keyNumbers: 'Key Numbers',
    totalProductionCost: 'Total Production Cost',
    grossRevenue: 'Gross Revenue',
    netBenefit: 'Net Benefit',
    bcr: 'Break-Cost Ratio',
    roi: 'ROI',
    costPerKg: 'Cost per kg',
    bcrExplanation: 'For every 1 RWF spent, you got back',
    breakEvenStatus: 'Break-Even Status',
    marginOfSafety: 'Margin of Safety',
    youNeeded: 'You needed at least',
    youHarvested: 'kg to break even. You harvested',
    costBreakdown: 'This Season\'s Cost Breakdown',
    inputCosts: 'Input Costs',
    labourCosts: 'Labour Costs',
    adoptionCost: 'Adoption Cost',
    quickActions: 'Quick Actions',
    continueEntry: 'Continue Data Entry',
    seasonComparison: 'View Season Comparison',
    viewAlerts: 'View Alerts',
    onboarding: 'Enter Your Harvest Data',
    onboardingMessage: 'Harvest data hasn\'t been recorded yet. Start by entering your yield and other season information.',
    selectFarm: 'Select a Farm',
    noFarms: 'No farms found. Create one in Setup.',
    loading: 'Loading...',
    error: 'Error loading dashboard',
    strong: 'Strong',
    moderate: 'Moderate',
    weak: 'Weak',
  },
  kin: {
    welcomeBack: 'Mwaramutse',
    phase: 'Intera',
    phaseIndicator: 'Nta Intera',
    keyNumbers: 'Imibare Ingenzi',
    totalProductionCost: 'Ubwigire bw\'Ubujanisha',
    grossRevenue: 'Inyongeragihugu',
    netBenefit: 'Inyungu Nyinshi',
    bcr: 'Igipimo cy\'Ubwigire',
    bcrExplanation: 'Kuri buri 1 RWF mushyizeho, wahawe',
    breakEvenStatus: 'Uko Byingana',
    marginOfSafety: 'Umutekano',
    youNeeded: 'Wahisemo',
    youHarvested: 'kg ngo byingane. Waramuye',
    costBreakdown: 'Amakuro Yihariye',
    inputCosts: 'Ibiciro by\'Ibihogo',
    labourCosts: 'Ibiciro by\'Akazi',
    adoptionCost: 'Ibiciro by\'Itangiriro',
    quickActions: 'Ikibazo Vuba',
    continueEntry: 'Endesha Kwinjiza Amakuru',
    seasonComparison: 'Reba Kugereranya Ibihembwe',
    viewAlerts: 'Reba Imenyesha',
    onboarding: 'Injiza Amakuru Ngo Ubwigire',
    onboardingMessage: 'Nta makuru yereka ubwigire. Tangira muburyo bw\'ibugaro.',
    selectFarm: 'Hitamo Ubutaka',
    noFarms: 'Nta butaka bafitwe. Igenera umwe mu Igenamiterere.',
    loading: 'Gukoreshwa...',
    error: 'Hasi y\'ikibazo',
    strong: 'Gisubira Neza',
    moderate: 'Kikunzira',
    weak: 'Kikunzira Cyane',
  },
};

function PhaseIndicatorStrip({ phase, phi, csi, message, lang }) {
  const labels = LABELS[lang === 'kin' ? 'kin' : 'en'];
  
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-r from-emerald-50 to-slate-50 p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">{labels.phase}</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{phase || '—'}</p>
        </div>
        <div className="rounded-lg bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">φ(t)</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{phi ? phi.toFixed(2) : '—'}</p>
        </div>
        <div className="rounded-lg bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">CSI</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{csi ? csi.toFixed(2) : '—'}</p>
        </div>
        <div className="rounded-lg bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">{labels.phase} {labels.phase}</p>
          <p className="mt-1 text-sm text-slate-700">{message || 'Gusubiramo bugumiwe'}</p>
        </div>
      </div>
    </div>
  );
}

function KeyNumbersCard({ label, value, subtext, highlight }) {
  return (
    <div
      className={`rounded-[2rem] border p-6 shadow-sm ${
        highlight
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-xs font-semibold uppercase text-slate-600">{label}</p>
      <p
        className={`mt-2 text-3xl font-bold ${
          highlight ? 'text-emerald-900' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
      {subtext && (
        <p className="mt-2 text-xs text-slate-600">{subtext}</p>
      )}
    </div>
  );
}

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const { activeFarm, setActiveFarm, lang } = useTrialContext();
  const labels = LABELS[lang === 'kin' ? 'kin' : 'en'];

  const [selectedFarm, setSelectedFarm] = useState(activeFarm);
  const [farms, setFarms] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFarmDropdown, setShowFarmDropdown] = useState(false);

  // Load farms and determine current farm
  useEffect(() => {
    const loadFarms = async () => {
      try {
        const res = await fetch('/api/farms');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        const farmList = Array.isArray(data) ? data : [];
        setFarms(farmList);

        let farm = activeFarm;
        if (!farm && farmList.length > 0) {
          farm = farmList[0];
          setActiveFarm(farm);
        }
        setSelectedFarm(farm);
      } catch (err) {
        setError(err.message || 'Failed to load farms');
      }
    };
    loadFarms();
  }, [activeFarm, setActiveFarm]);

  // Load current season and analysis
  useEffect(() => {
    if (!selectedFarm) return;

    const loadSeasonAndAnalysis = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Get seasons
        const seasonsRes = await fetch(`/api/farms/${selectedFarm._id}/seasons`);
        const seasonsData = await seasonsRes.json();
        if (seasonsData.error) throw new Error(seasonsData.error);

        const seasons = Array.isArray(seasonsData) ? seasonsData : [];
        if (seasons.length === 0) {
          setCurrentSeason(null);
          setAnalysis(null);
          setIsLoading(false);
          return;
        }

        // Sort by year/season descending and get most recent
        const mostRecent = seasons.sort((a, b) => {
          const aYear = Number(a.year);
          const bYear = Number(b.year);
          if (aYear !== bYear) return bYear - aYear;
          return (b.season || '').localeCompare(a.season || '');
        })[0];

        setCurrentSeason(mostRecent);

        // Get analysis
        const analysisRes = await fetch(
          `/api/farm-analysis/${selectedFarm._id}/${mostRecent.year}/${mostRecent.season}`
        );
        const analysisData = await analysisRes.json();
        if (analysisData.error) throw new Error(analysisData.error);
        setAnalysis(analysisData);
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadSeasonAndAnalysis();
  }, [selectedFarm]);

  const handleFarmSwitch = (farm) => {
    setSelectedFarm(farm);
    setActiveFarm(farm);
    setShowFarmDropdown(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Dashboard"
          title={labels.loading}
          meta=""
          status="Loading"
          statusTone="offline"
        />
        <div className="mx-auto max-w-7xl text-center text-slate-600">
          {labels.loading}
        </div>
      </div>
    );
  }

  if (error || !selectedFarm) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Dashboard"
          title={labels.error}
          meta=""
          status="Error"
          statusTone="offline"
        />
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <AlertCircle className="mb-2 h-5 w-5" />
          {error || labels.noFarms}
        </div>
      </div>
    );
  }

  const isDataComplete = currentSeason && analysis && analysis.record && analysis.record.yield > 0;

  const costBreakdownData = useMemo(() => {
    if (!analysis) return [];
    const record = analysis.record;
    const data = [];
    
    if (record.inputCosts && record.inputCosts.length > 0) {
      const total = record.inputCosts.reduce((sum, ic) => sum + (ic.cost || 0), 0);
      if (total > 0) data.push({ name: labels.inputCosts, value: total });
    }
    
    if (record.labourCosts && record.labourCosts.length > 0) {
      const total = record.labourCosts.reduce((sum, lc) => sum + (lc.cost || 0), 0);
      if (total > 0) data.push({ name: labels.labourCosts, value: total });
    }
    
    if (analysis.adoptionCost && analysis.adoptionCost > 0) {
      data.push({ name: labels.adoptionCost, value: analysis.adoptionCost });
    }
    
    return data;
  }, [analysis, labels]);

  const CHART_COLORS = ['#10b981', '#059669', '#047857'];

  const marginOfSafetyBadge = useMemo(() => {
    if (!analysis || !analysis.breakEven) return labels.weak;
    const breakEvenYield = analysis.breakEven.breakEvenYield || 0;
    const actualYield = analysis.record.yield || 0;
    
    if (actualYield === 0) return labels.weak;
    const ratio = actualYield / breakEvenYield;
    if (ratio >= 1.5) return labels.strong;
    if (ratio >= 1.1) return labels.moderate;
    return labels.weak;
  }, [analysis, labels]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText="Dashboard"
        title={`${labels.welcomeBack}, ${selectedFarm.ownerName || selectedFarm.farmName}`}
        meta={`${selectedFarm.farmName} • ${selectedFarm.location}`}
        status="Ready"
        statusTone="synced"
      />

      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header with Farm Selector */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{selectedFarm.farmName}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {selectedFarm.ownerName ? `${selectedFarm.ownerName} • ` : ''}
                {selectedFarm.location}
              </p>
            </div>
            {currentSeason && (
              <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                Season {currentSeason.season} {currentSeason.year} — {currentSeason.crop}
              </div>
            )}
          </div>

          {farms.length > 1 && (
            <div className="relative mt-6">
              <button
                type="button"
                onClick={() => setShowFarmDropdown(!showFarmDropdown)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                {labels.selectFarm}
                <ChevronDown className="h-4 w-4" />
              </button>
              {showFarmDropdown && (
                <div className="absolute top-full left-0 mt-2 z-10 min-w-max rounded-2xl border border-slate-200 bg-white shadow-lg">
                  {farms.map((farm) => (
                    <button
                      key={farm._id}
                      type="button"
                      onClick={() => handleFarmSwitch(farm)}
                      className={`block w-full px-4 py-3 text-left text-sm font-medium transition first:rounded-t-2xl last:rounded-b-2xl ${
                        farm._id === selectedFarm._id
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-900 hover:bg-slate-50'
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

        {/* Main Content */}
        {!isDataComplete ? (
          // Onboarding State
          <div className="rounded-[2rem] border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <div className="mx-auto max-w-md">
              <div className="mb-4 text-6xl">🌾</div>
              <h2 className="text-2xl font-bold text-slate-900">{labels.onboarding}</h2>
              <p className="mt-2 text-slate-600">{labels.onboardingMessage}</p>
              <button
                type="button"
                onClick={() =>
                  currentSeason &&
                  navigate(`/data-entry/${currentSeason.year}/${currentSeason.season}/${currentSeason._id}`)
                }
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {labels.continueEntry}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Phase + CSI Strip */}
            <PhaseIndicatorStrip
              phase={analysis.phase}
              phi={analysis.phi}
              csi={analysis.csi}
              message={analysis.farmerMessage}
              lang={lang}
            />

            {/* Key Numbers */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-slate-900">{labels.keyNumbers}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KeyNumbersCard
                  label={labels.totalProductionCost}
                  value={`${Math.round(
                    (analysis.record.inputCosts?.reduce((sum, ic) => sum + (ic.cost || 0), 0) || 0) +
                    (analysis.record.labourCosts?.reduce((sum, lc) => sum + (lc.cost || 0), 0) || 0)
                  ).toLocaleString()} RWF`}
                />
                <KeyNumbersCard
                  label={labels.grossRevenue}
                  value={`${Math.round(
                    (analysis.record.yield || 0) * (analysis.record.marketPriceRWF || 1200)
                  ).toLocaleString()} RWF`}
                />
                <KeyNumbersCard
                  label={labels.netBenefit}
                  value={`${Math.round(
                    (analysis.record.yield || 0) * (analysis.record.marketPriceRWF || 1200) -
                    ((analysis.record.inputCosts?.reduce((sum, ic) => sum + (ic.cost || 0), 0) || 0) +
                    (analysis.record.labourCosts?.reduce((sum, lc) => sum + (lc.cost || 0), 0) || 0))
                  ).toLocaleString()} RWF`}
                  highlight
                />
                <KeyNumbersCard
                  label={labels.bcr}
                  value={analysis.bcr ? analysis.bcr.toFixed(2) : '0'}
                  subtext={`${labels.bcrExplanation} ${analysis.bcr ? analysis.bcr.toFixed(2) : '0'} RWF`}
                />
                <KeyNumbersCard
                  label={labels.roi}
                  value={analysis.record?.roi != null ? `${analysis.record.roi.toFixed(1)}%` : '0%'}
                />
                <KeyNumbersCard
                  label={labels.costPerKg}
                  value={analysis.record?.costPerKg != null ? `${analysis.record.costPerKg.toFixed(1)} RWF` : '—'}
                />
              </div>
            </div>

            {/* Break-Even Status */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-900">{labels.breakEvenStatus}</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    {labels.youNeeded} {analysis.breakEven?.breakEvenYield?.toFixed(1) || 0} {labels.youHarvested}{' '}
                    {analysis.record.yield || 0} kg.
                  </p>
                  <div className="relative h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          ((analysis.record.yield || 0) / (analysis.breakEven?.breakEvenYield || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {(
                      ((analysis.record.yield || 0) / (analysis.breakEven?.breakEvenYield || 1)) * 100
                    ).toFixed(0)}
                    % of break-even
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-slate-50 px-6 py-4 text-center">
                    <p className="text-xs font-semibold uppercase text-slate-600">{labels.marginOfSafety}</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700">{marginOfSafetyBadge}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            {costBreakdownData.length > 0 && (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-bold text-slate-900">{labels.costBreakdown}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${Math.round(value).toLocaleString()} RWF`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costBreakdownData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `${Math.round(value).toLocaleString()} RWF`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h3 className="mb-4 text-lg font-bold text-slate-900">{labels.quickActions}</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/data-entry/${currentSeason.year}/${currentSeason.season}/${currentSeason._id}`
                    )
                  }
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  {labels.continueEntry}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/comparison')}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  {labels.seasonComparison}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/alerts')}
                  className="rounded-2xl bg-emerald-700 px-6 py-4 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  {labels.viewAlerts}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
