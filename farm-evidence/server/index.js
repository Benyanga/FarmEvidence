// Add RCBD trial/plot API routes
import rcbdTrialRoutes from './routes/trial.js';
import userRoutes from './routes/userRoutes.js';
import trialApiRoutes from './routes/trialApiRoutes.js';
import farmSetupRoutes from "./farmSetupRoutes.js";
import seasonRoutes from "./seasonRoutes.js";
import farmSeasonRoutes from "./farmSeasonRoutes.js";
import farmsRoutes from './routes/farms.js';
import farmAnalysisRoutes from './routes/farmAnalysis.js';

/* global process */
import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
// Clerk is imported dynamically below only when configured to avoid runtime
// errors during local development when keys are not present.
import { annotateComparisonState, computeComparisonFromState } from "../src/engine/comparisonEngine.js";
import { runFullAnalysis } from "../src/engine/computationRunner.js";
import { mean, sampleVariance } from "simple-statistics";
import { computeWelchTTest } from "../src/engine/statistics/ttest.js";
import { computeOneWayANOVA } from "../src/engine/statistics/anova.js";
import { computeEtaSquared } from "../src/engine/statistics/effectSize.js";
import { computeTukeyHSD } from "../src/engine/statistics/posthoc.js";
import { yieldStability } from "../src/utils/yieldStability.js";

// Import models
import EconomicRecordEntry from "./models/EconomicRecordEntry.js";
import AgronomicObservation from "./models/AgronomicObservation.js";
import CsiDriverRecord from "./models/CsiDriverRecord.js";
import RevenueRecord from "./models/RevenueRecord.js";
import LabourEntry from "./models/LabourEntry.js";
import FarmSeasonRecord from "./models/FarmSeasonRecord.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
// Debugging: log request bodies for trial creation/update to diagnose parse/validation issues
app.use((req, res, next) => {
  try {
    if (req.path && req.path.startsWith('/api/trials') && (req.method === 'POST' || req.method === 'PATCH')) {
      console.log('DEBUG: Received', req.method, req.path, 'body ->', JSON.stringify(req.body));
    }
  } catch (e) {
    console.log('DEBUG: Unable to stringify request body', e && e.message);
  }
  next();
});
app.use('/api/rcbd', rcbdTrialRoutes);
app.use('/api', trialApiRoutes);
// Expose Clerk-backed user/profile endpoints at the same /api/auth path the frontend expects
app.use('/api/auth', userRoutes);
app.use('/api/farm-setup', farmSetupRoutes);
app.use('/api/farm-analysis', farmAnalysisRoutes);
app.use('/api/farms', farmsRoutes);
app.use('/api/farm-seasons', farmSeasonRoutes);
app.use('/api/seasons', seasonRoutes);

// Require Clerk keys and attach Clerk middleware. Fail startup if missing.
const clerkPubKey = process.env.CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
if (!clerkPubKey || !clerkSecretKey) {
  console.error('Clerk keys missing — Clerk-only authentication is required. Aborting startup.');
  process.exit(1);
}

let authGuard;
let getAuthFn;
try {
  const clerk = await import('@clerk/express');
  app.use(clerk.clerkMiddleware());
  authGuard = clerk.requireAuth;
  getAuthFn = clerk.getAuth;
  console.log('Clerk middleware attached.');
} catch (e) {
  console.error('Failed to initialize Clerk:', e.message);
  process.exit(1);
}

// Use local MongoDB by default during development. In production, prefer provided cloud URI.
let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/farmEvidence";
const dbName = process.env.MONGODB_DB;
let memoryServer;

// Connect to MongoDB with Mongoose (prefer local dev URI when no cloud URI configured)
const connectOptions = dbName ? { dbName } : {};
try {
  await mongoose.connect(mongoUri, connectOptions);
  console.log("Connected to MongoDB at", mongoUri);
} catch (err) {
  console.error("Failed to connect to MongoDB at", mongoUri, err.message);
  if (process.env.NODE_ENV !== "production") {
    console.warn("Falling back to in-memory MongoDB for development.");
    memoryServer = await MongoMemoryServer.create({
      binary: { version: process.env.MONGODB_MEMORY_SERVER_VERSION || '6.0.6' },
      instance: { dbName },
    });
    mongoUri = memoryServer.getUri();
    await mongoose.connect(mongoUri, connectOptions);
    console.log("Connected to in-memory MongoDB at", mongoUri);
  } else {
    throw err;
  }
}

// Get raw MongoDB client for legacy operations
let client = null;
let collection = null;
try {
  client = mongoose.connection.getClient();
  collection = client.db(dbName).collection("user_state");
} catch {
  // In dev, allow server to run without a live client. Endpoints that require DB will return errors when used.
  client = null;
  collection = null;
}

app.get("/api/health", (_req, res) => {
  console.log('DEBUG: /api/health route reached');
  res.json({ ok: true });
});

app.post("/api/sync/save", authGuard(), async (req, res) => {
  const { userId } = getAuthFn(req);
  const annotatedState = annotateComparisonState(req.body);
  await collection.updateOne(
    { userId },
    { $set: { userId, state: annotatedState, updatedAt: new Date().toISOString() } },
    { upsert: true },
  );
  res.json({ ok: true });
});

app.post("/api/sync/load", authGuard(), async (req, res) => {
  const { userId } = getAuthFn(req);
  const data = await collection.findOne({ userId });
  res.json({ ok: true, state: data?.state ?? null });
});

app.post("/api/comparison/compute", authGuard(), async (req, res) => {
  const { userId } = getAuthFn(req);
  const data = await collection.findOne({ userId });
  if (!data?.state) {
    return res.status(404).json({ ok: false, message: "No saved state available for comparison." });
  }

  const comparison = computeComparisonFromState(data.state);
  res.json({ ok: true, comparison });
});

app.post("/api/analysis/compute", authGuard(), async (req, res) => {
  const { sessionData = {}, mode = "FARMER" } = req.body || {};
  try {
    const results = runFullAnalysis(sessionData, mode);
    if (!results.complete) {
      return res.status(400).json({ ok: false, error: results.errors?.general || "Backend computation failed." });
    }
    res.json({ ok: true, results });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

function safeMean(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return mean(values);
}

function safeSD(values) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  return Math.sqrt(sampleVariance(values));
}

function describeSeries(values) {
  const n = Array.isArray(values) ? values.length : 0;
  if (n === 0) return { n: 0, mean: 0, sd: 0, se: 0, ciLower: 0, ciUpper: 0 };
  const avg = safeMean(values);
  const sd = safeSD(values);
  const se = n > 1 ? sd / Math.sqrt(n) : 0;
  const ci = 1.96 * se;
  return {
    n,
    mean: Number(avg.toFixed(2)),
    sd: Number(sd.toFixed(2)),
    se: Number(se.toFixed(2)),
    ciLower: Number((avg - ci).toFixed(2)),
    ciUpper: Number((avg + ci).toFixed(2)),
  };
}

function normalizePlotId(plotId) {
  return String(plotId || '').trim();
}

function inferTreatmentFromPlotId(plotId) {
  const normalized = normalizePlotId(plotId);
  const match = normalized.match(/^([A-Za-z+]+)/);
  return match ? match[1] : normalized || 'Unknown';
}

function inferReplicateFromPlotId(plotId) {
  const normalized = normalizePlotId(plotId);
  const match = normalized.match(/R(\d+)$/i);
  return match ? `R${Number(match[1])}` : null;
}

function buildPlotTreatmentMap(record) {
  const plotIds = Array.isArray(record.plot_ids) ? record.plot_ids.map(normalizePlotId).filter(Boolean) : [];
  const layout = Array.isArray(record.randomisation_layout) ? record.randomisation_layout : [];
  const treatments = Array.isArray(record.treatments) ? record.treatments.map(String) : [];
  const map = {};

  if (layout.length > 0 && plotIds.length > 0) {
    const flattenedLayout = layout.flat().map(String);
    if (flattenedLayout.length === plotIds.length) {
      let index = 0;
      for (let repIndex = 0; repIndex < layout.length; repIndex += 1) {
        const row = layout[repIndex] ?? [];
        for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
          const plotId = plotIds[index];
          if (!plotId) {
            index += 1;
            continue;
          }

          const treatmentName = String(row[colIndex] || treatments[colIndex] || inferTreatmentFromPlotId(plotId)).trim() || 'Unknown';
          map[plotId] = {
            treatment: treatmentName,
            replicate: `R${repIndex + 1}`,
          };
          index += 1;
        }
      }
    }
  }

  plotIds.forEach((plotId) => {
    if (!map[plotId]) {
      map[plotId] = {
        treatment: inferTreatmentFromPlotId(plotId),
        replicate: inferReplicateFromPlotId(plotId),
      };
    }
  });

  return map;
}

function computeTreatmentCostDelta(results, key = 'c_system_ha') {
  const costs = Object.values(results).map((r) => (r?.[key] ?? 0));
  if (costs.length < 2) return 0;
  return Math.max(...costs) - Math.min(...costs);
}

function buildCostStatistics(treatmentList = [], treatmentCostGroups = {}, mode = 'RESEARCH') {
  const summary = {
    testType: treatmentList.length === 2 ? 'Welch t-test (two-tailed)' : 'One-way ANOVA (F-test)',
    significance_level: 0.05,
    decision: 'Insufficient data',
    effect_size: 0,
    groupA: null,
    groupB: null,
    anova: null,
  };

  if (treatmentList.length < 2) return summary;

  if (treatmentList.length === 2) {
    const [left, right] = treatmentList;
    const a = Array.isArray(treatmentCostGroups[left]) ? treatmentCostGroups[left] : [];
    const b = Array.isArray(treatmentCostGroups[right]) ? treatmentCostGroups[right] : [];
    if (a.length > 1 && b.length > 1) {
      const tRes = computeWelchTTest(a, b, mode);
      const p_value = parseFloat(tRes.p_value.toFixed(4));
      const t_stat = parseFloat(tRes.t_stat.toFixed(4));
      const df = tRes.df;
      const nA = a.length;
      const nB = b.length;
      const vA = sampleVariance(a);
      const vB = sampleVariance(b);
      const pooledSD = Math.sqrt(((nA - 1) * vA + (nB - 1) * vB) / (nA + nB - 2)) || 0;
      const effect_size = pooledSD > 0 ? parseFloat(((mean(a) - mean(b)) / pooledSD).toFixed(4)) : 0;
      summary.testType = 'Welch t-test (two-tailed)';
      summary.decision = p_value < 0.05 ? 'Significant (reject H0)' : 'Not significant (fail to reject H0)';
      summary.effect_size = effect_size;
      summary.groupA = {
        label: left,
        n: nA,
        mean: Number(mean(a).toFixed(2)),
        sd: Number(Math.sqrt(vA).toFixed(2)),
      };
      summary.groupB = {
        label: right,
        n: nB,
        mean: Number(mean(b).toFixed(2)),
        sd: Number(Math.sqrt(vB).toFixed(2)),
      };
      summary.p_value = p_value;
      summary.t_stat = t_stat;
      summary.df = df;
    }
    return summary;
  }

  const groups = treatmentList.map((t) => ({ observations: treatmentCostGroups[t] || [], treatmentId: t }));
  const anovaRes = computeOneWayANOVA(groups, mode);
  const p_value = parseFloat(anovaRes.p_value.toFixed(4));
  const F = parseFloat((anovaRes.F || 0).toFixed(4));
  const df = anovaRes.df_error || 0;
  const effectSize = computeEtaSquared(anovaRes.SS_treatment, anovaRes.SS_total, mode);
  let posthoc = null;
  try {
    posthoc = computeTukeyHSD(groups, anovaRes.MS_error, anovaRes.df_error, mode);
  } catch (e) {
    console.warn('Post-hoc Tukey computation failed for cost statistics:', e.message);
  }
  summary.testType = 'One-way ANOVA (F-test)';
  summary.decision = p_value < 0.05 ? 'Significant (reject H0)' : 'Not significant (fail to reject H0)';
  summary.effect_size = Number(effectSize.etaSquared.toFixed(4));
  summary.p_value = p_value;
  summary.t_stat = F;
  summary.df = df;
  summary.anova = {
    ss_treatment: Number(anovaRes.SS_treatment.toFixed(2)),
    ss_error: Number(anovaRes.SS_error.toFixed(2)),
    ss_total: Number(anovaRes.SS_total.toFixed(2)),
    df_treatment: anovaRes.df_treatment,
    df_error: anovaRes.df_error,
    ms_treatment: Number(anovaRes.MS_treatment.toFixed(2)),
    ms_error: Number(anovaRes.MS_error.toFixed(2)),
    f_value: F,
    posthoc,
    effectSize: effectSize,
  };

  try {
    if (posthoc) {
      const groupingRes = generateTukeyGrouping(treatmentList, treatmentCostGroups, posthoc);
      summary.anova.grouping = groupingRes.grouping;
      summary.anova.groupingLetters = groupingRes.letters;
    }
  } catch (e) {
    console.warn('Grouping generation failed for cost statistics:', e.message);
  }

  return summary;
}

function buildTreatmentStats(rows) {
  const groups = {};
  rows.forEach((row) => {
    const treatment = row.treatment || 'Unknown';
    groups[treatment] = groups[treatment] || [];
    groups[treatment].push(row);
  });

  return Object.fromEntries(Object.entries(groups).map(([treatment, groupRows]) => {
    const yieldValues = groupRows.map((row) => row.yield_kg_ha).filter((v) => typeof v === 'number');
    const netValues = groupRows.map((row) => row.net_benefit).filter((v) => typeof v === 'number');
    const costValues = groupRows.map((row) => row.total_cost).filter((v) => typeof v === 'number');
    const sdValues = groupRows.map((row) => row.total_sd_cost).filter((v) => typeof v === 'number');
    const siValues = groupRows.map((row) => row.total_si_cost).filter((v) => typeof v === 'number');
    return [treatment, {
      plotCount: groupRows.length,
      yield_kg_ha: describeSeries(yieldValues),
      net_benefit: describeSeries(netValues),
      total_cost: describeSeries(costValues),
      sd_cost: describeSeries(sdValues),
      si_cost: describeSeries(siValues),
    }];
  }));
}

// Generate Tukey grouping letters from posthoc pairwise results.
function generateTukeyGrouping(treatmentList, treatmentProfits, posthocResults) {
  // treatmentList: array of treatment ids
  // treatmentProfits: map treatment -> array of profits
  // posthocResults: array of { treatment_A, treatment_B, significant }
  const means = {};
  for (const t of treatmentList) {
    const arr = Array.isArray(treatmentProfits[t]) ? treatmentProfits[t].filter(v => typeof v === 'number') : [];
    means[t] = arr.length > 0 ? mean(arr) : 0;
  }

  // build significance map: sig[a][b] = true if a vs b significant
  const sig = {};
  for (const a of treatmentList) {
    sig[a] = {};
    for (const b of treatmentList) sig[a][b] = false;
  }
  if (Array.isArray(posthocResults)) {
    for (const row of posthocResults) {
      const a = row.treatment_A;
      const b = row.treatment_B;
      if (!a || !b) continue;
      sig[a][b] = !!row.significant;
      sig[b][a] = !!row.significant;
    }
  }

  // sort treatments by descending mean
  const sorted = [...treatmentList].sort((x, y) => (means[y] || 0) - (means[x] || 0));

  const letters = [];
  const grouping = {}; // treatment -> letter
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

  for (const t of sorted) {
    let assigned = false;
    for (let li = 0; li < letters.length; li++) {
      const letter = alphabet[li];
      const members = letters[li];
      // check if t is NOT significantly different from all members
      let compatible = true;
      for (const m of members) {
        if (sig[t] && sig[t][m]) { compatible = false; break; }
      }
      if (compatible) {
        members.push(t);
        grouping[t] = letter;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      const newLetter = alphabet[letters.length];
      letters.push([t]);
      grouping[t] = newLetter;
    }
  }

  return { grouping, letters };
}

// Farm-level endpoints: latest/prior/alerts/season-history/agronomic-summary/gates
// These aggregate across the farm season's plots and reuse existing models.

async function _findFarmSeasonRecordByFarmAndSeason(farm_id, season_ref) {
  const seasonValue = String(season_ref || '').trim();
  const normalizedFarmId = String(farm_id || '').trim();
  const seasonParts = seasonValue.split('-');
  const seasonNumber = seasonParts.length > 1 ? Number(seasonParts[seasonParts.length - 1]) : null;

  return FarmSeasonRecord.findOne({
    $and: [
      {
        $or: [
          { farm_id: normalizedFarmId },
          { farmId: normalizedFarmId },
          { farm_name: normalizedFarmId },
          { farmName: normalizedFarmId },
        ],
      },
      {
        $or: [
          { season_ref: seasonValue },
          { season: seasonValue },
          { season_label: seasonValue },
          ...(seasonNumber ? [{ year: seasonNumber }] : []),
        ],
      },
    ],
  }).lean();
}

app.get('/api/computation-results/latest/:farm_id/:season_ref', authGuard(), async (req, res) => {
  try {
    const { farm_id, season_ref } = req.params;
    const farmSeasonRecord = await _findFarmSeasonRecordByFarmAndSeason(farm_id, season_ref);
    if (!farmSeasonRecord) return res.status(404).json({ ok: false, error: 'Farm season not found' });

    const plotIds = farmSeasonRecord.plot_ids || [];
    if (plotIds.length === 0) {
      return res.json({ ok: true, data: { alerts: [], hasData: false } });
    }

    const economicRecords = await EconomicRecordEntry.find({ plot_id: { $in: plotIds }, trial_season_id: farmSeasonRecord._id });
    const labourRecords = await LabourEntry.find({ plot_id: { $in: plotIds }, trial_season_id: farmSeasonRecord._id });
    const revenueRecords = await RevenueRecord.find({ plot_id: { $in: plotIds }, trial_season_id: farmSeasonRecord._id });

    let totalLabourCost = 0, totalEconomicCost = 0, totalRevenue = 0, totalYield = 0;
    labourRecords.forEach(r => { totalLabourCost += r.cost_plot_rwf || 0; });
    economicRecords.forEach(r => { totalEconomicCost += r.total_plot_rwf || 0; });
    revenueRecords.forEach(r => { totalRevenue += r.revenue_plot_rwf || 0; totalYield += r.yield_raw_kg || 0; });

    const plotCount = plotIds.length;
    const totalSystemCost = totalLabourCost + totalEconomicCost;
    const totalProfit = totalRevenue - totalSystemCost;
    const avgPlotSize = (farmSeasonRecord.plot_size_ha || 0.25) * plotCount;

    const profit_ha = avgPlotSize > 0 ? totalProfit / avgPlotSize : 0;
    const revenue_ha = avgPlotSize > 0 ? totalRevenue / avgPlotSize : 0;
    const c_system_ha = avgPlotSize > 0 ? totalSystemCost / avgPlotSize : 0;
    const cbr = revenue_ha > 0 ? revenue_ha / Math.max(c_system_ha, 1) : 0;
    const roi = revenue_ha > 0 ? profit_ha / Math.max(revenue_ha, 1) : 0;
    const cpu = totalYield > 0 ? totalSystemCost / totalYield : 0;

    res.json({ ok: true, data: {
      profit_ha: Math.round(profit_ha),
      revenue_ha: Math.round(revenue_ha),
      c_system_ha: Math.round(c_system_ha),
      cbr: Math.round(cbr * 10) / 10,
      roi: Math.round(roi * 100) / 100,
      cpu: Math.round(cpu),
      delta_profit: Math.round(profit_ha * 0.24),
      delta_cbr: Math.round((cbr * 0.18) * 10) / 10,
      delta_roi: Math.round((roi * 0.21) * 100) / 100,
      delta_cpu: Math.round(cpu * -0.13),
      phase: farmSeasonRecord.phase || 'TRANSITION',
      seasons_elapsed: farmSeasonRecord.seasons_elapsed || 1,
      adoption_cost: farmSeasonRecord.adoption_cost || 0,
      trend_profit: totalProfit > 0 ? 'IMPROVING' : 'STABLE',
      alerts: totalLabourCost === 0 ? [{ type: 'warning', message: 'No labour data recorded' }] : [],
      hasData: labourRecords.length > 0 || revenueRecords.length > 0
    }});
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/computation-results/prior/:farm_id', authGuard(), async (req, res) => {
  try {
    const { farm_id } = req.params;
    const coll = mongoose.connection.collection('farm_season_records');
    const seasons = await coll.find({ $or: [ { farm_id }, { farmId: farm_id }, { farm_name: farm_id }, { farmName: farm_id } ] }).sort({ year: -1, season: -1 }).limit(2).toArray();
    if (!seasons || seasons.length < 2) return res.status(404).json({ ok: false, error: 'No prior season available' });
    const prior = seasons[1];

    const plotIds = prior.plot_ids || [];
    const economicRecords = await EconomicRecordEntry.find({ plot_id: { $in: plotIds }, trial_season_id: prior._id });
    const labourRecords = await LabourEntry.find({ plot_id: { $in: plotIds }, trial_season_id: prior._id });
    const revenueRecords = await RevenueRecord.find({ plot_id: { $in: plotIds }, trial_season_id: prior._id });

    let totalLabourCost = 0, totalEconomicCost = 0, totalRevenue = 0;
    labourRecords.forEach(r => { totalLabourCost += r.cost_plot_rwf || 0; });
    economicRecords.forEach(r => { totalEconomicCost += r.total_plot_rwf || 0; });
    revenueRecords.forEach(r => { totalRevenue += r.revenue_plot_rwf || 0; });

    const plotCount = plotIds.length;
    const totalSystemCost = totalLabourCost + totalEconomicCost;
    const totalProfit = totalRevenue - totalSystemCost;
    const avgPlotSize = (prior.plot_size_ha || 0.25) * plotCount;

    const profit_ha = avgPlotSize > 0 ? totalProfit / avgPlotSize : 0;
    const revenue_ha = avgPlotSize > 0 ? totalRevenue / avgPlotSize : 0;
    const c_system_ha = avgPlotSize > 0 ? totalSystemCost / avgPlotSize : 0;

    res.json({ ok: true, data: { profit_ha: Math.round(profit_ha), revenue_ha: Math.round(revenue_ha), c_system_ha: Math.round(c_system_ha) } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/alerts/:farm_id/:season_ref', authGuard(), async (req, res) => {
  try {
    const { farm_id, season_ref } = req.params;
    const farmSeasonRecord = await _findFarmSeasonRecordByFarmAndSeason(farm_id, season_ref);
    if (!farmSeasonRecord) return res.status(404).json({ ok: false, error: 'Farm season not found' });

    const plotIds = farmSeasonRecord.plot_ids || [];
    const labourRecords = await LabourEntry.find({ plot_id: { $in: plotIds }, trial_season_id: farmSeasonRecord._id });
    const revenueRecords = await RevenueRecord.find({ plot_id: { $in: plotIds }, trial_season_id: farmSeasonRecord._id });
    const agronomicRecords = await AgronomicObservation.find({ trial_season_id: farmSeasonRecord._id });

    const alerts = [];
    if (labourRecords.length === 0) alerts.push({ type: 'warning', title: 'Labour missing', message: 'No labour records found for this season.' });
    if (revenueRecords.length === 0) alerts.push({ type: 'info', title: 'Revenue missing', message: 'No revenue recorded yet.' });
    if (agronomicRecords.length === 0) alerts.push({ type: 'warning', title: 'Agronomic missing', message: 'No agronomic observations recorded yet for this season.' });

    res.json({ ok: true, data: alerts });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/season-history/:farm_id', authGuard(), async (req, res) => {
  try {
    const { farm_id } = req.params;
    const coll = mongoose.connection.collection('farm_season_records');
    const seasons = await coll.find({ $or: [ { farm_id }, { farmId: farm_id }, { farm_name: farm_id }, { farmName: farm_id } ] }).project({ _id: 1, year: 1, season: 1, phase: 1 }).sort({ year: -1, season: -1 }).toArray();
    res.json({ ok: true, data: seasons });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/agronomic-summary/:farm_id/:season_ref', authGuard(), async (req, res) => {
  try {
    const { farm_id, season_ref } = req.params;
    const farmSeasonRecord = await _findFarmSeasonRecordByFarmAndSeason(farm_id, season_ref);
    if (!farmSeasonRecord) return res.status(404).json({ ok: false, error: 'Farm season not found' });

    const obs = await AgronomicObservation.find({ trial_season_id: farmSeasonRecord._id, mode: 'farmer' });
    if (!obs || obs.length === 0) return res.json({ ok: true, data: {} });

    const avg = (key) => Math.round((obs.reduce((s, o) => s + (o[key] || 0), 0) / obs.length) * 100) / 100;
    const summary = {
      average_yield_kg_ha: avg('yield_kg_ha'),
      average_weed_pressure_score: avg('weed_pressure_score'),
      average_pest_incidence_pct: avg('pest_incidence_pct'),
      average_disease_severity: avg('disease_severity'),
      average_soil_fauna_score: avg('soil_fauna_score'),
      average_soil_colour_score: avg('soil_colour_score'),
      average_crop_vigour_score: avg('crop_vigour_score'),
      average_crop_vigour_ndvi: avg('crop_vigour_ndvi'),
      plots_reported: obs.length,
    };

    res.json({ ok: true, data: summary });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/gates/:farm_id/:season_ref', authGuard(), async (req, res) => {
  try {
    const { farm_id, season_ref } = req.params;
    const farmSeasonRecord = await _findFarmSeasonRecordByFarmAndSeason(farm_id, season_ref);
    if (!farmSeasonRecord) return res.status(404).json({ ok: false, error: 'Farm season not found' });

    const plotIds = farmSeasonRecord.plot_ids || [];
    const economicRecords = await EconomicRecordEntry.find({ plot_id: { $in: plotIds }, trial_season_id: farmSeasonRecord._id });
    const revenueRecord = await RevenueRecord.findOne({ trial_season_id: farmSeasonRecord._id });

    const gates = {
      labour: economicRecords.some(r => r.category === 'SDC' && r.sub_category === 'Labour'),
      tillage: economicRecords.some(r => r.category === 'SDC' && r.sub_category === 'Tillage'),
      fertilizer: economicRecords.some(r => r.category === 'SDC' && r.sub_category === 'Fertilizer'),
      pesticide: economicRecords.some(r => r.category === 'SDC' && r.sub_category === 'Pesticide'),
      irrigation: economicRecords.some(r => r.category === 'SDC' && r.sub_category === 'Irrigation'),
      residue: economicRecords.some(r => r.category === 'SDC' && r.sub_category === 'Residue'),
    };

    gates.yield_recorded = !!revenueRecord?.yield_raw_kg;
    gates.price_recorded = !!revenueRecord?.selling_price_rwf_kg;
    const all_passed = Object.values(gates).every(v => v === true);

    res.json({ ok: true, data: { gates, all_passed } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/mechanism/receive", authGuard(), async (req, res) => {
  const { userId } = getAuthFn(req);
  const { id, content, timestamp } = req.body || {};

  if (!id || typeof content !== "string") {
    return res.status(400).json({ ok: false, error: "Mechanism payload must include id and content." });
  }

  const record = {
    userId,
    id,
    content,
    timestamp: timestamp ?? Date.now(),
    receivedAt: new Date().toISOString(),
  };

  const mechanisms = client.db(dbName).collection("mechanisms");
  await mechanisms.insertOne(record);
  res.json({ ok: true, saved: true });
});

// ═══════════════════════════════════════════════════════════════
// ECONOMIC RECORDS ENDPOINTS (Mongoose)
// ═══════════════════════════════════════════════════════════════

app.post("/api/records/economic/add", authGuard(), async (req, res) => {
  try {
    const {
      plot_id, trial_season_id, entry_date, item_activity,
      category, costType, sub_category, subCategoryText,
      unit, quantity, time_unit, workers, unit_cost_rwf, note, mode
    } = req.body;

    if (!plot_id || !trial_season_id) {
      return res.status(400).json({ ok: false, error: "Missing required fields: plot_id or trial_season_id." });
    }

    // Map frontend costType (C_SD / C_SI) to backend category (SDC / SIC)
    const mappedCategory = category || (costType === 'C_SI' ? 'SIC' : 'SDC');

    // Validate or normalize sub-category. If caller provided a free-text subCategoryText,
    // map into allowed enums; otherwise fall back to Other_SDC / Other_SIC.
    const SDC_ALLOWED = ['Labour', 'Tillage', 'Fertilizer', 'Pesticide', 'Irrigation', 'Residue', 'Other_SDC'];
    const SIC_ALLOWED = ['Land_rent', 'Taxes', 'Transport', 'Storage', 'Loan', 'Family_labour', 'Extension', 'Other_SIC'];

    let finalSub = sub_category || subCategoryText || '';
    let finalNote = note || '';
    if (typeof finalSub === 'string') finalSub = finalSub.trim();

    if (mappedCategory === 'SDC') {
      if (!SDC_ALLOWED.includes(finalSub)) {
        finalNote = finalNote ? `${finalNote}; ${finalSub}` : finalSub;
        finalSub = 'Other_SDC';
      }
    } else {
      if (!SIC_ALLOWED.includes(finalSub)) {
        finalNote = finalNote ? `${finalNote}; ${finalSub}` : finalSub;
        finalSub = 'Other_SIC';
      }
    }

    const record = new EconomicRecordEntry({
      plot_id,
      trial_season_id,
      mode: mode || 'research',
      entry_date: entry_date ? new Date(entry_date) : new Date(),
      item_activity: item_activity || "",
      category: mappedCategory,
      sub_category: finalSub,
      unit: unit || "",
      quantity: Number(quantity) || 0,
      time_unit: time_unit || null,
      workers: Number(workers) || 1,
      unit_cost_rwf: Number(unit_cost_rwf) || 0,
      note: finalNote || "",
    });

    const saved = await record.save();
    res.json({ ok: true, id: saved._id, data: saved });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.patch("/api/records/economic/:recordId", authGuard(), async (req, res) => {
  try {
    const { recordId } = req.params;
    const updates = { ...req.body };

    // Map costType to category if present
    if (updates.costType && !updates.category) {
      updates.category = updates.costType === 'C_SI' ? 'SIC' : 'SDC';
      delete updates.costType;
    }

    // Handle free-text subCategory update
    if (updates.subCategoryText && !updates.sub_category) {
      const text = String(updates.subCategoryText || '').trim();
      const SDC_ALLOWED = ['Labour', 'Tillage', 'Fertilizer', 'Pesticide', 'Irrigation', 'Residue', 'Other_SDC'];
      const SIC_ALLOWED = ['Land_rent', 'Taxes', 'Transport', 'Storage', 'Loan', 'Family_labour', 'Extension', 'Other_SIC'];
      const cat = updates.category || null;
      if (cat === 'SDC') {
        updates.sub_category = SDC_ALLOWED.includes(text) ? text : 'Other_SDC';
        if (!SDC_ALLOWED.includes(text)) updates.note = updates.note ? `${updates.note}; ${text}` : text;
      } else if (cat === 'SIC') {
        updates.sub_category = SIC_ALLOWED.includes(text) ? text : 'Other_SIC';
        if (!SIC_ALLOWED.includes(text)) updates.note = updates.note ? `${updates.note}; ${text}` : text;
      } else {
        updates.sub_category = text;
      }
      delete updates.subCategoryText;
    }

    const record = await EconomicRecordEntry.findByIdAndUpdate(
      recordId,
      updates,
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({ ok: false, error: "Record not found." });
    }

    res.json({ ok: true, data: record });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/records/economic", authGuard(), async (req, res) => {
  try {
    const { plot_id, trial_season_id } = req.query;

    if (!plot_id || !trial_season_id) {
      return res.status(400).json({ ok: false, error: "plot_id and trial_season_id required." });
    }

    const records = await EconomicRecordEntry.find({ plot_id, trial_season_id }).sort({ entry_date: 1 });
    res.json({ ok: true, records });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.delete("/api/records/economic/:recordId", authGuard(), async (req, res) => {
  try {
    const { recordId } = req.params;
    await EconomicRecordEntry.findByIdAndDelete(recordId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// LABOUR RECORDS ENDPOINTS (Mongoose)
// ═══════════════════════════════════════════════════════════════

app.post("/api/records/labour", authGuard(), async (req, res) => {
  try {
    const { plot_id, trial_season_id, entry_date, activity, description, time_value, time_unit, workers, wage_per_day, cost_type } = req.body;

    if (!plot_id || !trial_season_id || time_value == null || !time_unit || !activity) {
      return res.status(400).json({ ok: false, error: 'Missing required fields.' });
    }

    const record = new (mongoose.model('LabourEntry'))({
      plot_id,
      trial_season_id,
      entry_date: entry_date ? new Date(entry_date) : new Date(),
      activity,
      cost_type: cost_type || 'C_SD',
      description: description || '',
      time_value: Number(time_value),
      time_unit,
      workers: Number(workers) || 1,
      wage_per_day: wage_per_day != null ? Number(wage_per_day) : null,
    });

    const saved = await record.save();
    res.json({ ok: true, data: saved });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.patch("/api/records/labour/:id", authGuard(), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const LabourEntry = mongoose.model('LabourEntry');
    const record = await LabourEntry.findById(id);
    if (!record) return res.status(404).json({ ok: false, error: 'Not found' });

    Object.assign(record, updates);
    const saved = await record.save();
    res.json({ ok: true, data: saved });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/records/labour", authGuard(), async (req, res) => {
  try {
    const { plot_id, trial_season_id } = req.query;
    if (!plot_id || !trial_season_id) return res.status(400).json({ ok: false, error: 'plot_id and trial_season_id required.' });
    const LabourEntry = mongoose.model('LabourEntry');
    const records = await LabourEntry.find({ plot_id, trial_season_id }).sort({ entry_date: 1 });
    res.json({ ok: true, records });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.delete("/api/records/labour/:id", authGuard(), async (req, res) => {
  try {
    const { id } = req.params;
    const LabourEntry = mongoose.model('LabourEntry');
    await LabourEntry.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// REVENUE RECORDS ENDPOINTS (Mongoose)
// ═══════════════════════════════════════════════════════════════

app.post("/api/records/revenue", authGuard(), async (req, res) => {
  try {
    const { plot_id, trial_season_id, yield_raw_kg, selling_price_rwf_kg, mode } = req.body;

    if (!plot_id || !trial_season_id || !yield_raw_kg || !selling_price_rwf_kg) {
      return res.status(400).json({ ok: false, error: "Missing required fields." });
    }

    const existingRecord = await RevenueRecord.findOne({ plot_id, trial_season_id });

    if (existingRecord) {
      existingRecord.yield_raw_kg = Number(yield_raw_kg);
      existingRecord.selling_price_rwf_kg = Number(selling_price_rwf_kg);
      const saved = await existingRecord.save();
      return res.json({ ok: true, data: saved });
    }

    const record = new RevenueRecord({
      plot_id,
      trial_season_id,
      mode: mode || 'research',
      yield_raw_kg: Number(yield_raw_kg),
      selling_price_rwf_kg: Number(selling_price_rwf_kg),
    });

    const saved = await record.save();
    res.json({ ok: true, data: saved });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/records/revenue", authGuard(), async (req, res) => {
  try {
    const { plot_id, trial_season_id } = req.query;

    if (!plot_id || !trial_season_id) {
      return res.status(400).json({ ok: false, error: "plot_id and trial_season_id required." });
    }

    const record = await RevenueRecord.findOne({ plot_id, trial_season_id });
    res.json({ ok: true, record: record || null });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// AGRONOMIC OBSERVATIONS ENDPOINTS (Mongoose)
// ═══════════════════════════════════════════════════════════════

app.post("/api/records/agronomic", authGuard(), async (req, res) => {
  try {
    const {
      plot_id,
      trial_season_id,
      observed_at,
      observation_date,
      mode = 'research',
      ...payload
    } = req.body;

    if (!plot_id || !trial_season_id || !observed_at) {
      return res.status(400).json({ ok: false, error: "Missing required fields." });
    }

    const keyMap = {
      yield_kg: 'yield_kg',
      yield_kg_ha: 'yield_kg_ha',
      plot_size_ha: 'plot_size_ha',
      yield_notes: 'yield_notes',
      weed_pressure_score: 'weed_pressure_score',
      weed_notes: 'weed_notes',
      pest_incidence_pct: 'pest_incidence_pct',
      pest_notes: 'pest_notes',
      disease_severity: 'disease_severity',
      disease_notes: 'disease_notes',
      soil_fauna_score: 'soil_fauna_score',
      fauna_notes: 'fauna_notes',
      soil_colour_score: 'soil_colour_score',
      soil_colour_munsell: 'soil_colour_munsell',
      soil_colour_notes: 'soil_colour_notes',
      use_munsell: 'use_munsell',
      crop_vigour_score: 'crop_vigour_score',
      crop_vigour_ndvi: 'crop_vigour_ndvi',
      vigour_notes: 'vigour_notes',
      observations: 'observations',
      not_observed: 'not_observed',
      yieldKg: 'yield_kg',
      yieldKgHa: 'yield_kg_ha',
      plotSizeHa: 'plot_size_ha',
      yieldNotes: 'yield_notes',
      weedPressureScore: 'weed_pressure_score',
      weedNotes: 'weed_notes',
      pestIncidencePct: 'pest_incidence_pct',
      pestNotes: 'pest_notes',
      diseaseSeverity: 'disease_severity',
      diseaseNotes: 'disease_notes',
      soilFaunaScore: 'soil_fauna_score',
      faunaNotes: 'fauna_notes',
      soilColourScore: 'soil_colour_score',
      soilColourMunsell: 'soil_colour_munsell',
      soilColourNotes: 'soil_colour_notes',
      useMunsell: 'use_munsell',
      cropVigourScore: 'crop_vigour_score',
      cropVigourNDVI: 'crop_vigour_ndvi',
      vigourNotes: 'vigour_notes',
      notObserved: 'not_observed',
    };

    const observations = Object.fromEntries(
      Object.entries(payload)
        .filter(([key]) => keyMap[key])
        .map(([key, value]) => [keyMap[key], value])
    );

    const cleanPayload = {
      ...observations,
      mode,
      observed_at,
      observation_date: observation_date ? new Date(observation_date) : new Date(),
    };

    const existingRecord = await AgronomicObservation.findOne({
      plot_id,
      trial_season_id,
      observed_at,
    });

    let saved;
    if (existingRecord) {
      Object.assign(existingRecord, cleanPayload);
      saved = await existingRecord.save();
    } else {
      const record = new AgronomicObservation({
        plot_id,
        trial_season_id,
        ...cleanPayload,
      });
      saved = await record.save();
    }

    const alerts = [];
    if (saved.weed_pressure_score >= 4) {
      alerts.push({
        type: 'warning',
        title: 'High weed pressure',
        message: 'Weed pressure score is high and may reduce crop performance.',
      });
    }
    if (saved.disease_severity >= 4) {
      alerts.push({
        type: 'warning',
        title: 'High disease severity',
        message: 'Disease severity is high and may require intervention.',
      });
    }

    res.json({ ok: true, data: saved, alerts });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/records/agronomic", authGuard(), async (req, res) => {
  try {
    const { plot_id, trial_season_id } = req.query;

    if (!plot_id || !trial_season_id) {
      return res.status(400).json({ ok: false, error: "plot_id and trial_season_id required." });
    }

    const records = await AgronomicObservation.find({ plot_id, trial_season_id }).sort({ observation_date: 1 });
    res.json({ ok: true, records });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// CSI DRIVER RECORDS ENDPOINTS (Mongoose)
// ═══════════════════════════════════════════════════════════════

app.post("/api/records/csi", authGuard(), async (req, res) => {
  try {
    const { plot_id, trial_season_id, j1_rainfall, j2_soil_om, j3_residue_cover, j4_weed_pressure, j5_farmer_skill, j6_equipment } = req.body;

    if (!plot_id || !trial_season_id) {
      return res.status(400).json({ ok: false, error: "Missing required fields." });
    }

    const existingRecord = await CsiDriverRecord.findOne({ plot_id, trial_season_id });

    if (existingRecord) {
      existingRecord.j1_rainfall = j1_rainfall != null ? Number(j1_rainfall) : existingRecord.j1_rainfall;
      existingRecord.j2_soil_om = j2_soil_om != null ? Number(j2_soil_om) : existingRecord.j2_soil_om;
      existingRecord.j3_residue_cover = j3_residue_cover != null ? Number(j3_residue_cover) : existingRecord.j3_residue_cover;
      existingRecord.j4_weed_pressure = j4_weed_pressure != null ? Number(j4_weed_pressure) : existingRecord.j4_weed_pressure;
      existingRecord.j5_farmer_skill = j5_farmer_skill != null ? Number(j5_farmer_skill) : existingRecord.j5_farmer_skill;
      existingRecord.j6_equipment = j6_equipment != null ? Number(j6_equipment) : existingRecord.j6_equipment;
      const saved = await existingRecord.save();
      return res.json({ ok: true, data: saved });
    }

    const record = new CsiDriverRecord({
      plot_id,
      trial_season_id,
      j1_rainfall: j1_rainfall != null ? Number(j1_rainfall) : 0.5,
      j2_soil_om: j2_soil_om != null ? Number(j2_soil_om) : 0.5,
      j3_residue_cover: j3_residue_cover != null ? Number(j3_residue_cover) : 0.5,
      j4_weed_pressure: j4_weed_pressure != null ? Number(j4_weed_pressure) : 0.5,
      j5_farmer_skill: j5_farmer_skill != null ? Number(j5_farmer_skill) : 0.5,
      j6_equipment: j6_equipment != null ? Number(j6_equipment) : 0.5,
    });

    const saved = await record.save();
    res.json({ ok: true, data: saved });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/records/csi", authGuard(), async (req, res) => {
  try {
    const { plot_id, trial_season_id } = req.query;

    if (!plot_id || !trial_season_id) {
      return res.status(400).json({ ok: false, error: "plot_id and trial_season_id required." });
    }

    const record = await CsiDriverRecord.findOne({ plot_id, trial_season_id });
    res.json({ ok: true, record: record || null });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// GATE STATUS ENDPOINT
// ═══════════════════════════════════════════════════════════════

app.get("/api/gates", authGuard(), async (req, res) => {
  try {
    const { plot_id, trial_season_id } = req.query;

    if (!plot_id || !trial_season_id) {
      return res.status(400).json({ ok: false, error: "plot_id and trial_season_id required." });
    }

    // Fetch all economic records
    const economicRecords = await EconomicRecordEntry.find({ plot_id, trial_season_id });
    
    // Check each gate
    const gates = {
      labour: economicRecords.some(r => r.category === 'SDC' && r.sub_category === 'Labour'),
      tillage: economicRecords.some(r => r.category === 'SDC' && r.sub_category === 'Tillage'),
      fertilizer: economicRecords.some(r => r.category === 'SDC' && r.sub_category === 'Fertilizer'),
      pesticide: economicRecords.some(r => r.category === 'SDC' && r.sub_category === 'Pesticide'),
      irrigation: economicRecords.some(r => r.category === 'SDC' && r.sub_category === 'Irrigation'),
      residue: economicRecords.some(r => r.category === 'SDC' && r.sub_category === 'Residue'),
    };

    // Check revenue gates
    const revenueRecord = await RevenueRecord.findOne({ plot_id, trial_season_id });
    gates.yield_recorded = !!revenueRecord?.yield_raw_kg;
    gates.price_recorded = !!revenueRecord?.selling_price_rwf_kg;

    const all_passed = Object.values(gates).every(v => v === true);

    res.json({ ok: true, gates, all_passed });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/computation-results/:farm_season_id - Farmer Mode dashboard
app.get("/api/computation-results/:farm_season_id", authGuard(), async (req, res) => {
  try {
    const { farm_season_id } = req.params;
    
    // Get farm season record to find all plots
    const farmSeasonRecord = await mongoose.connection.collection('farm_season_records').findOne({ _id: mongoose.Types.ObjectId.isValid(farm_season_id) ? new mongoose.Types.ObjectId(farm_season_id) : farm_season_id });
    
    if (!farmSeasonRecord) {
      return res.status(404).json({ ok: false, error: 'Farm season not found' });
    }

    // Get all plots for this farm season
    const plotIds = farmSeasonRecord.plot_ids || [];
    
    if (plotIds.length === 0) {
      // No plots yet - return empty state
      return res.json({ 
        ok: true, 
        data: {
          profit_ha: 0,
          revenue_ha: 0,
          c_system_ha: 0,
          cbr: 0,
          roi: 0,
          cpu: 0,
          delta_profit: 0,
          delta_cbr: 0,
          delta_roi: 0,
          delta_cpu: 0,
          phase: 'TRANSITION',
          seasons_elapsed: 0,
          adoption_cost: 0,
          trend_profit: 'STABLE',
          alerts: [],
          hasData: false
        }
      });
    }

    // Get economic records
    const economicRecords = await EconomicRecordEntry.find({ plot_id: { $in: plotIds }, trial_season_id: farm_season_id });
    const labourRecords = await LabourEntry.find({ plot_id: { $in: plotIds }, trial_season_id: farm_season_id });
    const revenueRecords = await RevenueRecord.find({ plot_id: { $in: plotIds }, trial_season_id: farm_season_id });

    // Calculate totals
    let totalLabourCost = 0, totalEconomicCost = 0, totalRevenue = 0, totalYield = 0;
    
    labourRecords.forEach(r => {
      totalLabourCost += r.cost_plot_rwf || 0;
    });

    economicRecords.forEach(r => {
      totalEconomicCost += r.total_plot_rwf || 0;
    });

    revenueRecords.forEach(r => {
      totalRevenue += r.revenue_plot_rwf || 0;
      totalYield += r.yield_raw_kg || 0;
    });

    const plotCount = plotIds.length;
    const totalSystemCost = totalLabourCost + totalEconomicCost;
    const totalProfit = totalRevenue - totalSystemCost;
    const avgPlotSize = (farmSeasonRecord.plot_size_ha || 0.25) * plotCount;
    const yield_kg_plot = plotCount > 0 ? totalYield / plotCount : 0;
    const yield_kg_ha = avgPlotSize > 0 ? totalYield / avgPlotSize : 0;
    
    const profit_ha = avgPlotSize > 0 ? totalProfit / avgPlotSize : 0;
    const revenue_ha = avgPlotSize > 0 ? totalRevenue / avgPlotSize : 0;
    const c_system_ha = avgPlotSize > 0 ? totalSystemCost / avgPlotSize : 0;
    const cbr = revenue_ha > 0 ? revenue_ha / Math.max(c_system_ha, 1) : 0;
    const roi = revenue_ha > 0 ? profit_ha / Math.max(revenue_ha, 1) : 0;
    const cpu = totalYield > 0 ? totalSystemCost / totalYield : 0;

    res.json({
      ok: true,
      data: {
        profit_ha: Math.round(profit_ha),
        revenue_ha: Math.round(revenue_ha),
        c_system_ha: Math.round(c_system_ha),
        cbr: Math.round(cbr * 10) / 10,
        roi: Math.round(roi * 100) / 100,
        cpu: Math.round(cpu),
        yield_kg_plot: Math.round(yield_kg_plot),
        yield_kg_ha: Math.round(yield_kg_ha),
        total_yield_kg: Math.round(totalYield),
        delta_profit: Math.round(profit_ha * 0.24), // Mock: 24% improvement trend
        delta_cbr: Math.round((cbr * 0.18) * 10) / 10,
        delta_roi: Math.round((roi * 0.21) * 100) / 100,
        delta_cpu: Math.round(cpu * -0.13),
        phase: farmSeasonRecord.phase || 'TRANSITION',
        seasons_elapsed: 1,
        adoption_cost: 0,
        trend_profit: totalProfit > 0 ? 'IMPROVING' : 'STABLE',
        alerts: totalLabourCost === 0 ? [{ type: 'warning', message: 'No labour data recorded' }] : [],
        hasData: labourRecords.length > 0 || revenueRecords.length > 0
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

async function _findFarmSeasonRecordByTrialId(trialSeasonId) {
  if (!trialSeasonId) return null;
  const candidate = String(trialSeasonId).trim();
  const coll = mongoose.connection.collection('farm_season_records');

  if (mongoose.Types.ObjectId.isValid(candidate)) {
    const record = await coll.findOne({ _id: new mongoose.Types.ObjectId(candidate) });
    if (record) return record;
  }

  const byStringId = await coll.findOne({ _id: candidate });
  if (byStringId) return byStringId;

  const parsed = candidate.match(/^(\d+)-(.+?)-(.+)$/);
  if (parsed) {
    const year = parsed[1];
    const season = parsed[2];
    const farmId = parsed[3];
    const season_ref = `${season}-${year}`;
    const record = await coll.findOne({ farm_id: farmId, season_ref });
    if (record) return record;
  }

  return await coll.findOne({
    $or: [
      { farm_id: candidate },
      { farmId: candidate },
      { farm_name: candidate },
      { farmName: candidate },
      { season_ref: candidate },
      { season: candidate },
      { season_label: candidate },
    ],
  });
}

// GET /api/trial-results/:trial_season_id - Research Mode dashboard
app.get("/api/trial-results/:trial_season_id", authGuard(), async (req, res) => {
  try {
    const { trial_season_id } = req.params;

    // Resolve the actual farm season record by remote or local identifier.
    const trialSeasonRecord = await _findFarmSeasonRecordByTrialId(trial_season_id);
    
    if (!trialSeasonRecord) {
      return res.status(404).json({ ok: false, error: 'Trial not found' });
    }

    const plotIds = trialSeasonRecord.plot_ids || [];
    const trialSeasonObjectId = trialSeasonRecord._id;
    
    if (plotIds.length === 0) {
      return res.json({
        ok: true,
        data: {
          treatments: [],
          profit_ha: {},
          revenue_ha: {},
          c_system_ha: {},
          cbr: {},
          roi: {},
          cpu: {},
          delta_c: 0,
          p_value: 1.0,
          cohens_d: 0,
          t_stat: 0,
          df_welch: 0,
          plot_statuses: [],
          hasData: false
        }
      });
    }

    const plotTreatmentMap = buildPlotTreatmentMap(trialSeasonRecord);
    const treatmentList = Array.isArray(trialSeasonRecord.treatments) && trialSeasonRecord.treatments.length > 0
      ? trialSeasonRecord.treatments.map(String)
      : Array.from(new Set(Object.values(plotTreatmentMap).map((row) => row.treatment))).filter(Boolean);

    const results = {};
    const treatmentProfits = {};
    const treatmentSdCosts = {};
    const treatmentYields = {};
    const treatmentRevenues = {};
    const perPlotRows = [];

    // Calculate metrics per treatment
    for (const treatment of treatmentList) {
      const treatmentPlots = plotIds.filter((plotId) => plotTreatmentMap[plotId]?.treatment === treatment);
      let profit = 0, revenue = 0, cost = 0, sdCost = 0, siCost = 0, yield_kg = 0, count = 0;

      for (const plotId of treatmentPlots) {
        const economicRecords = await EconomicRecordEntry.find({ plot_id: plotId, trial_season_id: trialSeasonObjectId });
        const labourRecords = await LabourEntry.find({ plot_id: plotId, trial_season_id: trialSeasonObjectId });
        const revenueRecords = await RevenueRecord.find({ plot_id: plotId, trial_season_id: trialSeasonObjectId });

        let plotEconomic = 0, plotLabour = 0, plotRevenue = 0, plotYield = 0, plotLabourTimeDays = 0;
        economicRecords.forEach(r => (plotEconomic += r.total_plot_rwf || 0));
        labourRecords.forEach(r => {
          plotLabour += r.cost_plot_rwf || 0;
          plotLabourTimeDays += (Number(r.decimal_days) || 0);
        });
        revenueRecords.forEach(r => {
          plotRevenue += r.revenue_plot_rwf || 0;
          plotYield += r.yield_raw_kg || 0;
        });

        const plotCost = plotEconomic + plotLabour;
        const plotProfit = plotRevenue - plotCost;
        const totalSdCost = economicRecords.reduce((sum, item) => {
          const isSDC = String(item.category || item.costType || '').toUpperCase() === 'SDC';
          return sum + (isSDC ? (item.total_plot_rwf || 0) : 0);
        }, 0) + plotLabour;
        const totalSiCost = economicRecords.reduce((sum, item) => {
          const isSIC = String(item.category || item.costType || '').toUpperCase() === 'SIC';
          return sum + (isSIC ? (item.total_plot_rwf || 0) : 0);
        }, 0);
        const grossMargin = plotRevenue - plotCost;
        const replicateMatch = plotId.match(/(\d+)$/);
        const replicateLabel = replicateMatch ? `R${replicateMatch[1]}` : null;
        const price = revenueRecords[0]?.selling_price_rwf_kg || null;
        const plotSizeHa = trialSeasonRecord.plot_size_ha || 0.25;
        const plotSizeM2 = plotSizeHa * 10000;
        const revenuePerM2 = plotSizeM2 > 0 ? plotRevenue / plotSizeM2 : null;

        // collect per-treatment profit arrays for statistics
        treatmentProfits[treatment] = treatmentProfits[treatment] || [];
        treatmentProfits[treatment].push(plotProfit);
        treatmentSdCosts[treatment] = treatmentSdCosts[treatment] || [];
        treatmentSdCosts[treatment].push(totalSdCost);
        treatmentYields[treatment] = treatmentYields[treatment] || [];
        treatmentYields[treatment].push(plotYield);
        treatmentRevenues[treatment] = treatmentRevenues[treatment] || [];
        treatmentRevenues[treatment].push(plotRevenue);

        // collect per-plot rows for detailed export
        perPlotRows.push({
          plotId,
          treatment,
          replicate: replicateLabel,
          plot_size_m2: plotSizeM2,
          plot_size_ha: plotSizeHa,
          total_input_cost: plotEconomic,
          total_labour_cost: plotLabour,
          labour_time_minutes: Math.round(plotLabourTimeDays * 8 * 60),
          total_sd_cost: totalSdCost,
          total_si_cost: totalSiCost,
          total_cost: plotCost,
          selling_price_rwf_kg: price,
          gross_margin_rwf_plot: grossMargin,
          yield_kg_plot: plotYield,
          yield_kg_ha: plotSizeHa > 0 ? (plotYield / plotSizeHa) : null,
          value_rwf_m2: revenuePerM2,
          value_rwf_ha: plotSizeHa > 0 ? (plotRevenue / plotSizeHa) : null,
          net_benefit: plotProfit,
        });

        profit += plotProfit;
        revenue += plotRevenue;
        cost += plotCost;
        sdCost += totalSdCost;
        siCost += totalSiCost;
        yield_kg += plotYield;
        count++;
      }

      const avgPlotSize = (trialSeasonRecord.plot_size_ha || 0.25) * count;
      results[treatment] = {
        profit_ha: avgPlotSize > 0 ? Math.round(profit / avgPlotSize) : 0,
        revenue_ha: avgPlotSize > 0 ? Math.round(revenue / avgPlotSize) : 0,
        c_system_ha: avgPlotSize > 0 ? Math.round(cost / avgPlotSize) : 0,
        c_sd_ha: avgPlotSize > 0 ? Math.round(sdCost / avgPlotSize) : 0,
        c_si_ha: avgPlotSize > 0 ? Math.round(siCost / avgPlotSize) : 0,
        cbr: revenue > 0 ? Math.round((revenue / Math.max(cost, 1)) * 10) / 10 : 0,
        roi: revenue > 0 ? Math.round(((revenue - cost) / Math.max(revenue, 1)) * 100) / 100 : 0,
        cpu: yield_kg > 0 ? Math.round(cost / yield_kg) : 0,
      };
    }

    // Calculate delta cost dynamically across all treatments
    const delta_c = computeTreatmentCostDelta(results);
    const delta_sd = computeTreatmentCostDelta(results, 'c_sd_ha');

    const treatmentStats = buildTreatmentStats(perPlotRows);
    const sdCostStatistics = buildCostStatistics(treatmentList, treatmentSdCosts, 'RESEARCH');
    const yieldStabilityStats = Object.fromEntries(
      treatmentList.map((treatment) => [
        treatment,
        yieldStability(treatmentYields[treatment] || [], treatmentRevenues[treatment] || []),
      ]),
    );
    const replicates = treatmentList.length > 0 ? Math.round(plotIds.length / treatmentList.length) : 0;
    const designSummary = {
      design: 'Randomized Complete Block Design (RCBD)',
      treatments: treatmentList,
      replicates,
      total_plots: plotIds.length,
      plot_size_ha: trialSeasonRecord.plot_size_ha || 0.25,
      plot_size_m2: (trialSeasonRecord.plot_size_ha || 0.25) * 10000,
      statistical_test: treatmentList.length === 2 ? "Welch t-test (two-tailed)" : "One-way ANOVA (F-test)",
      significance_level: 0.05,
    };

    // Deterministic statistical results using per-plot profits
    let p_value = 1.0, cohens_d = 0, t_stat = 0, df_welch = 0;
    let statSummary = {
      testType: treatmentList.length === 2 ? 'Welch t-test (two-tailed)' : 'One-way ANOVA (F-test)',
      decision: 'Insufficient data',
      effect_size: 0,
      groupA: null,
      groupB: null,
      anova: null,
    };

    try {
      if (treatmentList.length >= 2) {
        if (treatmentList.length === 2) {
          const a = treatmentProfits[treatmentList[0]] || [];
          const b = treatmentProfits[treatmentList[1]] || [];
          if (a.length > 1 && b.length > 1) {
            const tRes = computeWelchTTest(a, b, 'RESEARCH');
            t_stat = parseFloat(tRes.t_stat.toFixed(4));
            df_welch = tRes.df;
            p_value = parseFloat(tRes.p_value.toFixed(4));
            const nA = a.length, nB = b.length;
            const vA = sampleVariance(a), vB = sampleVariance(b);
            const pooledSD = Math.sqrt(((nA - 1) * vA + (nB - 1) * vB) / (nA + nB - 2)) || 0;
            cohens_d = pooledSD > 0 ? parseFloat(((mean(a) - mean(b)) / pooledSD).toFixed(4)) : 0;
            statSummary = {
              testType: 'Welch t-test (two-tailed)',
              decision: p_value < 0.05 ? 'Significant (reject H0)' : 'Not significant (fail to reject H0)',
              effect_size: cohens_d,
              groupA: {
                label: treatmentList[0],
                n: nA,
                mean: Number(mean(a).toFixed(2)),
                sd: Number(Math.sqrt(vA).toFixed(2)),
              },
              groupB: {
                label: treatmentList[1],
                n: nB,
                mean: Number(mean(b).toFixed(2)),
                sd: Number(Math.sqrt(vB).toFixed(2)),
              },
              anova: null,
            };
          }
        } else {
          const groups = treatmentList.map(t => ({ observations: treatmentProfits[t] || [], treatmentId: t }));
          const anovaRes = computeOneWayANOVA(groups, 'RESEARCH');
          p_value = parseFloat(anovaRes.p_value.toFixed(4));
          t_stat = parseFloat((anovaRes.F || 0).toFixed(4));
          df_welch = anovaRes.df_error || 0;
          // Compute Tukey HSD post-hoc comparisons when possible
          let posthoc = null;
          try {
            posthoc = computeTukeyHSD(groups, anovaRes.MS_error, anovaRes.df_error, 'RESEARCH');
          } catch (e) {
            console.warn('Post-hoc Tukey computation failed:', e.message);
          }
          statSummary = {
            testType: 'One-way ANOVA (F-test)',
            decision: p_value < 0.05 ? 'Significant (reject H0)' : 'Not significant (fail to reject H0)',
            effect_size: cohens_d,
            groupA: null,
            groupB: null,
            anova: {
              ss_treatment: Number(anovaRes.SS_treatment.toFixed(2)),
              ss_error: Number(anovaRes.SS_error.toFixed(2)),
              ss_total: Number(anovaRes.SS_total.toFixed(2)),
              df_treatment: anovaRes.df_treatment,
              df_error: anovaRes.df_error,
              ms_treatment: Number(anovaRes.MS_treatment.toFixed(2)),
              ms_error: Number(anovaRes.MS_error.toFixed(2)),
              f_value: Number(anovaRes.F.toFixed(4)),
              posthoc: posthoc,
              grouping: null,
            },
          };
          // compute grouping letters if we have posthoc results
          try {
            if (posthoc) {
              const groupingRes = generateTukeyGrouping(treatmentList, treatmentProfits, posthoc);
              statSummary.anova.grouping = groupingRes.grouping;
              statSummary.anova.groupingLetters = groupingRes.letters;
            }
          } catch (e) {
            console.warn('Grouping generation failed:', e.message);
          }
        }
      }
    } catch (e) {
      console.warn('Statistics computation failed:', e.message);
    }

    res.json({
      ok: true,
      data: {
        design_summary: designSummary,
        treatments: treatmentList,
        profit_ha: Object.fromEntries(treatmentList.map(t => [t, results[t]?.profit_ha || 0])),
        revenue_ha: Object.fromEntries(treatmentList.map(t => [t, results[t]?.revenue_ha || 0])),
        c_system_ha: Object.fromEntries(treatmentList.map(t => [t, results[t]?.c_system_ha || 0])),
        c_sd_ha: Object.fromEntries(treatmentList.map(t => [t, results[t]?.c_sd_ha || 0])),
        c_si_ha: Object.fromEntries(treatmentList.map(t => [t, results[t]?.c_si_ha || 0])),
        cbr: Object.fromEntries(treatmentList.map(t => [t, results[t]?.cbr || 0])),
        roi: Object.fromEntries(treatmentList.map(t => [t, results[t]?.roi || 0])),
        cpu: Object.fromEntries(treatmentList.map(t => [t, results[t]?.cpu || 0])),
        treatment_stats: treatmentStats,
        statistics: {
          p_value: parseFloat(p_value.toFixed(4)),
          cohens_d: parseFloat(cohens_d || 0),
          t_stat: parseFloat(t_stat || 0),
          df: df_welch || Math.max(0, plotIds.length - 2),
          delta_c: Math.round(delta_c),
          delta_sd: Math.round(delta_sd),
          sdCost: sdCostStatistics,
          yieldStability: yieldStabilityStats,
          ...statSummary,
        },
        delta_c: Math.round(delta_c),
        delta_sd: Math.round(delta_sd),
        plots: perPlotRows,
        plot_statuses: plotIds.map((pid, idx) => ({
          label: pid.substring(0, 5),
          status: idx % 3 === 0 ? 'Complete' : idx % 3 === 1 ? 'Recording' : 'No data'
        })),
        hasData: plotIds.length > 0
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

const port = Number(process.env.API_PORT || 4000);
app.listen(port, () => {
  console.log(`FarmEvidence API listening on ${port}`);
});