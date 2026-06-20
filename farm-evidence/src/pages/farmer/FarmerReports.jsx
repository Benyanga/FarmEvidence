import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, ClipboardCopy, ArrowRight, ChevronDown } from 'lucide-react';
import { useTrialContext } from '../../context/TrialContext';

const LABELS = {
  en: {
    title: 'Farmer Report',
    subtitle: 'Single-season summary for your farm.',
    seasonPicker: 'Select season',
    cover: 'Report cover',
    farmName: 'Farm name',
    owner: 'Owner',
    location: 'Location',
    season: 'Season',
    crop: 'Crop',
    date: 'Date',
    costSummary: 'Cost Summary',
    inputCosts: 'Input costs',
    labourCosts: 'Labour costs',
    totalProductionCost: 'Total production cost',
    revenueProfit: 'Revenue & Profit',
    yield: 'Yield',
    marketPrice: 'Market price',
    grossRevenue: 'Gross revenue',
    netBenefit: 'Net benefit',
    bcr: 'Benefit-Cost Ratio',
    breakEven: 'Break-Even Analysis',
    breakEvenYield: 'Break-even yield / plot',
    breakEvenYieldHa: 'Break-even yield / ha',
    actualYield: 'Actual yield',
    marginOfSafety: 'Margin of safety',
    breakEvenPrice: 'Break-even price',
    marketPriceLabel: 'Market price',
    farmConditions: 'Farm conditions',
    phaseMessage: 'Phase & Message',
    phase: 'Phase',
    csi: 'CSI',
    farmerMessage: 'Farmer message',
    footer: 'FarmEvidence · Farmer Mode · Generated',
    download: 'Download PDF',
    share: 'Share Summary',
    loading: 'Loading report…',
    noFarm: 'No active farm selected. Choose a farm to view a report.',
    errorFetch: 'Unable to load report data. Please try again.',
    conditionsHint: 'Agronomic indicators for this season',
    rainfall: 'Rainfall',
    soilOm: 'Soil organic matter',
    residue: 'Residue cover',
    weedPressure: 'Weed pressure',
    farmerSkill: 'Farmer skill',
    equipment: 'Equipment readiness',
    csiScore: 'Composite CSI',
    copied: 'Summary copied to clipboard',
    selectSeason: 'Season',
    noSeasons: 'No season records found for this farm.',
    noAnalysis: 'No analysis available for the selected season.',
  },
  kin: {
    title: 'Raporo y\'Umuhinzi',
    subtitle: 'Ibisubizo by\'igihembwe kimwe ku butaka bwawe.',
    seasonPicker: 'Hitamo igihembwe',
    cover: 'Ipaji y\'imbere',
    farmName: 'Izina ry\'ubutaka',
    owner: 'Nyir\'ubutaka',
    location: 'Aho giherereye',
    season: 'Igihembwe',
    crop: 'Umusaruro',
    date: 'Itariki',
    costSummary: 'Iby\'يkoreshwa by\'igiciro',
    inputCosts: 'Amafaranga y\'ibiribwa',
    labourCosts: 'Amafaranga y\'akazi',
    totalProductionCost: 'Igiciro cy\'umusaruro wose',
    revenueProfit: 'Inyungu & Umusaruro',
    yield: 'Umusaruro',
    marketPrice: 'Igiciro ku isoko',
    grossRevenue: 'Amafaranga yose',
    netBenefit: 'Inyungu nyayo',
    bcr: 'Igipimo cy\'Inyungu ku Gishoro',
    breakEven: 'Isesengura rya Break-Even',
    breakEvenYield: 'Umusaruro wa break-even / isigaye',
    breakEvenYieldHa: 'Umusaruro wa break-even / ha',
    actualYield: 'Umusaruro nyawo',
    marginOfSafety: 'Urwego rw\'umutekano',
    breakEvenPrice: 'Igiciro cya break-even',
    marketPriceLabel: 'Igiciro cyo ku isoko',
    farmConditions: 'Imiterere y\'ubutaka',
    phaseMessage: 'Icyiciro & Ubutumwa',
    phase: 'Icyiciro',
    csi: 'CSI',
    farmerMessage: 'Ubutumwa bw\'umuhinzi',
    footer: 'FarmEvidence · Farmer Mode · Byakozwe',
    download: 'Kuramo PDF',
    share: 'Sangira raporo',
    loading: 'Birimo gupakurura raporo…',
    noFarm: 'Nta butaka bwatoranijwe. Hitamo ubutaka urebe raporo.',
    errorFetch: 'Ntibyashobotse kubona raporo. Ongera ugerageze.',
    conditionsHint: 'Ibipimo by\'ubuhinzi kuri iki gihembwe',
    rainfall: 'Imvura',
    soilOm: 'UMWERO w\'ubutaka',
    residue: 'Ubushuhe bw\'amasazi',
    weedPressure: 'Umuvuduko w\'ibyatsi',
    farmerSkill: 'Ubumenyi bw\'umuhinzi',
    equipment: 'Ibikoresho byiteguye',
    csiScore: 'CSI rusange',
    copied: 'Raporo yanditswe muri clipboard',
    selectSeason: 'Igihembwe',
    noSeasons: 'Nta mateka y\'ibihembwe yabonetse kuri ubu butaka.',
    noAnalysis: 'Nta n\'isesengura riri kuri iki gihembwe.',
  },
};

function fmtCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${Math.round(Number(value)).toLocaleString()} RWF`;
}

function fmtNumber(value, decimals = 1) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(decimals);
}

function fmtKg(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${Math.round(Number(value)).toLocaleString()} kg`;
}

function fmtPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${Number(value * 100).toFixed(1)}%`;
}

export default function FarmerReports() {
  const { activeFarm, lang } = useTrialContext();
  const labels = LABELS[lang === 'kin' ? 'kin' : 'en'];
  const farmId = activeFarm?._id ?? activeFarm?.recordId ?? activeFarm?.id;

  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  const seasonRef = useMemo(() => {
    if (!selectedSeason) return null;
    return `${selectedSeason.season}-${selectedSeason.year}`;
  }, [selectedSeason]);

  const sortSeasons = (list) => [...list].sort((a, b) => {
    const yearA = Number(a.year);
    const yearB = Number(b.year);
    if (yearA !== yearB) return yearB - yearA;
    return String(b.season).localeCompare(String(a.season));
  });

  const loadSeasons = useCallback(async () => {
    if (!farmId) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/farms/${farmId}/seasons`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const sorted = sortSeasons(list);
      setSeasons(sorted);
      if (!selectedSeason && sorted.length > 0) {
        setSelectedSeason(sorted[0]);
      } else if (selectedSeason) {
        const preserved = sorted.find((item) => item.year === selectedSeason.year && item.season === selectedSeason.season);
        if (!preserved && sorted.length > 0) setSelectedSeason(sorted[0]);
      }
    } catch (err) {
      setError(labels.errorFetch);
    } finally {
      setLoading(false);
    }
  }, [farmId, labels.errorFetch, selectedSeason]);

  const loadAnalysis = useCallback(async () => {
    if (!farmId || !selectedSeason) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/farm-analysis/${farmId}/${selectedSeason.year}/${selectedSeason.season}`);
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAnalysis(data);
    } catch (err) {
      console.error('[FarmerReports] loadAnalysis error', err);
      setError(labels.errorFetch);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [farmId, labels.errorFetch, selectedSeason]);

  useEffect(() => {
    loadSeasons();
  }, [loadSeasons]);

  useEffect(() => {
    if (selectedSeason) loadAnalysis();
  }, [selectedSeason, loadAnalysis]);

  const handleSeasonChange = (event) => {
    const [season, year] = event.target.value.split('_');
    const nextSeason = seasons.find((item) => String(item.season) === season && String(item.year) === year);
    if (nextSeason) setSelectedSeason(nextSeason);
  };

  const handleCopySummary = async () => {
    if (!analysis || !selectedSeason) return;
    const summaryLines = [
      `${labels.title}: ${analysis.farm?.farmName || labels.farmName}`,
      `${labels.season}: ${selectedSeason.season} ${selectedSeason.year}`,
      `${labels.crop}: ${selectedSeason.crop || '—'}`,
      `${labels.totalProductionCost}: ${fmtCurrency(analysis.record?.tpc)}`,
      `${labels.grossRevenue}: ${fmtCurrency(analysis.record?.grossRev)}`,
      `${labels.netBenefit}: ${fmtCurrency(analysis.record?.netBenefit)}`,
      `${labels.bcr}: ${fmtNumber(analysis.record?.bcr, 2)}`,
      `${labels.phase}: ${analysis.phase || '—'}`,
      `${labels.csi}: ${fmtNumber(analysis.csi, 2)}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summaryLines);
      setCopyStatus(labels.copied);
      window.setTimeout(() => setCopyStatus(''), 2500);
    } catch (err) {
      console.error('[FarmerReports] copy error', err);
    }
  };

  const marketPrice = useMemo(() => {
    if (!analysis?.record) return null;
    const price = analysis.record.yieldKg && analysis.record.yieldKg > 0
      ? analysis.record.grossRev / analysis.record.yieldKg
      : null;
    return price;
  }, [analysis]);

  const conditionRows = useMemo(() => {
    const c = analysis?.farm || {};
    return [
      { label: labels.rainfall, value: c.csi_j1 },
      { label: labels.soilOm, value: c.csi_j2 },
      { label: labels.residue, value: c.csi_j3 },
      { label: labels.weedPressure, value: c.csi_j4 },
      { label: labels.farmerSkill, value: c.csi_j5 },
      { label: labels.equipment, value: c.csi_j6 },
      { label: labels.csiScore, value: analysis?.csi },
    ];
  }, [analysis, labels]);

  const reportDate = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-page { width: 210mm; min-height: 297mm; margin: auto; box-shadow: none; }
          .page-break { page-break-after: always; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm no-print">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">{labels.title}</h1>
              <p className="mt-2 text-sm text-slate-600">{labels.subtitle}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                {labels.download}
              </button>
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:border-slate-300"
              >
                <ClipboardCopy className="h-4 w-4" />
                {labels.share}
              </button>
            </div>
          </div>
          {copyStatus ? (
            <p className="mt-4 text-sm text-emerald-700">{copyStatus}</p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm no-print">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
            {labels.seasonPicker}
            <div className="relative inline-flex w-full max-w-xs items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus-within:border-emerald-500">
              <select
                value={selectedSeason ? `${selectedSeason.season}_${selectedSeason.year}` : ''}
                onChange={handleSeasonChange}
                className="w-full bg-transparent text-sm outline-none"
              >
                {seasons.length === 0 && (
                  <option value="">{labels.noSeasons}</option>
                )}
                {seasons.map((season) => (
                  <option
                    key={`${season.season}_${season.year}`}
                    value={`${season.season}_${season.year}`}
                  >
                    {`${season.season} ${season.year}`} {season.crop ? `- ${season.crop}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </div>
          </label>
        </div>

        <div className="report-sheet rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="space-y-10">
            {/* Cover */}
            <section className="rounded-[2rem] border border-slate-200 p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500">{labels.cover}</p>
                  <h2 className="mt-4 text-4xl font-bold text-slate-900">{analysis?.farm?.farmName || activeFarm?.farmName || labels.farmName}</h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                    {analysis?.farm?.ownerName ? `${labels.owner}: ${analysis.farm.ownerName}` : ''}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-700">
                  <p><span className="font-semibold">{labels.location}:</span> {analysis?.farm?.location || analysis?.farm?.district || '—'}</p>
                  <p className="mt-3"><span className="font-semibold">{labels.season}:</span> {selectedSeason ? `${selectedSeason.season} ${selectedSeason.year}` : '—'}</p>
                  <p className="mt-3"><span className="font-semibold">{labels.crop}:</span> {selectedSeason?.crop || analysis?.season?.crop || '—'}</p>
                  <p className="mt-3"><span className="font-semibold">{labels.date}:</span> {reportDate}</p>
                </div>
              </div>
            </section>

            {error ? (
              <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-rose-700">
                <p>{labels.errorFetch}</p>
              </div>
            ) : !analysis ? (
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-slate-700">
                <p>{labels.noAnalysis}</p>
              </div>
            ) : (
              <> 
                <section className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
                    <h3 className="text-xl font-semibold text-slate-900">{labels.costSummary}</h3>
                    <div className="mt-6 space-y-4 text-sm text-slate-700">
                      <div className="flex justify-between border-b border-slate-200 pb-3">
                        <span>{labels.inputCosts}</span>
                        <span>{fmtCurrency(analysis.record?.inputCostTotal)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-3">
                        <span>{labels.labourCosts}</span>
                        <span>{fmtCurrency(analysis.record?.labourCostTotal)}</span>
                      </div>
                      <div className="flex justify-between pt-3 text-base font-semibold text-slate-900">
                        <span>{labels.totalProductionCost}</span>
                        <span>{fmtCurrency(analysis.record?.tpc)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
                    <h3 className="text-xl font-semibold text-slate-900">{labels.revenueProfit}</h3>
                    <div className="mt-6 space-y-4 text-sm text-slate-700">
                      <div className="flex justify-between border-b border-slate-200 pb-3">
                        <span>{labels.yield}</span>
                        <span>{fmtKg(analysis.record?.yieldKg)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-3">
                        <span>{labels.marketPrice}</span>
                        <span>{marketPrice ? fmtCurrency(marketPrice) : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-3">
                        <span>{labels.grossRevenue}</span>
                        <span>{fmtCurrency(analysis.record?.grossRev)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-3">
                        <span>{labels.netBenefit}</span>
                        <span>{fmtCurrency(analysis.record?.netBenefit)}</span>
                      </div>
                      <div className="flex justify-between pt-3 text-base font-semibold text-slate-900">
                        <span>{labels.bcr}</span>
                        <span>{analysis.record?.bcr != null ? Number(analysis.record.bcr).toFixed(2) : '—'}</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
                    <h3 className="text-xl font-semibold text-slate-900">{labels.breakEven}</h3>
                    <div className="mt-6 space-y-4 text-sm text-slate-700">
                      <div className="flex justify-between border-b border-slate-200 pb-3">
                        <span>{labels.breakEvenYield}</span>
                        <span>{fmtKg(analysis.breakEven?.beYieldPlot)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-3">
                        <span>{labels.breakEvenYieldHa}</span>
                        <span>{fmtKg(analysis.breakEven?.beYieldHa)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-3">
                        <span>{labels.actualYield}</span>
                        <span>{fmtKg(analysis.breakEven?.actualYield)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-3">
                        <span>{labels.marginOfSafety}</span>
                        <span>{analysis.breakEven?.yieldMoS != null ? fmtPercent(analysis.breakEven.yieldMoS) : '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-3">
                        <span>{labels.breakEvenPrice}</span>
                        <span>{analysis.breakEven?.bePricePlot != null ? fmtCurrency(analysis.breakEven.bePricePlot) : '—'}</span>
                      </div>
                      <div className="flex justify-between pt-3 text-base font-semibold text-slate-900">
                        <span>{labels.marketPriceLabel}</span>
                        <span>{analysis.breakEven?.marketPrice != null ? fmtCurrency(analysis.breakEven.marketPrice) : '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
                    <h3 className="text-xl font-semibold text-slate-900">{labels.farmConditions}</h3>
                    <p className="mt-3 text-sm text-slate-600">{labels.conditionsHint}</p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {conditionRows.map((row) => (
                        <div key={row.label} className="rounded-3xl bg-white p-4 shadow-sm">
                          <p className="text-sm text-slate-500">{row.label}</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{row.value != null ? fmtNumber(row.value, row.label === labels.csiScore ? 2 : 1) : '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
                  <h3 className="text-xl font-semibold text-slate-900">{labels.phaseMessage}</h3>
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{labels.phase}</p>
                      <p className="mt-3 text-2xl font-semibold text-slate-900">{analysis.phase || '—'}</p>
                      <p className="mt-3 text-sm text-slate-600">{analysis.csiInterpretation?.label || ''}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{labels.csi}</p>
                      <p className="mt-3 text-2xl font-semibold text-slate-900">{fmtNumber(analysis.csi, 2)}</p>
                      <p className="mt-3 text-sm text-slate-600">{analysis.csiInterpretation?.description || ''}</p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">{labels.farmerMessage}</p>
                    <p className="mt-3 text-sm leading-7">{analysis.farmerMessage || '—'}</p>
                  </div>
                </section>
              </>
            )}

            <footer className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              {labels.footer} {reportDate}
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
