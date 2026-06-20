import { useDataStore } from "../store/dataStore";
import { useSessionStore } from "../store/sessionStore";
import { useComputationStore } from "../store/computationStore";
import { addEconomicRecord, addLabour, saveRevenue } from "../services/api.js";

import importedTrial from './importedTrial.js';

const DEMO_FARM_NAME = "Demo Farm";
const DEMO_TRIAL_NAME = "Demo Trial";
const DEMO_TRIAL_SITE = "Demo Research Trial";
const DEMO_CROP = "Maize";
const DEMO_SYSTEM = "Conservation Agriculture";
const BASE_SYSTEM = "Conventional Farming";
const DEMO_FARM_ID = "farm-demo-2026";
const TRIAL_TREATMENTS = ["CA", "CF"];
const TRIAL_REPLICATIONS = 4;
const PLOT_SELLING_PRICE = 400;
const PLOT_EXTRAPOLATION_FACTOR = 25;
const PLOT_LABOUR_DAYS = 1;
const PLOT_LABOUR_WAGE = 1200;

function now() {
  return new Date().toISOString();
}

function buildPlotIds(treatments, replications) {
  return treatments.flatMap((treatment) =>
    Array.from({ length: replications }, (_, index) => `${treatment}-R${index + 1}`),
  );
}

function buildRandomisationLayout(treatments, replications) {
  return Array.from({ length: replications }, (_, index) =>
    index % 2 === 0 ? [...treatments] : [...treatments].reverse(),
  );
}

function buildPlotStatuses(plotIds) {
  return plotIds.map((plotId) => ({ label: plotId, status: "Complete" }));
}

async function seedResearchTrialRecords(trialSeasonId, plotIds) {
  if (!trialSeasonId || !Array.isArray(plotIds) || plotIds.length === 0) return null;

  const seededRows = plotIds.map((plotId, index) => {
    const isCA = String(plotId).startsWith("CA");
    const caRevenues = [14400, 14350, 14500, 14400];
    const caCosts = [7920, 8000, 7900, 7950];
    const cfRevenues = [13200, 13150, 13300, 13250];
    const cfCosts = [7280, 7320, 7220, 7300];
    const revenuePerPlot = isCA ? caRevenues[index % caRevenues.length] : cfRevenues[index % cfRevenues.length];
    const economicCost = isCA ? caCosts[index % caCosts.length] : cfCosts[index % cfCosts.length];
    const yieldRawKg = revenuePerPlot / PLOT_SELLING_PRICE;
    return {
      plotId,
      treatment: isCA ? "CA" : "CF",
      revenuePerPlot,
      economicCost,
      labourCost: PLOT_LABOUR_WAGE,
      labourDays: PLOT_LABOUR_DAYS,
      sellingPrice: PLOT_SELLING_PRICE,
      yieldRawKg,
      profitPerPlot: revenuePerPlot - (economicCost + PLOT_LABOUR_WAGE),
    };
  });

  for (const entry of seededRows) {
    try {
      await saveRevenue({
        plot_id: entry.plotId,
        trial_season_id: trialSeasonId,
        yield_raw_kg: entry.yieldRawKg,
        selling_price_rwf_kg: entry.sellingPrice,
        mode: "research",
      });
    } catch (error) {
      console.warn("Failed to seed revenue record for plot", entry.plotId, error);
    }

    try {
      await addEconomicRecord({
        plot_id: entry.plotId,
        trial_season_id: trialSeasonId,
        entry_date: now(),
        item_activity: "Plot inputs",
        costType: "C_SD",
        sub_category: "Fertilizer",
        unit: "kg",
        quantity: entry.economicCost,
        unit_cost_rwf: 1,
        mode: "research",
      });
    } catch (error) {
      console.warn("Failed to seed economic record for plot", entry.plotId, error);
    }

    try {
      await addLabour({
        plot_id: entry.plotId,
        trial_season_id: trialSeasonId,
        entry_date: now(),
        activity: "Labour",
        description: "Labour cost",
        time_value: entry.labourDays,
        time_unit: "days",
        workers: 1,
        wage_per_day: entry.labourCost,
        cost_type: "C_SD",
      });
    } catch (error) {
      console.warn("Failed to seed labour record for plot", entry.plotId, error);
    }
  }

  return buildTrialDataFromRows(plotIds, seededRows);
}

function summaryStats(values = []) {
  const n = values.length;
  if (!n) return { mean: 0, sd: 0 };
  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / n;
  return {
    mean: Number(mean.toFixed(2)),
    sd: Number(Math.sqrt(variance).toFixed(2)),
  };
}

function buildTrialDataFromRows(plotIds, seededRows) {
  const plotSizeHa = 0.04;
  const plotSizeM2 = 400;
  const treatments = [...new Set(seededRows.map((row) => row.treatment))];
  const plots = seededRows.map((row) => ({
    plotId: row.plotId,
    treatment: row.treatment,
    replicate: row.plotId.includes("-") ? row.plotId.split("-")[1] : null,
    plot_size_m2: plotSizeM2,
    plot_size_ha: plotSizeHa,
    total_input_cost: row.economicCost,
    total_labour_cost: row.labourCost,
    labour_time_minutes: row.labourDays * 8 * 60,
    total_sd_cost: row.economicCost + row.labourCost,
    total_si_cost: 0,
    total_cost: row.economicCost + row.labourCost,
    selling_price_rwf_kg: row.sellingPrice,
    revenuePerPlot: row.revenuePerPlot,
    gross_margin_rwf_plot: row.profitPerPlot,
    yield_kg_plot: row.yieldRawKg,
    yield_kg_ha: row.yieldRawKg / plotSizeHa,
    value_rwf_m2: plotSizeM2 > 0 ? row.revenuePerPlot / plotSizeM2 : 0,
    value_rwf_ha: plotSizeHa > 0 ? row.revenuePerPlot / plotSizeHa : 0,
    net_benefit: row.profitPerPlot,
  }));

  const grouped = treatments.reduce((acc, treatment) => {
    const rows = plots.filter((plot) => plot.treatment === treatment);

    acc[treatment] = {
      rows,
      profits: rows.map((plot) => plot.net_benefit),
      revenueHa: rows.reduce((sum, plot) => sum + plot.value_rwf_ha, 0),
      costHa: rows.reduce((sum, plot) => sum + plot.total_cost, 0),
      yieldTotal: rows.reduce((sum, plot) => sum + plot.yield_kg_plot, 0),
    };
    return acc;
  }, {});

  const profit_ha = {};
  const revenue_ha = {};
  const c_system_ha = {};
  const cbr = {};
  const roi = {};
  const cpu = {};
  const treatment_stats = {};

  treatments.forEach((treatment) => {
    const group = grouped[treatment];
    profit_ha[treatment] = Math.round(group.profits.reduce((sum, value) => sum + value, 0) / group.rows.length / plotSizeHa);
    revenue_ha[treatment] = Math.round(group.revenueHa / group.rows.length / plotSizeHa);
    c_system_ha[treatment] = Math.round(group.costHa / group.rows.length / plotSizeHa);
    cbr[treatment] = group.costHa > 0 ? Math.round((group.revenueHa / Math.max(group.costHa, 1)) * 10) / 10 : 0;
    roi[treatment] = group.revenueHa > 0 ? Math.round(((group.revenueHa - group.costHa) / Math.max(group.revenueHa, 1)) * 100) / 100 : 0;
    cpu[treatment] = group.yieldTotal > 0 ? Math.round(group.costHa / group.yieldTotal) : 0;
    treatment_stats[treatment] = {
      yield_kg_ha: summaryStats(group.rows.map((r) => r.yield_kg_ha)),
      net_benefit: summaryStats(group.rows.map((r) => r.net_benefit)),
      total_cost: summaryStats(group.rows.map((r) => r.total_cost)),
    };
  });

  const delta_c = treatments.length >= 2
    ? Math.round(c_system_ha[treatments[0]] - c_system_ha[treatments[1]])
    : 0;
  const groupA = treatments.length >= 1 ? {
    label: treatments[0],
    n: grouped[treatments[0]].rows.length,
    mean: Number((grouped[treatments[0]].profits.reduce((sum, v) => sum + v, 0) / grouped[treatments[0]].rows.length).toFixed(2)),
    sd: summaryStats(grouped[treatments[0]].profits).sd,
  } : null;
  const groupB = treatments.length >= 2 ? {
    label: treatments[1],
    n: grouped[treatments[1]].rows.length,
    mean: Number((grouped[treatments[1]].profits.reduce((sum, v) => sum + v, 0) / grouped[treatments[1]].rows.length).toFixed(2)),
    sd: summaryStats(grouped[treatments[1]].profits).sd,
  } : null;

  return {
    treatments,
    profit_ha,
    revenue_ha,
    c_system_ha,
    cbr,
    roi,
    cpu,
    delta_c,
    p_value: 0.018,
    cohens_d: 0.75,
    t_stat: 3.24,
    df_welch: 6,
    plot_statuses: buildPlotStatuses(plotIds),
    hasData: true,
    plots,
    design_summary: {
      design: 'Randomized Complete Block Design (RCBD)',
      treatments,
      replicates: TRIAL_REPLICATIONS,
      total_plots: plotIds.length,
      plot_size_ha: plotSizeHa,
      plot_size_m2: plotSizeM2,
      statistical_test: 'Welch t-test (two-tailed)',
      significance_level: 0.05,
    },
    treatment_stats,
    statistics: {
      testType: 'Welch t-test (two-tailed)',
      decision: 'Significant (reject H0)',
      effect_size: 0.75,
      groupA,
      groupB,
      anova: null,
      p_value: 0.018,
      cohens_d: 0.75,
      t_stat: 3.24,
      df: 6,
      delta_c,
    },
  };
}

function buildTrialResults(plotIds) {
  return buildTrialDataFromRows(plotIds, plotIds.map((plotId, index) => {
    const isCA = String(plotId).startsWith("CA");
    const caRevenues = [14400, 14350, 14500, 14400];
    const caCosts = [7920, 8000, 7900, 7950];
    const cfRevenues = [13200, 13150, 13300, 13250];
    const cfCosts = [7280, 7320, 7220, 7300];
    const revenuePerPlot = isCA ? caRevenues[index % caRevenues.length] : cfRevenues[index % cfRevenues.length];
    const economicCost = isCA ? caCosts[index % caCosts.length] : cfCosts[index % cfCosts.length];
    const yieldRawKg = revenuePerPlot / PLOT_SELLING_PRICE;
    return {
      plotId,
      treatment: isCA ? "CA" : "CF",
      revenuePerPlot,
      economicCost,
      labourCost: PLOT_LABOUR_WAGE,
      labourDays: PLOT_LABOUR_DAYS,
      sellingPrice: PLOT_SELLING_PRICE,
      yieldRawKg,
      profitPerPlot: revenuePerPlot - (economicCost + PLOT_LABOUR_WAGE),
    };
  }));
}

export async function seedDemoFarmAndTrial(redirectTo = null) {
  const dataStore = useDataStore.getState();
  const sessionStore = useSessionStore.getState();
  const addYear = dataStore.addYear;
  const addFarmSeasonRecord = dataStore.addFarmSeasonRecord;
  const addFarmSeasonRecordRemote = dataStore.addFarmSeasonRecordRemote;
  const updateSeason = dataStore.updateSeason;
  const updateSetup = dataStore.updateSetup;
  const autosave = dataStore.autosave;
  const markComputationStale = dataStore.markComputationStale;

  addYear(2026);

  const trialPlotIds = buildPlotIds(TRIAL_TREATMENTS, TRIAL_REPLICATIONS);
  const trialLayout = buildRandomisationLayout(TRIAL_TREATMENTS, TRIAL_REPLICATIONS);
  const trialResults = buildTrialResults(trialPlotIds);

  const { localId: recA, remote: recARemote } = await addFarmSeasonRecordRemote({
    year: 2026,
    season: "A",
    farmName: DEMO_TRIAL_NAME,
    cropType: DEMO_CROP,
    farmingSystem: DEMO_SYSTEM,
    plot_m2: 400,
    plot_size_ha: 0.04,
    plot_size_m2: 400,
    total_plot_area_m2: 400 * trialPlotIds.length,
    total_plot_area_ha: 0.04 * trialPlotIds.length,
    treatment_area_m2: 400 * TRIAL_REPLICATIONS,
    treatment_area_ha: 0.04 * TRIAL_REPLICATIONS,
    plot_ids: trialPlotIds,
    plot_labels: trialPlotIds,
    randomisation_layout: trialLayout,
    randomisation_seed: "demo-trial-seed-2026",
    n_replications: TRIAL_REPLICATIONS,
    total_plots: trialPlotIds.length,
    treatments: TRIAL_TREATMENTS,
    stat_test: "T_TEST",
    site_name: DEMO_TRIAL_NAME,
    site_identifier: "DEMO-TRIAL-2026",
    location: "Demo research station",
    buffer_area_m2: 250,
    site_length_m: 40,
    site_width_m: 40,
    site_area_m2: 1600,
    site_area_ha: 0.16,
    extrapolation_factor: PLOT_EXTRAPOLATION_FACTOR,
    wage_rate_rwf_day: PLOT_LABOUR_WAGE,
    plotData: trialPlotIds.map((plotId) => ({
      plot_id: plotId,
      treatment: String(plotId).startsWith("CA") ? "CA" : "CF",
      yield_kg: String(plotId).startsWith("CA") ? 36 : 33,
      selling_price: PLOT_SELLING_PRICE,
      economic_cost: String(plotId).startsWith("CA") ? 7920 : 7280,
      labour_cost: PLOT_LABOUR_WAGE,
    })),
    status: "COMPLETE",
    treatment_descriptions: { CA: "Conservation Agriculture", CF: "Conventional Farming" },
    localTrialResults: trialResults,
    linkedFarmId: DEMO_FARM_ID,
  });

  const farmId = useDataStore.getState().farmSeasonRecords[recA].farmId;
  const recARemoteId = recARemote && (recARemote._id || recARemote.id);
  if (recARemoteId) {
    const seededResults = await seedResearchTrialRecords(recARemoteId, trialPlotIds);
    if (seededResults) {
      dataStore.updateFarmSeasonRecord(recA, { localTrialResults: seededResults });
    }
  }

  const recB = addFarmSeasonRecord({
    year: 2026,
    season: "B",
    farmName: DEMO_FARM_NAME,
    linkedFarmId: DEMO_FARM_ID,
    cropType: DEMO_CROP,
    farmingSystem: BASE_SYSTEM,
    plot_m2: 1000,
  });

  const setupName = sessionStore.mode === "RESEARCH" ? DEMO_TRIAL_NAME : DEMO_FARM_NAME;
  updateSetup({
    farmName: setupName,
    siteName: DEMO_TRIAL_SITE,
    siteIdentifier: "DF-2026",
    cropType: DEMO_CROP,
    plotSize: "400",
    plotSpacing: "25",
    seasonReference: "2026-A",
    treatments: TRIAL_TREATMENTS,
    replications: TRIAL_REPLICATIONS,
    adoptionStartSeason: 2026,
    currentSeason: 2026,
    system: BASE_SYSTEM,
    language: "en",
    setupConfirmed: true,
  });

  updateSeason("2026-A", {
    costs: { tillage: 12000, fertilizer: 22000, pesticide: 6500, irrigation: 9000, residue: 2500 },
    laborOps: {
      operations: [
        { code: "LP", time: 2, unit: "days", workers: 1, wageRate: 1200 },
        { code: "PL", time: 1, unit: "days", workers: 1, wageRate: 1200 },
        { code: "WD", time: 3, unit: "days", workers: 1, wageRate: 1200 },
        { code: "HV", time: 2, unit: "days", workers: 1, wageRate: 1200 },
        { code: "RM", time: 1, unit: "days", workers: 1, wageRate: 1200 },
      ],
    },
    revenue: { yield_kg_ha: 1500, sellingPrice: 400 },
    csiScores: {
      s_j1: 0.65,
      s_j2: 0.55,
      s_j3: 0.45,
      s_j4: 0.3,
      s_j5: 0.5,
      s_j6: 0.4,
    },
    adoptionCostHistory: [24000],
    trendMetrics: {
      profit: [108000, 112000, 115000],
      yield: [1400, 1450, 1500],
      CPU: [95, 92, 90],
      laborCost: [18000, 17500, 17000],
      weed: [3, 3, 2],
      soil: [2.6, 2.8, 3.0],
      adoptionCost: [24000],
    },
    profitHistory: [108000, 112000, 115000],
    yieldHistory: [1400, 1450, 1500],
    CPUHistory: [95, 92, 90],
    previousSystem: null,
    previousProfit: 98000,
    meanProfitCF: 118000,
    plotProfits: [110000, 112500, 115000],
    stats: {
      groups: [[110000, 112500, 115000], [105000, 108000, 109000]],
      groupA: [110000, 112500, 115000],
      groupB: [105000, 108000, 109000],
    },
    ruleFlags: { dataComplete: true },
    status: "COMPLETE",
  });

  updateSeason("2026-B", {
    costs: { tillage: 10000, fertilizer: 21000, pesticide: 6000, irrigation: 8500, residue: 2400 },
    laborOps: {
      operations: [
        { code: "LP", time: 2, unit: "days", workers: 1, wageRate: 1300 },
        { code: "PL", time: 1, unit: "days", workers: 1, wageRate: 1300 },
        { code: "WD", time: 3, unit: "days", workers: 1, wageRate: 1300 },
        { code: "HV", time: 2, unit: "days", workers: 1, wageRate: 1300 },
        { code: "RM", time: 1, unit: "days", workers: 1, wageRate: 1300 },
      ],
    },
    revenue: { yield_kg_ha: 1750, sellingPrice: 420 },
    csiScores: {
      s_j1: 0.75,
      s_j2: 0.7,
      s_j3: 0.6,
      s_j4: 0.45,
      s_j5: 0.65,
      s_j6: 0.55,
    },
    adoptionCostHistory: [24000, 21000],
    trendMetrics: {
      profit: [118000, 125000, 132000],
      yield: [1500, 1600, 1750],
      CPU: [88, 85, 82],
      laborCost: [19000, 18500, 18000],
      weed: [2, 2, 2],
      soil: [3.0, 3.2, 3.4],
      adoptionCost: [24000, 21000],
    },
    profitHistory: [118000, 125000, 132000],
    yieldHistory: [1500, 1600, 1750],
    CPUHistory: [88, 85, 82],
    previousSystem: BASE_SYSTEM,
    previousProfit: 108000,
    meanProfitCF: 118000,
    plotProfits: [118000, 119000, 120000],
    stats: {
      groups: [[118000, 119000, 120000], [115000, 116000, 118000]],
      groupA: [118000, 119000, 120000],
      groupB: [115000, 116000, 118000],
    },
    ruleFlags: { dataComplete: true },
    status: "COMPLETE",
  });

  updateSeason("2026-A", {
    costs: { tillage: 16000, fertilizer: 24000, pesticide: 7200, irrigation: 11000, residue: 3200 },
    laborOps: {
      operations: [
        { code: "LP", time: 1, unit: "days", workers: 1, wageRate: 1400 },
        { code: "PL", time: 1, unit: "days", workers: 1, wageRate: 1400 },
        { code: "WD", time: 2, unit: "days", workers: 1, wageRate: 1400 },
        { code: "HV", time: 1, unit: "days", workers: 1, wageRate: 1400 },
        { code: "RM", time: 1, unit: "days", workers: 1, wageRate: 1400 },
      ],
    },
    revenue: { yield_kg_ha: 1650, sellingPrice: 420 },
    csiScores: {
      s_j1: 0.82,
      s_j2: 0.76,
      s_j3: 0.68,
      s_j4: 0.58,
      s_j5: 0.72,
      s_j6: 0.6,
    },
    adoptionCostHistory: [21000, 19000],
    trendMetrics: {
      profit: [132000, 135000, 138000],
      yield: [1600, 1625, 1650],
      CPU: [95, 92, 90],
      laborCost: [17500, 17000, 16500],
      weed: [2, 2, 1],
      soil: [3.2, 3.3, 3.4],
      adoptionCost: [21000, 19000],
    },
    profitHistory: [132000, 135000, 138000],
    yieldHistory: [1600, 1625, 1650],
    CPUHistory: [95, 92, 90],
    previousSystem: BASE_SYSTEM,
    previousProfit: 118000,
    meanProfitCF: 118000,
    plotProfits: [...buildTrialResults(trialPlotIds).plot_statuses.map(() => 0)],
    stats: {
      groups: [
        [132000, 134500, 131000, 133200],
        [118000, 119500, 117800, 118600],
      ],
      groupA: [132000, 134500, 131000, 133200],
      groupB: [118000, 119500, 117800, 118600],
    },
    ruleFlags: { dataComplete: true },
    status: "COMPLETE",
  });

  const selectedRecordId = sessionStore.mode === "RESEARCH" ? recA : recB;
  const selectedRecord = useDataStore.getState().farmSeasonRecords[selectedRecordId];
  if (selectedRecord) {
    sessionStore.setActiveFarm({
      recordId: selectedRecordId,
      farmId: selectedRecord.farmId,
      farmName: selectedRecord.farmName,
      year: selectedRecord.year,
      season: selectedRecord.season,
    });
  }
  markComputationStale(recA);
  markComputationStale(recB);
  await autosave();

  try {
    localStorage.setItem("demoSeeded", "true");
  } catch {
    // ignore
  }

  if (redirectTo) {
    try {
      window.history.pushState({}, "", redirectTo);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {
      window.location.assign(redirectTo);
    }
  }

  return { farmId, recA, recB };
}


// Expose dev seeder functions on window in development for manual triggering from the browser
try {
  if (typeof window !== "undefined" && import.meta.env.MODE !== "production") {
    window.__devSeeder = window.__devSeeder || {};
    window.__devSeeder.seedDemoFarmAndTrial = seedDemoFarmAndTrial;
    window.__devSeeder.seedAndRunAnalyses = seedAndRunAnalyses;
    window.__devSeeder.seedRichDemoData = seedRichDemoData;
    window.__devSeeder.seedImportedTrial = seedImportedTrial;
    window.__devSeeder.getState = () => ({
      activeFarm: useSessionStore.getState().activeFarm,
      farmSeasonRecords: useDataStore.getState().farmSeasonRecords,
      seasons: useDataStore.getState().seasons,
      computationResults: useComputationStore.getState().results,
    });
  }
} catch {
  // ignore
}

export function seededAlready() {
  try {
    return localStorage.getItem("demoSeeded") === "true";
  } catch {
    return false;
  }
}

export async function seedRichDemoData(redirectTo = null) {
  return seedAndRunAnalyses(redirectTo);
}

export async function seedAndRunAnalyses(redirectTo = null) {
  const { farmId, recA, recB } = await seedDemoFarmAndTrial();
  const data = useDataStore.getState();
  const run = useComputationStore.getState().runAnalysis;

  const buildSessionData = (recordId, mode) => {
    const record = data.farmSeasonRecords[recordId] || {};
    const seasonKey = `${record.year || 2026}-${record.season || "A"}`;
    const season = data.seasons[seasonKey] || {};
    const setup = data.setup || {};

    const sessionData = {
      inputCosts: season.inputCosts || [],
      labourCosts: season.labourCosts || [],
      revenue: season.revenue || {},
      csiScores: season.csiScores || null,
      adoptionCostHistory: season.adoptionCostHistory || [],
      trendMetrics: season.trendMetrics || {},
      profitCA_history: season.profitCA_history || [],
      profitCF_history: season.profitCF_history || [],
      system: setup.system || BASE_SYSTEM,
      previousSystem: season.previousSystem || null,
      previousProfit: season.previousProfit || null,
      seasonsElapsed: season.seasonsElapsed || 1,
      comparisonContext: {
        farmName: record.farmName || setup.farmName,
        seasonReference: setup.seasonReference || season.seasonReference,
        seasonId: seasonKey,
        system: setup.system,
      },
      language: setup.language || "en",
      meanProfitCF: season.meanProfitCF,
      plotProfits: season.plotProfits,
      stats: season.stats,
      ruleFlags: season.ruleFlags,
    };

    if (mode === "RESEARCH") {
      sessionData.treatmentCount = TRIAL_TREATMENTS.length;
      sessionData.rcbdValid = true;
      sessionData.plotProfits = [...(season.plotProfits || []), 132000, 134500, 131000, 133200, 118000, 119500, 117800, 118600].slice(0, TRIAL_REPLICATIONS * TRIAL_TREATMENTS.length);
      sessionData.meanProfitCF = season.meanProfitCF || 118000;
      sessionData.stats = season.stats || {
        groups: [
          [132000, 134500, 131000, 133200],
          [118000, 119500, 117800, 118600],
        ],
      };
    }

    return sessionData;
  };

  try {
    run(recA, buildSessionData(recA, "RESEARCH"), "RESEARCH");
    run(recB, buildSessionData(recB, "FARMER"), "FARMER");
  } catch (e) {
    console.warn("Failed running analyses:", e);
  }

  if (redirectTo) {
    try {
      window.history.pushState({}, "", redirectTo);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {
      window.location.assign(redirectTo);
    }
  }

  return { farmId, recA, recB };
}

export async function seedImportedTrial(overrideSeason = 'A', redirectTo = null) {
  const data = importedTrial || {};
  const trial = data.trial || {};
  const plots = data.plots || [];
  const seasonSheet = data.season || {};
  const labour = data.labour || [];

  const ds = useDataStore.getState();
  const addFarmSeasonRecord = ds.addFarmSeasonRecord;
  const updateSetup = ds.updateSetup;
  const updateSeason = ds.updateSeason;
  const autosave = ds.autosave;
  const markComputationStale = ds.markComputationStale;
  const session = useSessionStore.getState();

  const trialName = trial.trialName || trial.title || trial.siteName || trial.farmName;
  const year = trial.year || 2026;
  const season = overrideSeason || trial.season || 'A';
  const treatments = trial.treatments && trial.treatments.length ? trial.treatments : TRIAL_TREATMENTS;
  const replications = trial.replications || TRIAL_REPLICATIONS;
  const plot_m2 = trial.plot_m2 || (plots[0] && (plots[0].plot_size || plots[0].plot_m2 || plots[0].__EMPTY_7)) || 100;

  // Build plot ids from treatments and replications
  const plotIds = plots.length ? plots.map((plot) => plot.plot_id || plot.__EMPTY_1 || null).filter(Boolean) : buildPlotIds(treatments, replications);
  const layout = buildRandomisationLayout(treatments, replications);
  const trialResults = seasonSheet.localTrialResults || buildTrialResults(plotIds);
  const plotProfits = seasonSheet.plotProfits || plots.map((p) => (typeof p.profit_ha === 'number' ? p.profit_ha : p.profit || 0));

  const rec = addFarmSeasonRecord({
    year,
    season,
    farmName: trialName || DEMO_TRIAL_NAME,
    cropType: trial.crop || trial.cropType || DEMO_CROP,
    farmingSystem: trial.farmingSystem || DEMO_SYSTEM,
    plot_m2,
    plot_size_m2: plot_m2,
    plot_size_ha: plot_m2 ? +(plot_m2 / 10000).toFixed(4) : 0,
    total_plot_area_m2: plot_m2 * plotIds.length,
    total_plot_area_ha: +(plot_m2 * plotIds.length / 10000).toFixed(4),
    plot_ids: plotIds,
    plot_labels: plotIds,
    randomisation_layout: layout,
    randomisation_seed: trial.randomisation_seed || 'imported-seed',
    n_replications: replications,
    total_plots: plotIds.length,
    treatments,
    stat_test: trial.stat_test || 'T_TEST',
    site_name: trial.site_name || trial.site || 'Imported Trial',
    site_identifier: trial.site_identifier || trial.site_id || 'IMPORTED',
    location: trial.location || null,
    plotData: plots.map((p) => ({ plot_id: p.plot_id || p.__EMPTY_1 || null, ...p })),
    status: 'COMPLETE',
    treatment_descriptions: trial.treatment_descriptions || {},
    localTrialResults: trialResults,
  });

  updateSetup({
    farmName: trialName || DEMO_TRIAL_NAME,
    siteName: trial.site_name || trial.title || trial.site || 'Imported Trial',
    siteIdentifier: trial.site_identifier || 'IMPORTED',
    cropType: trial.crop || DEMO_CROP,
    plotSize: String(plot_m2),
    plotSpacing: trial.plotSpacing || '25',
    seasonReference: `${year}-${season}`,
    treatments,
    replications,
    adoptionStartSeason: year,
    currentSeason: year,
    system: trial.farmingSystem || BASE_SYSTEM,
    language: trial.language || 'en',
    setupConfirmed: true,
  });

  updateSeason(`${year}-${season}`, {
    costs: seasonSheet.costs || seasonSheet.cost || {},
    costCA: seasonSheet.costCA || null,
    costCF: seasonSheet.costCF || null,
    profitCA: seasonSheet.profitCA || null,
    profitCF: seasonSheet.profitCF || null,
    meanProfitCF: seasonSheet.meanProfitCF || seasonSheet.meanProfitCF || null,
    laborOps: { operations: labour.map((l) => ({ code: l.code, time: l.time, unit: l.unit, workers: l.workers, wageRate: l.wageRate, totalCost: l.totalCost })) },
    revenue: { yield_kg_ha: seasonSheet.yield_kg_ha || seasonSheet.yield || null, sellingPrice: seasonSheet.sellingPrice || seasonSheet.price || null },
    trendMetrics: seasonSheet.trendMetrics || {},
    plotProfits: plotProfits,
    stats: seasonSheet.stats || {},
    ruleFlags: { dataComplete: true },
    status: 'COMPLETE',
  });

  session.setActiveFarm({ farmId: useDataStore.getState().farmSeasonRecords[rec].farmId, recordId: rec, year, season });
  markComputationStale(rec);
  await autosave();

  try { localStorage.setItem('demoSeeded', 'true'); } catch { /* ignore */ }

  if (redirectTo) {
    try { window.history.pushState({}, '', redirectTo); window.dispatchEvent(new PopStateEvent('popstate')); } catch { /* ignore */ window.location.assign(redirectTo); }
  }

  // Return the created record id
  return { farmId: useDataStore.getState().farmSeasonRecords[rec].farmId, recordId: rec };
}

