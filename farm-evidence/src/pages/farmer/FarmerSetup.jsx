import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Plus, X, AlertCircle } from 'lucide-react';
import { useTrialContext } from '../../context/TrialContext';
import { ScreenTopbar } from '../../components/shared/ScreenTopbar';

const YEARS = Array.from({ length: 25 }, (_, i) => 2026 + i).map(String);
const SEASONS = ['A', 'B', 'C'];

const CROP_SUGGESTIONS = ['Beans', 'Maize', 'Irish Potato', 'Cassava', 'Sorghum'];

const LABELS = {
  en: {
    setup: 'Setup',
    years: 'Years',
    seasons: 'Seasons',
    farms: 'Farms',
    newFarm: 'New Farm',
    farmName: 'Farm Name',
    ownerName: 'Owner Name',
    location: 'Location',
    district: 'District',
    sector: 'Sector',
    totalArea: 'Total Area (ha)',
    language: 'Language Preference',
    english: 'English',
    kinyarwanda: 'Kinyarwanda',
    thisSeasonCrop: "This Season's Crop",
    crop: 'Crop',
    plotSize: 'Plot Size (m²)',
    economicDefaults: 'Economic Defaults',
    marketPrice: 'Market Price (RWF/kg)',
    wageRate: 'Wage Rate (RWF/day)',
    workingHours: 'Working Hours/Day',
    conservationPractices: 'Conservation Practices',
    adoptionStart: 'Adoption Start Season',
    adoptionCost: 'Initial Adoption Cost (RWF)',
    farmConditions: 'Your Farm Conditions',
    rainfall: 'How reliable is rainfall on your farm?',
    soil: 'How healthy/dark is your soil?',
    residue: 'How much crop residue/mulch do you have available?',
    weeds: 'How much of a problem are weeds on your farm?',
    confidence: 'How confident are you in conservation farming techniques?',
    tools: 'Do you have access to the tools/equipment you need?',
    createFarm: 'Create Farm',
    cancel: 'Cancel',
    backToSeasons: 'Back to Seasons',
    backToYears: 'Back to Years',
    noDataThisSeason: 'No data for this season yet',
    addSeasonData: 'Add Data for',
    registerNewFarm: 'Register New Farm',
    openDataEntry: 'Open in Data Entry',
    complete: 'Complete',
    inProgress: 'In Progress',
    createdLabel: 'Created',
    selectCrop: 'Select or enter crop',
    selectPlotSize: 'Plot size for data entry',
    required: 'Required',
    confirmAdd: 'Add Season',
    close: 'Close',
  },
  kin: {
    setup: 'Igenamiterere',
    years: 'Imyaka',
    seasons: 'Ibihembwe',
    farms: 'Ubutaka',
    newFarm: 'Ubutaka Bushya',
    farmName: 'Izina ry\'ubutaka',
    ownerName: 'Izina ry\'umwami',
    location: 'Ubwanya',
    district: 'Akarere',
    sector: 'Umurenge',
    totalArea: 'Ubunini bukeye (ha)',
    language: 'Ururimi',
    english: 'Icyongereza',
    kinyarwanda: 'Ikinyarwanda',
    thisSeasonCrop: 'Mugira Mwuyu: Ibigira',
    crop: 'Igigira',
    plotSize: 'Ubunini bw\'imera (m²)',
    economicDefaults: 'Ibigenererwamo By\'Amakuru y\'Ibikorwa',
    marketPrice: 'Igiciro cy\'isoko (RWF/kg)',
    wageRate: 'Igiciro cy\'akazi (RWF/umunsi)',
    workingHours: 'Isaha z\'akazi buri munsi',
    conservationPractices: 'Ingamba z\'Kwirinda Ibisagara',
    adoptionStart: 'Mugira Cyatandukanya',
    adoptionCost: 'Ikipimo cy\'Itangiriro (RWF)',
    farmConditions: 'Uko Ubutaka Bwanjye Biri',
    rainfall: 'Igihe cy\'amavuta akunze?',
    soil: 'Uko ijoro rikunze kandi risikira?',
    residue: 'Ubunini bw\'ibigira cy\'akaborozi ufite?',
    weeds: 'Uko ibinyabwoba byaba ibibazo?',
    confidence: 'Wizeye gute mu mbogamizi?',
    tools: 'Ufite ibikoresho ukeneye?',
    createFarm: 'Igenera Ubutaka',
    cancel: 'Guhagarika',
    backToSeasons: 'Gusubira Mu Bihembwe',
    backToYears: 'Gusubira Mu Myaka',
    noDataThisSeason: 'Nta makuru mu mahara.',
    addSeasonData: 'Yongera Amakuru',
    registerNewFarm: 'Injizamo Ubutaka Bushya',
    openDataEntry: 'Gufungura mu Kwinjiza Amakuru',
    complete: 'Yopoze',
    inProgress: 'Ikirudi',
    createdLabel: 'Byakozwe',
    selectCrop: 'Hitamo cyangwa andika igigira',
    selectPlotSize: 'Ubunini bw\'imera',
    required: 'Ikintu kigamije',
    confirmAdd: 'Yongera Mahara',
    close: 'Funga',
  },
};

function YearListView() {
  const navigate = useNavigate();
  const { lang } = useTrialContext();
  const labels = LABELS[lang === 'kin' ? 'kin' : 'en'];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText={labels.setup}
        title={labels.years}
        meta="Select a year to explore seasons and farms."
        status="Ready"
        statusTone="synced"
      />

      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{labels.years}</h2>
            <p className="mt-2 text-sm text-slate-600">Select a year to view or create farms.</p>
          </div>
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-5">
            {YEARS.map((yearLabel) => (
              <button
                key={yearLabel}
                type="button"
                onClick={() => navigate(`/setup/${yearLabel}`)}
                className="group rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-2xl font-semibold text-slate-900">{yearLabel}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SeasonListView({ year }) {
  const navigate = useNavigate();
  const { lang } = useTrialContext();
  const labels = LABELS[lang === 'kin' ? 'kin' : 'en'];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText={labels.setup}
        title={`${labels.seasons} for ${year}`}
        meta="Choose a season to review or create farms."
        status="Ready"
        statusTone="synced"
      />

      <div className="mx-auto max-w-7xl space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <button
            type="button"
            onClick={() => navigate('/setup')}
            className="font-semibold text-slate-900 hover:text-emerald-700"
          >
            {labels.setup}
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-slate-900">{year}</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {SEASONS.map((seasonKey) => (
            <button
              key={seasonKey}
              type="button"
              onClick={() => navigate(`/setup/${year}/${seasonKey}`)}
              className="group rounded-[2rem] border border-slate-200 bg-white p-8 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-xl font-semibold text-slate-900">Season {seasonKey}</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate('/setup')}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          {labels.backToYears}
        </button>
      </div>
    </div>
  );
}

function FarmsListView({ year, season }) {
  const navigate = useNavigate();
  const { lang, setActiveFarm } = useTrialContext();
  const labels = LABELS[lang === 'kin' ? 'kin' : 'en'];

  const [farms, setFarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFarmForSeason, setSelectedFarmForSeason] = useState(null);
  const [seasonCrop, setSeasonCrop] = useState('');
  const [seasonPlotSize, setSeasonPlotSize] = useState(100);
  const [isSubmittingSeason, setIsSubmittingSeason] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError('');
    fetch(`/api/farms?year=${year}&season=${season}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setFarms(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.message || 'Failed to load farms'))
      .finally(() => setIsLoading(false));
  }, [year, season]);

  const handleAddSeasonToFarm = async () => {
    if (!selectedFarmForSeason || !seasonCrop.trim()) return;
    setIsSubmittingSeason(true);
    try {
      const res = await fetch(`/api/farms/${selectedFarmForSeason._id}/seasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: Number(year),
          season,
          crop: seasonCrop.trim(),
          plotSizeM2: Number(seasonPlotSize),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSelectedFarmForSeason(null);
      setSeasonCrop('');
      setSeasonPlotSize(100);
      // Refresh farms list
      const refreshRes = await fetch(`/api/farms?year=${year}&season=${season}`);
      const refreshData = await refreshRes.json();
      setFarms(Array.isArray(refreshData) ? refreshData : []);
    } catch (err) {
      setError(err.message || 'Failed to add season data');
    } finally {
      setIsSubmittingSeason(false);
    }
  };

  const openDataEntry = (farm) => {
    setActiveFarm(farm);
    const recordId = farm.seasonRecordId || farm._id;
    navigate(`/data-entry/${year}/${season}/${recordId}`);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText={labels.setup}
        title={`Farms for Season ${season} ${year}`}
        meta="View farms or register a new one for this season."
        status="Ready"
        statusTone="synced"
      />

      <div className="mx-auto max-w-7xl space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <button
            type="button"
            onClick={() => navigate('/setup')}
            className="font-semibold text-slate-900 hover:text-emerald-700"
          >
            {labels.setup}
          </button>
          <ChevronRight className="h-4 w-4" />
          <button
            type="button"
            onClick={() => navigate(`/setup/${year}`)}
            className="font-semibold text-slate-900 hover:text-emerald-700"
          >
            {year}
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-slate-900">Season {season}</span>
        </div>

        {error && (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-slate-600">Loading farms...</div>
        ) : farms.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-600">No farms yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {farms.map((farm) => (
              <div key={farm._id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">{farm.farmName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{farm.ownerName ? `${farm.ownerName} • ` : ''}{farm.location}</p>
                  {farm.createdYear && farm.createdSeason && (farm.createdYear !== year || farm.createdSeason !== season) && (
                    <p className="mt-1 text-xs text-slate-500">
                      {labels.createdLabel}: {farm.createdSeason} {farm.createdYear}
                    </p>
                  )}
                </div>

                <div className="mb-4 space-y-2">
                  {farm.hasSeasonRecord ? (
                    <>
                      <div className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Season {season} {year}: {farm.seasonCrop || 'Crop not set'}
                      </div>
                      <div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            farm.seasonComplete
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {farm.seasonComplete ? labels.complete : labels.inProgress}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openDataEntry(farm)}
                        className="mt-4 w-full rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                      >
                        {labels.openDataEntry}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {labels.noDataThisSeason}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFarmForSeason(farm);
                          setSeasonCrop('');
                          setSeasonPlotSize(farm.defaultPlotSizeM2 || 100);
                        }}
                        className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                      >
                        + {labels.addSeasonData} {season} {year}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(`/setup/${year}/${season}/new`)}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          <Plus className="h-5 w-5" />
          {labels.registerNewFarm}
        </button>

        <button
          type="button"
          onClick={() => navigate(`/setup/${year}`)}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          {labels.backToSeasons}
        </button>

        {/* Add Season Modal */}
        {selectedFarmForSeason && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  {labels.addSeasonData} {season} {year}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedFarmForSeason(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">{labels.crop} *</span>
                  <select
                    value={seasonCrop}
                    onChange={(e) => setSeasonCrop(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="">{labels.selectCrop}</option>
                    {CROP_SUGGESTIONS.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom crop..."
                    value={seasonCrop}
                    onChange={(e) => setSeasonCrop(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">{labels.plotSize}</span>
                  <input
                    type="number"
                    value={seasonPlotSize}
                    onChange={(e) => setSeasonPlotSize(Number(e.target.value))}
                    min="1"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedFarmForSeason(null)}
                  className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  {labels.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleAddSeasonToFarm}
                  disabled={!seasonCrop.trim() || isSubmittingSeason}
                  className="flex-1 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isSubmittingSeason ? 'Adding...' : labels.confirmAdd}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateFarmView({ year, season }) {
  const navigate = useNavigate();
  const { lang, setActiveFarm, user } = useTrialContext();
  const labels = LABELS[lang === 'kin' ? 'kin' : 'en'];

  const [form, setForm] = useState({
    farmName: '',
    ownerName: '',
    location: '',
    district: '',
    sector: '',
    totalAreaHa: '',
    language: lang === 'kin' ? 'kin' : 'en',
    crop: '',
    plotSizeM2: user?.defaultPlotSizeM2 ?? 100,
    marketPriceRWF: user?.defaultMarketPriceRWF ?? 1200,
    wageRateRWF: user?.defaultWageRateRWF ?? 1500,
    workingHoursPerDay: user?.defaultWorkingHoursPerDay ?? 8,
    adoptionStartSeason: 1,
    adoptionCostInitial: 0,
    csi_j1: 0.5,
    csi_j2: 0.5,
    csi_j3: 0.5,
    csi_j4: 0.5,
    csi_j5: 0.5,
    csi_j6: 0.5,
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      marketPriceRWF: current.marketPriceRWF === 1200 ? user.defaultMarketPriceRWF ?? 1200 : current.marketPriceRWF,
      wageRateRWF: current.wageRateRWF === 1500 ? user.defaultWageRateRWF ?? 1500 : current.wageRateRWF,
      workingHoursPerDay: current.workingHoursPerDay === 8 ? user.defaultWorkingHoursPerDay ?? 8 : current.workingHoursPerDay,
      plotSizeM2: current.plotSizeM2 === 100 ? user.defaultPlotSizeM2 ?? 100 : current.plotSizeM2,
    }));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.farmName.trim()) nextErrors.farmName = labels.required;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    setError('');
    try {
      const payload = {
        farmName: form.farmName.trim(),
        ownerName: form.ownerName.trim(),
        location: form.location.trim(),
        district: form.district.trim(),
        sector: form.sector.trim(),
        totalAreaHa: form.totalAreaHa ? Number(form.totalAreaHa) : null,
        language: form.language,
        createdYear: Number(year),
        createdSeason: season,
        defaultMarketPriceRWF: Number(form.marketPriceRWF),
        defaultWageRateRWF: Number(form.wageRateRWF),
        defaultWorkingHoursPerDay: Number(form.workingHoursPerDay),
        defaultPlotSizeM2: Number(form.plotSizeM2),
        adoptionStartSeason: Number(form.adoptionStartSeason),
        adoptionCostInitial: Number(form.adoptionCostInitial),
        csi_j1: parseFloat(form.csi_j1),
        csi_j2: parseFloat(form.csi_j2),
        csi_j3: parseFloat(form.csi_j3),
        csi_j4: parseFloat(form.csi_j4),
        csi_j5: parseFloat(form.csi_j5),
        csi_j6: parseFloat(form.csi_j6),
        firstSeasonCrop: form.crop.trim(),
      };

      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const farmId = data._id || data.id;
      setActiveFarm(data);

      // Fetch season record to get correct ID for data entry
      const seasonRes = await fetch(`/api/farms/${farmId}/seasons/${year}/${season}`);
      const seasonData = await seasonRes.json();
      const recordId = seasonData._id || seasonData.id || farmId;

      navigate(`/data-entry/${year}/${season}/${recordId}`);
    } catch (err) {
      setError(err.message || 'Failed to create farm');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = (fieldName) =>
    `mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
      errors[fieldName] ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
    }`;

  const csiSliders = [
    { key: 'csi_j1', label: labels.rainfall },
    { key: 'csi_j2', label: labels.soil },
    { key: 'csi_j3', label: labels.residue },
    { key: 'csi_j4', label: labels.weeds },
    { key: 'csi_j5', label: labels.confidence },
    { key: 'csi_j6', label: labels.tools },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText={labels.setup}
        title={labels.newFarm}
        meta="Register your farm and start collecting data."
        status={isSaving ? 'Saving…' : 'Ready'}
        statusTone={isSaving ? 'saving' : 'synced'}
      />

      <div className="mx-auto max-w-4xl space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <button
            type="button"
            onClick={() => navigate('/setup')}
            className="font-semibold text-slate-900 hover:text-emerald-700"
          >
            {labels.setup}
          </button>
          <ChevronRight className="h-4 w-4" />
          <button
            type="button"
            onClick={() => navigate(`/setup/${year}`)}
            className="font-semibold text-slate-900 hover:text-emerald-700"
          >
            {year}
          </button>
          <ChevronRight className="h-4 w-4" />
          <button
            type="button"
            onClick={() => navigate(`/setup/${year}/${season}`)}
            className="font-semibold text-slate-900 hover:text-emerald-700"
          >
            Season {season}
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-slate-900">{labels.newFarm}</span>
        </div>

        {error && (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Farm Identity */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">{labels.farmName}</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                { key: 'farmName', label: labels.farmName },
                { key: 'ownerName', label: labels.ownerName },
                { key: 'location', label: labels.location },
                { key: 'district', label: labels.district },
                { key: 'sector', label: labels.sector },
                { key: 'totalAreaHa', label: labels.totalArea, type: 'number' },
              ].map(({ key, label, type = 'text' }) => (
                <label key={key} className="block">
                  <span className="text-sm font-medium text-slate-700">
                    {label}
                    {key === 'farmName' && ' *'}
                  </span>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className={inputClasses(key)}
                  />
                  {errors[key] && <p className="mt-1 text-xs text-rose-600">{errors[key]}</p>}
                </label>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-slate-700 mb-3">{labels.language}</p>
              <div className="flex gap-3">
                {['en', 'kin'].map((langCode) => (
                  <button
                    key={langCode}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, language: langCode }))}
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                      form.language === langCode
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {langCode === 'en' ? labels.english : labels.kinyarwanda}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* This Season's Crop */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">{labels.thisSeasonCrop}</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">{labels.crop}</span>
                <select
                  value={form.crop}
                  onChange={(e) => setForm((f) => ({ ...f, crop: e.target.value }))}
                  className={inputClasses('crop')}
                >
                  <option value="">{labels.selectCrop}</option>
                  {CROP_SUGGESTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Or type custom crop..."
                  value={form.crop}
                  onChange={(e) => setForm((f) => ({ ...f, crop: e.target.value }))}
                  className={inputClasses('crop')}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">{labels.plotSize}</span>
                <input
                  type="number"
                  value={form.plotSizeM2}
                  onChange={(e) => setForm((f) => ({ ...f, plotSizeM2: Number(e.target.value) }))}
                  min="1"
                  className={inputClasses('plotSizeM2')}
                />
              </label>
            </div>
          </div>

          {/* Economic Defaults */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">{labels.economicDefaults}</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { key: 'marketPriceRWF', label: labels.marketPrice },
                { key: 'wageRateRWF', label: labels.wageRate },
                { key: 'workingHoursPerDay', label: labels.workingHours },
              ].map(({ key, label }) => (
                <label key={key} className="block">
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <input
                    type="number"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                    className={inputClasses(key)}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Conservation Practices */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">{labels.conservationPractices}</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">{labels.adoptionStart}</span>
                <p className="mt-1 text-xs text-slate-500">Which season did you start using conservation practices?</p>
                <input
                  type="number"
                  value={form.adoptionStartSeason}
                  onChange={(e) => setForm((f) => ({ ...f, adoptionStartSeason: Number(e.target.value) }))}
                  min="1"
                  className={inputClasses('adoptionStartSeason')}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">{labels.adoptionCost}</span>
                <p className="mt-1 text-xs text-slate-500">Cost of tools, training, materials (enter 0 if none)</p>
                <input
                  type="number"
                  value={form.adoptionCostInitial}
                  onChange={(e) => setForm((f) => ({ ...f, adoptionCostInitial: Number(e.target.value) }))}
                  min="0"
                  className={inputClasses('adoptionCostInitial')}
                />
              </label>
            </div>
          </div>

          {/* Farm Conditions (CSI Sliders) */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">{labels.farmConditions}</h3>
            <div className="space-y-6">
              {csiSliders.map(({ key, label }) => (
                <div key={key}>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">{label}</label>
                    <span className="text-sm font-semibold text-slate-900">{form[key].toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) }))}
                    className="mt-2 w-full"
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>Not at all</span>
                    <span>Very much</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(`/setup/${year}/${season}`)}
              className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              {labels.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : labels.createFarm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FarmerSetup() {
  const { year, season } = useParams();
  const navigate = useNavigate();

  const hasYear = Boolean(year);
  const hasSeason = Boolean(season);
  const isNew = season === 'new';

  if (!hasYear) return <YearListView />;
  if (!hasSeason) return <SeasonListView year={year} />;
  if (isNew) return <CreateFarmView year={year} season={season.replace('/new', '')} />;
  return <FarmsListView year={year} season={season} />;
}
