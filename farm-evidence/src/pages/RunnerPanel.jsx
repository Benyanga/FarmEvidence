import { useComputationStore } from "../store/computationStore";
import { useDataStore } from "../store/dataStore";
import { useSessionStore } from "../store/sessionStore";
import { seedDemoFarmAndTrial, seedAndRunAnalyses, seedRichDemoData } from "../utils/devSeeder";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { saveCloudState } from "../utils/cloudApi";

const hasClerk = !["pk_test_replace_me", "pk_test_your_publishable_key"].includes(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_replace_me",
);
const useAuth = hasClerk ? useClerkAuth : () => ({ getToken: async () => null });

const EMPTY_SEASON = {};
const EMPTY_COSTS = {};
const EMPTY_REVENUE = {};

export function RunnerPanel() {
  const { getToken } = useAuth();
  const mode = useSessionStore((s) => s.mode);
  const runAnalysis = useComputationStore((s) => s.runAnalysis);
  const runRemoteAnalysis = useComputationStore((s) => s.runRemoteAnalysis);
  const status = useComputationStore((s) => s.computationStatus);
  const errors = useComputationStore((s) => s.errors);
  const updateSeason = useDataStore((s) => s.updateSeason);
  const autosave = useDataStore((s) => s.autosave);
  const saveComputation = useComputationStore((s) => s.saveToLocal);
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const recordKey = activeFarm?.recordId ?? seasonKey;
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const setup = useDataStore((s) => s.setup);
  const currentSeason = season ?? EMPTY_SEASON;
  const seasonCosts = currentSeason.costs ?? EMPTY_COSTS;
  const seasonRevenue = currentSeason.revenue ?? EMPTY_REVENUE;
  const seasonCsi = currentSeason.csiScores;


  // Prepare costs from economicRecords or use stored arrays
  const inputCostRecords = currentSeason.inputCosts || [];
  const labourCostRecords = currentSeason.labourCosts || [];
  
  // Convert cost records to computation format: { amount, costType }
  const inputCosts = inputCostRecords.map(record => ({
    description: record.description || record.item || 'Input cost',
    amount: record.amount ?? record.cost ?? record.totalPlotRwf ?? (Number(record.quantity || 0) * Number(record.unitCost || 0)),
    costType: record.costType || 'C_SD',
  }));
  
  const labourCosts = labourCostRecords.map(record => ({
    description: record.description || record.item || 'Labour cost',
    amount: record.amount ?? record.cost ?? record.totalPlotRwf ?? 0,
    costType: record.costType || 'C_SD',
  }));

  const sessionData = {
    inputCosts,
    labourCosts,
    revenue: {
      yield_kg_ha: seasonRevenue.yield_kg_ha,
      sellingPrice: seasonRevenue.sellingPrice,
    },
    csiScores: seasonCsi,
    system: setup.system,
    previousSystem: currentSeason.previousSystem,
    previousProfit: currentSeason.previousProfit,
    adoptionCostHistory: currentSeason.adoptionCostHistory,
    trendMetrics: currentSeason.trendMetrics,
    profitHistory: currentSeason.profitHistory,
    yieldHistory: currentSeason.yieldHistory,
    CPUHistory: currentSeason.CPUHistory ?? currentSeason.cpuHistory,
    laborCostHistory: currentSeason.laborCostHistory ?? currentSeason.laborHistory,
    profitCA_history: currentSeason.profitCA_history,
    profitCF_history: currentSeason.profitCF_history,
    scenarioProfits: currentSeason.scenarioProfits,
    meanProfitCF: currentSeason.meanProfitCF,
    plotProfits: currentSeason.plotProfits,
    stats: currentSeason.stats,
    ruleFlags: currentSeason.ruleFlags,
    language: setup.language,
    seasonsElapsed:
      currentSeason.seasonsElapsed ??
      (setup.currentSeason && setup.adoptionStartSeason
        ? Number(setup.currentSeason) - Number(setup.adoptionStartSeason)
        : 1),
    trendValues:
      currentSeason.trendMetrics?.profit ??
      currentSeason.profitHistory ??
      [seasonRevenue.yield_kg_ha ?? 0, (seasonRevenue.yield_kg_ha ?? 0) * 1.1, (seasonRevenue.yield_kg_ha ?? 0) * 1.2],
    comparisonContext: {
      farmName: setup.farmName,
      siteIdentifier: setup.siteIdentifier,
      seasonReference: setup.seasonReference ?? currentSeason.seasonReference,
      seasonId: seasonKey,
      system: setup.system,
    },
  };
  const runCurrent = () => runAnalysis(recordKey, sessionData, mode);
  const runRemote = async () => {
    const token = await getToken();
    if (!token) {
      console.warn("Remote computation requires authentication.");
      return;
    }
    await runRemoteAnalysis(recordKey, sessionData, mode, token);
  };
  const syncCloud = async () => {
    const token = await getToken();
    if (!token) return;
    await saveCloudState(token, {
      setup,
      seasons: useDataStore.getState().seasons,
      computation: {
        results: useComputationStore.getState().results,
        explainabilityCards: useComputationStore.getState().explainabilityCards,
      },
    });
  };

  const seedSeason = () =>
    updateSeason(seasonKey, {
      inputCosts: [
        { description: 'Tillage', amount: 12000, costType: 'C_SD' },
        { description: 'Fertilizer', amount: 25000, costType: 'C_SD' },
        { description: 'Pesticide', amount: 8000, costType: 'C_SI' },
        { description: 'Irrigation', amount: 12000, costType: 'C_SI' },
        { description: 'Residue management', amount: 3000, costType: 'C_SD' },
      ],
      labourCosts: [
        { description: 'Land preparation', amount: 7000, costType: 'C_SD' },
        { description: 'Planting', amount: 3500, costType: 'C_SI' },
        { description: 'Weeding', amount: 10500, costType: 'C_SD' },
        { description: 'Harvesting', amount: 7000, costType: 'C_SI' },
        { description: 'Residue management', amount: 3500, costType: 'C_SD' },
      ],
      revenue: { yield_kg_ha: 1800, sellingPrice: 420 },
      adoptionCostHistory: [26000, 22000],
      trendMetrics: {
        profit: [180000, 190000, 205000],
        yield: [1500, 1600, 1800],
        CPU: [120, 115, 110],
        laborCost: [33000, 31000, 29500],
        weed: [2, 3, 4],
        soil: [3.0, 3.2, 3.5],
        adoptionCost: [26000, 22000],
      },
    });

  const seedDemoFarmAndTrialLocal = () => seedDemoFarmAndTrial('/analysis/trends');

  return (
    <div className="card">
      <h2 className="heading-2 mb-3">Runner</h2>
      <p className="body-md text-slate-600 mb-4">
        Runs analysis only after all validation gates pass. Research mode requires RCBD and treatment replication setup, while Farmer mode only needs valid plot setup and seasonal cost inputs.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-secondary" onClick={seedSeason}>Seed Season Data</button>
        <button type="button" className="btn btn-secondary" onClick={seedDemoFarmAndTrialLocal}>Seed Demo Trial</button>
        <button type="button" className="btn btn-primary" onClick={() => { seedAndRunAnalyses('/analysis/trends'); }}>Seed & Run Demo Analyses</button>
        <button type="button" className="btn btn-warning" onClick={() => { seedRichDemoData('/analysis/trends'); }}>Seed Rich Demo Data & Run</button>
        <button type="button" className={`btn btn-primary`} onClick={runCurrent}>Run Local Analysis</button>
        <button type="button" className={`btn ${hasClerk ? "btn-primary" : "btn-disabled"}`} disabled={!hasClerk} onClick={runRemote}>Run Backend Analysis</button>
        <button type="button" className="btn btn-secondary" onClick={() => { autosave(); saveComputation(); }}>Save Offline</button>
        <button type="button" className="btn btn-secondary" onClick={syncCloud}>Sync to Cloud</button>
      </div>
      <p className="body-sm mt-4">Status: <strong>{status}</strong></p>
      {errors.general ? <p className="body-sm state-alert mt-2">{errors.general}</p> : null}
    </div>
  );
}
