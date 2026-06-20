const { getPhase, computeSeasonIndex } = require('./phaseEngine');
const { computeCSI, interpretCSI, computeEfficiency } = require('./csiEngine');
const { computeAdoptionCost } = require('./adoptionCost');
const { descStats, independentTTest, rcbdAnova } = require('./statistics');

/**
 * Full 14-step seasonal CBA computation.
 *
 * @param {object} trial       - Trial document (plain JS object with virtuals resolved)
 * @param {object[]} caPlots   - aggregated CA plot results from plotAggregator
 * @param {object[]} cfPlots   - aggregated CF plot results from plotAggregator
 * @param {object[]} priorSeasonRecords - array of SeasonRecord documents for CNB
 * @returns {object} fullSeasonResult
 */
function runFullSeasonCBA(trial, caPlots, cfPlots, priorSeasonRecords = []) {
  const t = computeSeasonIndex(trial.adoptionStartSeason, trial.currentSeasonIndex);
  const { phase, phi } = getPhase(t);

  const csi = computeCSI({
    j1: trial.csi_j1, j2: trial.csi_j2, j3: trial.csi_j3,
    j4: trial.csi_j4, j5: trial.csi_j5, j6: trial.csi_j6
  });
  const csiInterpretation = interpretCSI(csi);
  const scenarioWeights = csiInterpretation.weights;

  const E_MAX = {
    fuel: 0.60, laborTillage: 0.50, weedControl: 0.50,
    irrigation: 0.25, fertilizerN: 0.65, pesticides: 0.32,
    energy: 0.30, labor: 0.34
  };
  const efficiencies = {};
  for (const [input, eMax] of Object.entries(E_MAX)) {
    efficiencies[input] = computeEfficiency(eMax, phi, csi);
  }

  const cAdopt = computeAdoptionCost(
    trial.adoptionCostInitial || 0,
    t,
    trial.adoptionDecayRate || 0.50
  );

  function avg(plots, key) {
    if (!plots.length) return 0;
    return plots.reduce((s, p) => s + (Number(p[key]) || 0), 0) / plots.length;
  }

  const ca = {
    cBase:  avg(caPlots, 'csiTotal'),
    cSys:   avg(caPlots, 'csdTotal'),
    cAdopt: cAdopt,
    cTotal: avg(caPlots, 'tpc') + cAdopt,
    revenue: avg(caPlots, 'grossRev'),
    yield:   avg(caPlots, 'yieldKg'),
    yields:  caPlots.map(p => Number(p.yieldKg) || 0).filter(v => v > 0)
  };
  ca.cTime = 0;
  ca.profit = ca.revenue - ca.cTotal;
  ca.roi = ca.cTotal > 0 ? ca.profit / ca.cTotal : null;
  ca.cbr = ca.cTotal > 0 ? ca.revenue / ca.cTotal : null;
  ca.cpu = ca.yield > 0 ? ca.cTotal / ca.yield : null;

  const cf = {
    cBase:  avg(cfPlots, 'csiTotal'),
    cSys:   avg(cfPlots, 'csdTotal'),
    cAdopt: 0,
    cTotal: avg(cfPlots, 'tpc'),
    revenue: avg(cfPlots, 'grossRev'),
    yield:   avg(cfPlots, 'yieldKg'),
    yields:  cfPlots.map(p => Number(p.yieldKg) || 0).filter(v => v > 0)
  };
  cf.cTime = 0;
  cf.profit = cf.revenue - cf.cTotal;
  cf.roi = cf.cTotal > 0 ? cf.profit / cf.cTotal : null;
  cf.cbr = cf.cTotal > 0 ? cf.revenue / cf.cTotal : null;
  cf.cpu = cf.yield > 0 ? cf.cTotal / cf.yield : null;

  const deltaC = (cf.cSys + cf.cTime) - (ca.cSys + ca.cTime + ca.cAdopt);

  const buildScenario = (base, priceMult, costMult) => {
    const revenue = base.revenue * priceMult;
    const cost = base.cTotal * costMult;
    return revenue - cost;
  };

  const caScenarios = {
    worst:  buildScenario(ca, 0.70, 1.20),
    normal: ca.profit,
    best:   buildScenario(ca, 1.20, 0.90)
  };
  const cfScenarios = {
    worst:  buildScenario(cf, 0.70, 1.20),
    normal: cf.profit,
    best:   buildScenario(cf, 1.20, 0.90)
  };

  function weightedExpected(scenarios, weights) {
    return weights.best * scenarios.best +
           weights.normal * scenarios.normal +
           weights.worst * scenarios.worst;
  }
  function weightedVariance(scenarios, weights, expected) {
    return weights.best   * Math.pow(scenarios.best   - expected, 2) +
           weights.normal * Math.pow(scenarios.normal - expected, 2) +
           weights.worst  * Math.pow(scenarios.worst  - expected, 2);
  }

  ca.expectedProfit = weightedExpected(caScenarios, scenarioWeights);
  ca.profitVariance = weightedVariance(caScenarios, scenarioWeights, ca.expectedProfit);
  ca.profitStdDev = Math.sqrt(ca.profitVariance);
  cf.expectedProfit = weightedExpected(cfScenarios, scenarioWeights);
  cf.profitVariance = weightedVariance(cfScenarios, scenarioWeights, cf.expectedProfit);
  cf.profitStdDev = Math.sqrt(cf.profitVariance);

  const cnbThisSeason = ca.profit - cf.profit;
  const priorCNB = priorSeasonRecords.reduce((sum, r) => sum + (r.cnbThisSeason || 0), 0);
  const cnbCumulative = priorCNB + cnbThisSeason;

  const ttpReachedThisSeason = ca.profit > cf.profit && cnbThisSeason > 0;
  const ttpReachedEver = ttpReachedThisSeason || priorSeasonRecords.some(r => r.ttpReachedThisSeason);

  const messageKey = phase === 'Mature' ? 'phase_mature'
    : phase === 'Stabilization' ? 'phase_stabilization'
    : csiInterpretation.messageKey;

  const notifications = generateNotifications(caPlots, cfPlots, deltaC, t, ca, cf);

  return {
    seasonIndex: t,
    phase,
    phi,
    csi,
    csiInterpretation,
    scenarioWeights,
    efficiencies,
    cAdopt,
    ca: { ...ca, scenarios: caScenarios },
    cf: { ...cf, scenarios: cfScenarios },
    deltaC,
    cnbThisSeason,
    cnbCumulative,
    ttpReachedThisSeason,
    ttpReachedEver,
    messageKey,
    notifications
  };
}

function adjustHarvestCost(harvestBase, yieldSys, yieldCFBaseline) {
  if (!yieldCFBaseline || yieldCFBaseline === 0) return harvestBase;
  return harvestBase * (yieldSys / yieldCFBaseline);
}

function projectTTP(seasonRecords) {
  const sorted = Array.isArray(seasonRecords) ? [...seasonRecords] : [];
  sorted.sort((a, b) => (a.seasonIndex || 0) - (b.seasonIndex || 0));
  for (const r of sorted) {
    if (r.ttpReachedThisSeason) return r.seasonIndex;
  }
  return null;
}

function computeCNB(seasonRecords) {
  return (Array.isArray(seasonRecords) ? seasonRecords : []).reduce((sum, r) => sum + (r.cnbThisSeason || 0), 0);
}

function generateNotifications(caPlots, cfPlots, deltaC, t, ca, cf) {
  const notes = [];
  const allPlots = [ ...(Array.isArray(caPlots) ? caPlots : []), ...(Array.isArray(cfPlots) ? cfPlots : []) ];

  for (const p of allPlots) {
    const agro = p.agronomicData || {};

    if (Number(agro.weedPressureScore) >= 3) notes.push({
      trigger: 'weed_pressure_high',
      severity: 'warning',
      plotId: p.plotId,
      message: `High weed pressure at ${p.plotId} (score ${agro.weedPressureScore}). Expect +15–25% weed control cost next season. Recommend early intervention.`
    });

    if (Number(agro.pestIncidencePct) >= 30) notes.push({
      trigger: 'pest_incidence_high',
      severity: 'error',
      plotId: p.plotId,
      message: `Significant pest infestation at ${p.plotId} (${agro.pestIncidencePct}%). Yield loss risk flagged.`
    });

    if (!p.yieldKg) notes.push({
      trigger: 'yield_missing',
      severity: 'error',
      plotId: p.plotId,
      message: `Plot ${p.plotId}: No yield recorded. Analysis incomplete.`
    });
  }

  if (ca.cbr !== null && ca.cbr < 1) notes.push({
    trigger: 'bcr_below_one',
    severity: 'error',
    message: `CA is operating at a loss this season (BCR = ${ca.cbr.toFixed(3)}). Review cost structure.`
  });

  if (cf.cbr !== null && cf.cbr < 1) notes.push({
    trigger: 'bcr_below_one_cf',
    severity: 'error',
    message: `CF is operating at a loss this season (BCR = ${cf.cbr.toFixed(3)}).`
  });

  if (deltaC > 0) notes.push({
    trigger: 'delta_c_positive',
    severity: 'info',
    message: `CA is currently more cost-efficient than CF (ΔC = +${Math.round(deltaC).toLocaleString()} RWF). System performing above baseline.`
  });

  return notes;
}

module.exports = {
  runFullSeasonCBA,
  adjustHarvestCost,
  projectTTP,
  computeCNB,
  generateNotifications
};