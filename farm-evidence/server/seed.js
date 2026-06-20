/**
 * FarmEvidence Demo Data Seed Script
 * Run with: cd server && node seed.js
 *
 * Populates:
 *   1. Demo Trial (Researcher Mode) — RCBD, CA vs CF, 3 closed seasons
 *   2. Demo Farm (Farmer Mode) — single system, 3 seasons, crop rotation
 *
 * Idempotent: deletes any prior records matching the demo names before
 * inserting fresh data, so this can be re-run safely during development.
 */

import 'dotenv/config';
import mongoose from 'mongoose';

import Trial from './models/Trial.js';
import Plot from './models/Plot.js';
import SeasonRecord from './models/SeasonRecord.js';
import Notification from './models/Notification.js';
import User from './models/User.js';
import Farm from '../models/Farm.js';
import { aggregatePlot } from '../utils/plotAggregator.js';
import { getPhase } from '../utils/phaseEngine.js';
import { computeCSI } from '../utils/csiEngine.js';
import { computeAdoptionCost } from '../utils/adoptionCost.js';

const DEMO_TRIAL_ID = 'demo-trial-2026';
const DEMO_TRIAL_NAME = 'Demo Trial — Bean RCBD 2026';
const DEMO_FARM_NAME = 'Demo Farm — Munyangabo Plot';

const MARKET_PRICE = 1200;
const WAGE_RATE = 1500;
const HOURS_PER_DAY = 8;
const PLOT_SIZE_M2 = 100;

const CA_YIELDS = [15.8, 16.5, 16.1, 16.7];
const CF_YIELDS = [14.1, 14.9, 14.2, 14.9];

const SEASON_GROWTH = {
  A: { ca: 1.00, cf: 1.00 },
  B: { ca: 1.06, cf: 1.01 },
  C: { ca: 1.11, cf: 1.02 }
};

function buildInputCosts(treatment) {
  if (treatment === 'CA') {
    return [
      { date: new Date('2026-02-10'), item: 'Seeds', costType: 'C_SI', quantity: 0.59, unit: 'Kg', unitCostRWF: 2000, notes: 'Climbing bean variety, certified' },
      { date: new Date('2026-02-12'), item: 'Mulch', costType: 'C_SD', quantity: 300, unit: 'Kg', unitCostRWF: 8, notes: 'On-farm maize residue' },
      { date: new Date('2026-02-14'), item: 'Compost / Manure', costType: 'C_SI', quantity: 40, unit: 'Kg', unitCostRWF: 80 },
      { date: new Date('2026-02-20'), item: 'Inorganic fertilizers (NPK)', costType: 'C_SI', quantity: 1.5, unit: 'Kg', unitCostRWF: 900, notes: 'Reduced rate — mulch improves nutrient retention' },
      { date: new Date('2026-03-05'), item: 'Pesticides', costType: 'C_SI', quantity: 0.8, unit: 'L', unitCostRWF: 1500, notes: 'Lower pest pressure under mulch cover' }
    ];
  }

  return [
    { date: new Date('2026-02-10'), item: 'Seeds', costType: 'C_SI', quantity: 0.59, unit: 'Kg', unitCostRWF: 2000 },
    { date: new Date('2026-02-14'), item: 'Compost / Manure', costType: 'C_SI', quantity: 40, unit: 'Kg', unitCostRWF: 80 },
    { date: new Date('2026-02-20'), item: 'Inorganic fertilizers (NPK)', costType: 'C_SI', quantity: 2.6, unit: 'Kg', unitCostRWF: 900, notes: 'Standard rate, no mulch buffering' },
    { date: new Date('2026-03-05'), item: 'Pesticides', costType: 'C_SI', quantity: 1.2, unit: 'L', unitCostRWF: 1500, notes: 'Higher pest pressure, bare soil' }
  ];
}

function buildLabourCosts(treatment) {
  if (treatment === 'CA') {
    return [
      { date: new Date('2026-02-05'), practice: 'Land preparation (Slashing, Tilling)', costType: 'C_SD', numLabourers: 1, time: 2.5, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE, notes: 'Minimum tillage, rip-line only' },
      { date: new Date('2026-02-10'), practice: 'Planting (labour)', costType: 'C_SI', numLabourers: 1, time: 4, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
      { date: new Date('2026-02-12'), practice: 'Residue management (Mulch application)', costType: 'C_SD', numLabourers: 1, time: 2.5, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
      { date: new Date('2026-03-01'), practice: 'First weeding (labour)', costType: 'C_SD', numLabourers: 1, time: 1.8, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE, notes: 'Mulch suppresses weed emergence' },
      { date: new Date('2026-03-15'), practice: 'Second weeding (labour)', costType: 'C_SD', numLabourers: 1, time: 1.2, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
      { date: new Date('2026-03-06'), practice: 'Pests and Diseases control (labour)', costType: 'C_SI', numLabourers: 1, time: 0.8, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
      { date: new Date('2026-04-20'), practice: 'Harvesting (threshing, Winnowing)', costType: 'C_SI', numLabourers: 1, time: 4.2, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE, notes: 'Higher yield = more harvest time' },
      { date: new Date('2026-04-25'), practice: 'Postharvest handling (Drying, Storage)', costType: 'C_SI', numLabourers: 1, time: 1.5, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE }
    ];
  }

  return [
    { date: new Date('2026-02-05'), practice: 'Land preparation (Slashing, Tilling)', costType: 'C_SD', numLabourers: 1, time: 7.5, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE, notes: 'Full conventional tillage' },
    { date: new Date('2026-02-10'), practice: 'Planting (labour)', costType: 'C_SI', numLabourers: 1, time: 4, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
    { date: new Date('2026-03-01'), practice: 'First weeding (labour)', costType: 'C_SD', numLabourers: 1, time: 5.5, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE, notes: 'No mulch suppression' },
    { date: new Date('2026-03-15'), practice: 'Second weeding (labour)', costType: 'C_SD', numLabourers: 1, time: 4.2, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
    { date: new Date('2026-03-06'), practice: 'Pests and Diseases control (labour)', costType: 'C_SI', numLabourers: 1, time: 1.3, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
    { date: new Date('2026-04-18'), practice: 'Harvesting (threshing, Winnowing)', costType: 'C_SI', numLabourers: 1, time: 3.8, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
    { date: new Date('2026-04-23'), practice: 'Postharvest handling (Drying, Storage)', costType: 'C_SI', numLabourers: 1, time: 1.3, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE }
  ];
}

function buildLabourDisaggregated(treatment) {
  return treatment === 'CA'
    ? { landPreparation: 0.31, planting: 0.50, weeding: 0.375, harvesting: 0.525, residueManagement: 0.31 }
    : { landPreparation: 0.94, planting: 0.50, weeding: 1.21, harvesting: 0.475, residueManagement: 0 };
}

function buildAgronomicData(treatment, replicateIndex) {
  if (treatment === 'CA') {
    return {
      weedPressureScore: [1.5, 1.0, 1.5, 1.0][replicateIndex],
      pestIncidencePct: [8, 6, 9, 7][replicateIndex],
      diseaseSeverity: 2,
      soilFaunaIndex: [3.5, 4.0, 3.5, 4.0][replicateIndex],
      soilColorScore: [3.5, 4.0, 3.5, 3.5][replicateIndex],
      cropVigorScore: [4.0, 4.5, 4.0, 4.5][replicateIndex]
    };
  }

  return {
    weedPressureScore: [3.5, 4.0, 3.5, 4.0][replicateIndex],
    pestIncidencePct: [18, 22, 19, 21][replicateIndex],
    diseaseSeverity: 3,
    soilFaunaIndex: [2.0, 2.0, 2.5, 2.0][replicateIndex],
    soilColorScore: [2.5, 2.0, 2.5, 2.0][replicateIndex],
    cropVigorScore: [3.0, 3.0, 3.5, 3.0][replicateIndex]
  };
}

function avg(arr, key) {
  return arr.reduce((sum, item) => sum + (item[key] || 0), 0) / arr.length;
}

async function seedDemoUsers() {
  console.log('\n[Auth] Seeding demo user accounts...');

  await User.deleteMany({ isDemo: true });

  const demoFarmer = await User.create({
    name: 'Demo Farmer',
    phone: '+250780000000',
    passwordHash: 'fama mode',
    mode: 'farmer',
    role: 'Farmer',
    language: 'en',
    isDemo: true
  });

  const demoResearcher = await User.create({
    name: 'Demo Researcher',
    phone: '+250780000000',
    passwordHash: 'risaca mode',
    mode: 'researcher',
    role: 'Researcher',
    language: 'en',
    isDemo: true
  });

  console.log('  Demo Farmer account:', demoFarmer._id.toString(), '(phone +250780000000, password: fama mode)');
  console.log('  Demo Researcher account:', demoResearcher._id.toString(), '(phone +250780000000, password: risaca mode)');

  return { demoFarmer, demoResearcher };
}

async function seedResearcherDemo(ownerId) {
  console.log('\n[Researcher Mode] Seeding Demo Trial...');

  const existingTrial = await Trial.findOne({ trialId: DEMO_TRIAL_ID });
  if (existingTrial) {
    await Plot.deleteMany({ trialId: existingTrial._id });
    await SeasonRecord.deleteMany({ trialId: existingTrial._id });
    await Notification.deleteMany({ trialId: existingTrial._id });
    await Trial.deleteOne({ _id: existingTrial._id });
    console.log('  Cleared prior Demo Trial data.');
  }

  const trial = await Trial.create({
    trialId: DEMO_TRIAL_ID,
    trialName: DEMO_TRIAL_NAME,
    name: DEMO_TRIAL_NAME,
    season: 'Season A 2026',
    location: 'Tuzamurane Youth Cooperative, Rwamagana',
    crop: 'Beans (Phaseolus vulgaris)',
    variety: 'RWR 3194',
    plantingDate: new Date('2026-02-10'),
    design: 'RCBD',
    treatments: ['CA', 'CF'],
    replicates: 4,
    plotSizeM2: PLOT_SIZE_M2,
    marketPriceRWF: MARKET_PRICE,
    wageRateRWF: WAGE_RATE,
    workingHoursPerDay: HOURS_PER_DAY,
    alpha: 0.05,
    year: 2026,
    role: 'Researcher',
    mode: 'ResearchTrial',
    language: 'en',
    adoptionStartSeason: 1,
    adoptionCostInitial: 45000,
    adoptionDecayRate: 0.5,
    csi_j1: 0.65,
    csi_j2: 0.55,
    csi_j3: 0.70,
    csi_j4: 0.50,
    csi_j5: 0.60,
    csi_j6: 0.55,
    ownerId,
    currentSeasonIndex: 1
  });

  console.log('  Trial created:', trial._id.toString());

  const plotDocs = [];

  for (let i = 0; i < 4; i += 1) {
    plotDocs.push({
      trialId: trial._id,
      plotId: `CA-R${i + 1}`,
      treatment: 'CA',
      replicate: `R${i + 1}`,
      plotSizeM2: PLOT_SIZE_M2,
      recordType: 'trial_plot',
      inputCosts: buildInputCosts('CA'),
      labourCosts: buildLabourCosts('CA'),
      laborDisaggregated: buildLabourDisaggregated('CA'),
      yieldKg: CA_YIELDS[i],
      marketPriceRWF: MARKET_PRICE,
      agronomicData: buildAgronomicData('CA', i),
      year: 2026,
      season: 'A'
    });
  }

  for (let i = 0; i < 4; i += 1) {
    plotDocs.push({
      trialId: trial._id,
      plotId: `CF-R${i + 1}`,
      treatment: 'CF',
      replicate: `R${i + 1}`,
      plotSizeM2: PLOT_SIZE_M2,
      recordType: 'trial_plot',
      inputCosts: buildInputCosts('CF'),
      labourCosts: buildLabourCosts('CF'),
      laborDisaggregated: buildLabourDisaggregated('CF'),
      yieldKg: CF_YIELDS[i],
      marketPriceRWF: MARKET_PRICE,
      agronomicData: buildAgronomicData('CF', i),
      year: 2026,
      season: 'A'
    });
  }

  const plots = await Plot.insertMany(plotDocs);
  console.log(`  Created ${plots.length} plots for Season A 2026.`);

  const params = {
    marketPriceRWF: MARKET_PRICE,
    wageRateRWF: WAGE_RATE,
    workingHoursPerDay: HOURS_PER_DAY,
    plotSizeM2: PLOT_SIZE_M2
  };

  const caPlots = plots.filter((p) => p.treatment === 'CA').map((p) => aggregatePlot(p.toObject(), params));
  const cfPlots = plots.filter((p) => p.treatment === 'CF').map((p) => aggregatePlot(p.toObject(), params));

  const csi = computeCSI({ j1: 0.65, j2: 0.55, j3: 0.70, j4: 0.50, j5: 0.60, j6: 0.55 });

  let cnbCumulative = 0;
  const seasons = ['A', 'B', 'C'];
  const closedDates = [new Date(2026, 4, 15), new Date(2026, 8, 15), new Date(2027, 0, 15)];

  for (let s = 0; s < seasons.length; s += 1) {
    const seasonIndex = s + 1;
    const { phase, phi } = getPhase(seasonIndex);
    const growth = SEASON_GROWTH[seasons[s]];

    const caAvgTPC = avg(caPlots, 'tpc') * (1 / growth.ca) * 0.97;
    const caAvgRevenue = avg(caPlots, 'grossRev') * growth.ca;
    const caAvgCSD = avg(caPlots, 'csdTotal') * (1 / growth.ca) * 0.97;
    const caAvgCSI = avg(caPlots, 'csiTotal');
    const caAvgYield = avg(caPlots, 'yieldKg') * growth.ca;
    const cAdopt = computeAdoptionCost(45000, seasonIndex, 0.5);
    const caProfit = caAvgRevenue - caAvgTPC - cAdopt;

    const cfAvgTPC = avg(cfPlots, 'tpc') * growth.cf;
    const cfAvgRevenue = avg(cfPlots, 'grossRev') * growth.cf;
    const cfAvgCSD = avg(cfPlots, 'csdTotal') * growth.cf;
    const cfAvgCSI = avg(cfPlots, 'csiTotal');
    const cfAvgYield = avg(cfPlots, 'yieldKg') * growth.cf;
    const cfProfit = cfAvgRevenue - cfAvgTPC;

    const cnbThisSeason = caProfit - cfProfit;
    cnbCumulative += cnbThisSeason;
    const ttpReached = caProfit > cfProfit;

    await SeasonRecord.create({
      trialId: trial._id,
      treatment: 'CA',
      seasonIndex,
      phase,
      phi,
      csi,
      cBase: caAvgCSI,
      cSys: caAvgCSD,
      cTime: 0,
      cAdopt,
      cTotal: caAvgTPC + cAdopt,
      revenue: caAvgRevenue,
      profit: caProfit,
      roi: (caProfit / (caAvgTPC + cAdopt)) * 100,
      cbr: caAvgRevenue / (caAvgTPC + cAdopt),
      cpu: (caAvgTPC + cAdopt) / caAvgYield,
      yieldKgHa: caAvgYield * 100,
      deltaC: cfAvgCSD - (caAvgCSD + cAdopt),
      profitWorstCase: caProfit * 0.65,
      profitBaseCase: caProfit,
      profitBestCase: caProfit * 1.30,
      expectedProfit: caProfit * 0.98,
      profitVariance: Math.pow(caProfit * 0.18, 2),
      profitStdDev: caProfit * 0.18,
      scenarioWeights: { best: 0.20, normal: 0.60, worst: 0.20 },
      cnbThisSeason,
      cnbCumulative,
      ttpReachedThisSeason: ttpReached,
      closedAt: closedDates[s]
    });

    await SeasonRecord.create({
      trialId: trial._id,
      treatment: 'CF',
      seasonIndex,
      phase,
      phi,
      csi,
      cBase: cfAvgCSI,
      cSys: cfAvgCSD,
      cTime: 0,
      cAdopt: 0,
      cTotal: cfAvgTPC,
      revenue: cfAvgRevenue,
      profit: cfProfit,
      roi: (cfProfit / cfAvgTPC) * 100,
      cbr: cfAvgRevenue / cfAvgTPC,
      cpu: cfAvgTPC / cfAvgYield,
      yieldKgHa: cfAvgYield * 100,
      deltaC: -(cfAvgCSD - (caAvgCSD + cAdopt)),
      profitWorstCase: cfProfit * 0.70,
      profitBaseCase: cfProfit,
      profitBestCase: cfProfit * 1.20,
      expectedProfit: cfProfit * 0.99,
      profitVariance: Math.pow(cfProfit * 0.15, 2),
      profitStdDev: cfProfit * 0.15,
      scenarioWeights: { best: 0.20, normal: 0.60, worst: 0.20 },
      cnbThisSeason: -cnbThisSeason,
      cnbCumulative: -cnbCumulative,
      ttpReachedThisSeason: false,
      closedAt: closedDates[s]
    });

    console.log(`  Season ${seasons[s]} closed — CA profit: ${Math.round(caProfit)} RWF, CF profit: ${Math.round(cfProfit)} RWF, TTP reached: ${ttpReached}`);
  }

  await Trial.findByIdAndUpdate(trial._id, { currentSeasonIndex: 3 });

  await Notification.create([
    {
      trialId: trial._id,
      type: 'condition_based',
      trigger: 'delta_c_positive',
      severity: 'info',
      message: 'CA is currently more cost-efficient than CF (ΔC = +1,847 RWF). System performing above baseline.'
    },
    {
      trialId: trial._id,
      type: 'time_based',
      trigger: 'soil_check_reminder',
      severity: 'info',
      message: 'It has been 14+ days since the last soil observation. Consider updating soil fauna and color scores for Season C.'
    }
  ]);

  console.log('  Demo Trial seeding complete.\n');
  return trial;
}

async function seedFarmerDemo(ownerId) {
  console.log('[Farmer Mode] Seeding Demo Farm...');

  const existingFarm = await Farm.findOne({ farmName: DEMO_FARM_NAME });
  if (existingFarm) {
    await Plot.deleteMany({ farmId: existingFarm._id });
    await Farm.deleteOne({ _id: existingFarm._id });
    console.log('  Cleared prior Demo Farm data.');
  }

  const farm = await Farm.create({
    farmName: DEMO_FARM_NAME,
    ownerName: 'Jean Munyangabo',
    location: 'Rwamagana District',
    district: 'Rwamagana',
    sector: 'Karenge',
    totalAreaHa: 0.35,
    createdYear: 2026,
    createdSeason: 'A',
    defaultMarketPriceRWF: MARKET_PRICE,
    defaultWageRateRWF: WAGE_RATE,
    defaultWorkingHoursPerDay: HOURS_PER_DAY,
    defaultPlotSizeM2: PLOT_SIZE_M2,
    language: 'en',
    systemType: 'CA',
    adoptionStartSeason: 1,
    adoptionCostInitial: 18000,
    csi_j1: 0.60,
    csi_j2: 0.50,
    csi_j3: 0.65,
    csi_j4: 0.45,
    csi_j5: 0.55,
    csi_j6: 0.50,
    ownerId,
    active: true
  });

  console.log('  Farm created:', farm._id.toString());

  await Plot.create({
    farmId: farm._id,
    plotId: `farm_season_${farm._id.toString()}_2026A`,
    year: 2026,
    season: 'A',
    crop: 'Beans',
    plotSizeM2: PLOT_SIZE_M2,
    marketPriceRWF: MARKET_PRICE,
    recordType: 'farm_season',
    inputCosts: buildInputCosts('CA'),
    labourCosts: buildLabourCosts('CA'),
    laborDisaggregated: buildLabourDisaggregated('CA'),
    yieldKg: 16.3,
    agronomicData: {
      weedPressureScore: 1.5,
      pestIncidencePct: 8,
      diseaseSeverity: 2,
      soilFaunaIndex: 3.0,
      soilColorScore: 3.0,
      cropVigorScore: 4.0
    }
  });

  await Plot.create({
    farmId: farm._id,
    plotId: `farm_season_${farm._id.toString()}_2026B`,
    year: 2026,
    season: 'B',
    crop: 'Maize',
    plotSizeM2: PLOT_SIZE_M2,
    marketPriceRWF: 350,
    recordType: 'farm_season',
    inputCosts: [
      { date: new Date('2026-06-05'), item: 'Seeds', costType: 'C_SI', quantity: 3, unit: 'Kg', unitCostRWF: 1500 },
      { date: new Date('2026-06-08'), item: 'Mulch', costType: 'C_SD', quantity: 250, unit: 'Kg', unitCostRWF: 8 },
      { date: new Date('2026-06-15'), item: 'Compost / Manure', costType: 'C_SI', quantity: 60, unit: 'Kg', unitCostRWF: 80 },
      { date: new Date('2026-06-25'), item: 'Inorganic fertilizers (NPK)', costType: 'C_SI', quantity: 4, unit: 'Kg', unitCostRWF: 900 }
    ],
    labourCosts: [
      { date: new Date('2026-06-01'), practice: 'Land preparation (Slashing, Tilling)', costType: 'C_SD', numLabourers: 1, time: 2, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
      { date: new Date('2026-06-05'), practice: 'Planting (labour)', costType: 'C_SI', numLabourers: 1, time: 3, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
      { date: new Date('2026-06-08'), practice: 'Residue management (Mulch application)', costType: 'C_SD', numLabourers: 1, time: 2, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
      { date: new Date('2026-07-01'), practice: 'First weeding (labour)', costType: 'C_SD', numLabourers: 1, time: 2.5, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
      { date: new Date('2026-09-10'), practice: 'Harvesting (threshing, Winnowing)', costType: 'C_SI', numLabourers: 1, time: 5, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE }
    ],
    laborDisaggregated: { landPreparation: 0.25, planting: 0.375, weeding: 0.31, harvesting: 0.625, residueManagement: 0.25 },
    yieldKg: 42.0,
    agronomicData: {
      weedPressureScore: 1.8,
      pestIncidencePct: 10,
      diseaseSeverity: 2,
      soilFaunaIndex: 3.3,
      soilColorScore: 3.3,
      cropVigorScore: 4.2
    }
  });

  await Plot.create({
    farmId: farm._id,
    plotId: `farm_season_${farm._id.toString()}_2026C`,
    year: 2026,
    season: 'C',
    crop: 'Beans',
    plotSizeM2: PLOT_SIZE_M2,
    marketPriceRWF: MARKET_PRICE,
    recordType: 'farm_season',
    inputCosts: [
      { date: new Date('2026-10-10'), item: 'Seeds', costType: 'C_SI', quantity: 0.55, unit: 'Kg', unitCostRWF: 2000 },
      { date: new Date('2026-10-12'), item: 'Mulch', costType: 'C_SD', quantity: 320, unit: 'Kg', unitCostRWF: 8, notes: 'Maize stover from Season B carried over' },
      { date: new Date('2026-10-14'), item: 'Compost / Manure', costType: 'C_SI', quantity: 35, unit: 'Kg', unitCostRWF: 80 },
      { date: new Date('2026-10-20'), item: 'Inorganic fertilizers (NPK)', costType: 'C_SI', quantity: 1.2, unit: 'Kg', unitCostRWF: 900, notes: 'Further reduced — soil improving' },
      { date: new Date('2026-11-05'), item: 'Pesticides', costType: 'C_SI', quantity: 0.6, unit: 'L', unitCostRWF: 1500 }
    ],
    labourCosts: [
      { date: new Date('2026-10-05'), practice: 'Land preparation (Slashing, Tilling)', costType: 'C_SD', numLabourers: 1, time: 2, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
      { date: new Date('2026-10-10'), practice: 'Planting (labour)', costType: 'C_SI', numLabourers: 1, time: 4, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
      { date: new Date('2026-10-12'), practice: 'Residue management (Mulch application)', costType: 'C_SD', numLabourers: 1, time: 2, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
      { date: new Date('2026-11-01'), practice: 'First weeding (labour)', costType: 'C_SD', numLabourers: 1, time: 1.3, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE, notes: 'Weeds continuing to decline' },
      { date: new Date('2026-11-15'), practice: 'Second weeding (labour)', costType: 'C_SD', numLabourers: 1, time: 0.9, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE },
      { date: new Date('2026-12-20'), practice: 'Harvesting (threshing, Winnowing)', costType: 'C_SI', numLabourers: 1, time: 4.5, timeUnit: 'hr', wageRateRWFPerDay: WAGE_RATE }
    ],
    laborDisaggregated: { landPreparation: 0.25, planting: 0.50, weeding: 0.275, harvesting: 0.5625, residueManagement: 0.25 },
    yieldKg: 17.4,
    agronomicData: {
      weedPressureScore: 1.1,
      pestIncidencePct: 6,
      diseaseSeverity: 1,
      soilFaunaIndex: 3.8,
      soilColorScore: 3.8,
      cropVigorScore: 4.5
    }
  });

  console.log('  Created 3 season records: A 2026 (Beans), B 2026 (Maize), C 2026 (Beans).');

  console.log('  Demo Farm seeding complete.\n');
  return farm;
}

async function main() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/farmevidence';
  const dbName = process.env.MONGODB_DB;
  console.log('Connecting to', MONGO_URI, '...');
  await mongoose.connect(MONGO_URI, dbName ? { dbName } : {});
  console.log('Connected.\n');

  try {
    const { demoFarmer, demoResearcher } = await seedDemoUsers();
    const trial = await seedResearcherDemo(demoResearcher._id);
    const farm = await seedFarmerDemo(demoFarmer._id);

    console.log('═══════════════════════════════════════════════');
    console.log('SEED COMPLETE');
    console.log('═══════════════════════════════════════════════');
    console.log('Researcher Mode → Demo Trial ID:', trial._id.toString());
    console.log('  Setup path: /setup/2026/A  (trial created here)');
    console.log('  Data Entry: /data-entry/2026/A/' + trial._id.toString());
    console.log('  3 seasons closed (A, B, C) — Trajectory & Multi-Season ready');
    console.log('');
    console.log('Farmer Mode → Demo Farm ID:', farm._id.toString());
    console.log('  Setup path: /setup/2026/A  (farm created here, also visible in B & C)');
    console.log('  Data Entry: /data-entry/2026/A/<seasonA-record-id>');
    console.log('  Season Comparison ready: A vs C (Beans, profitability) + A→B→C (agronomic trend)');
    console.log('═══════════════════════════════════════════════');
    console.log('DEMO LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════');
    console.log('Farmer Mode demo   → phone: +250780000000 | password: fama mode');
    console.log('Researcher Mode demo → phone: +250780000000 | password: risaca mode');
    console.log('═══════════════════════════════════════════════\n');
  } catch (err) {
    console.error('SEED FAILED:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

main();
