const router      = require('express').Router();
const Trial       = require('../models/Trial');
const Plot        = require('../models/Plot');
const { requireAuth } = require('../middleware/authMiddleware');
const { aggregatePlot }       = require('../utils/plotAggregator');
const { runCBA }              = require('../utils/cbaEngine');
const { descStats, independentTTest, oneWayAnova, rcbdAnova } = require('../utils/statistics');
const { calcBreakEven }       = require('../utils/breakEven');
const { sensitivityAnalysis } = require('../utils/sensitivityAnalysis');
const { partialBudget }       = require('../utils/partialBudget');
const { yieldStability }      = require('../utils/yieldStability');

router.get('/:trialId', requireAuth, async (req, res) => {
  try {
    const trial  = await Trial.findById(req.params.trialId);
    if (!trial) return res.status(404).json({ error: 'Trial not found' });
    if (trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this trial' });

    const plots  = await Plot.find({ trialId: req.params.trialId }).lean();
    const params = {
      marketPriceRWF:    trial.marketPriceRWF ?? trial.marketPrice ?? 1200,
      wageRateRWF:       trial.wageRateRWF ?? trial.wageRate ?? 1500,
      workingHoursPerDay: trial.workingHoursPerDay ?? trial.hoursPerDay ?? 8,
      plotSizeM2:        trial.plotSizeM2 ?? trial.plotSize ?? 100,
    };

    const aggregated = plots.map((p) => aggregatePlot(p, params));
    const caPlots = aggregated.filter((p) => String(p.treatment).toUpperCase() === 'CA').sort((a, b) => String(a.replicate).localeCompare(b.replicate));
    const cfPlots = aggregated.filter((p) => String(p.treatment).toUpperCase() === 'CF').sort((a, b) => String(a.replicate).localeCompare(b.replicate));

    const cba = runCBA(caPlots, cfPlots, params);

    const caYields = caPlots.map((p) => p.yieldKg).filter((v) => typeof v === 'number');
    const cfYields = cfPlots.map((p) => p.yieldKg).filter((v) => typeof v === 'number');
    const caMargins = caPlots.map((p) => p.netBenefit).filter((v) => typeof v === 'number');
    const cfMargins = cfPlots.map((p) => p.netBenefit).filter((v) => typeof v === 'number');
    const caCSD = caPlots.map((p) => p.csdTotal).filter((v) => typeof v === 'number');
    const cfCSD = cfPlots.map((p) => p.csdTotal).filter((v) => typeof v === 'number');

    const stats = {
      yield: {
        descCA: descStats(caYields),
        descCF: descStats(cfYields),
        tTest: independentTTest(caYields, cfYields, trial.alpha),
        anova: oneWayAnova(caYields, cfYields),
      },
      grossMargin: {
        descCA: descStats(caMargins),
        descCF: descStats(cfMargins),
        tTest: independentTTest(caMargins, cfMargins, trial.alpha),
        anova: oneWayAnova(caMargins, cfMargins),
      },
      csd: {
        descCA: descStats(caCSD),
        descCF: descStats(cfCSD),
        tTest: independentTTest(caCSD, cfCSD, trial.alpha),
        anova: oneWayAnova(caCSD, cfCSD),
      },
    };

    const rcbd = (caYields.length === cfYields.length && caYields.length > 0)
      ? rcbdAnova([caYields, cfYields])
      : null;

    const ef = 10000 / params.plotSizeM2;
    const breakEven = {
      ca: calcBreakEven(cba.ca.avgTPC, params.marketPriceRWF, cba.ca.avgYield, ef),
      cf: calcBreakEven(cba.cf.avgTPC, params.marketPriceRWF, cba.cf.avgYield, ef),
    };

    const sensitivity = {
      ca: sensitivityAnalysis(cba.ca.avgRevenue, cba.ca.avgTPC, cba.ca.avgYield, cba.ca.avgCSD),
      cf: sensitivityAnalysis(cba.cf.avgRevenue, cba.cf.avgTPC, cba.cf.avgYield, cba.cf.avgCSD),
    };

    const partial = partialBudget(cba.ca, cba.cf, ef);

    const stability = {
      ca: yieldStability(caYields, caPlots.map((p) => p.grossRev)),
      cf: yieldStability(cfYields, cfPlots.map((p) => p.grossRev)),
    };

    const qc = runQC(aggregated, params, trial);

    res.json({
      trial,
      plots: aggregated,
      cba,
      stats,
      rcbd,
      breakEven,
      sensitivity,
      partial,
      stability,
      qc,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

function runQC(plots, params, trial) {
  const checks = [];
  for (const p of plots) {
    checks.push({ check: `Yield recorded — ${p.plotId}`, passed: p.yieldKg > 0, value: p.yieldKg });
    checks.push({ check: `No negative yield — ${p.plotId}`, passed: p.yieldKg >= 0 });
    checks.push({ check: `No negative cost — ${p.plotId}`, passed: p.tpc >= 0 });
    checks.push({ check: `No negative revenue — ${p.plotId}`, passed: p.grossRev >= 0 });
    const expected = p.yieldKg * params.marketPriceRWF;
    checks.push({
      check: `Revenue = Yield × Price — ${p.plotId}`,
      passed: Math.abs(p.grossRev - expected) < 0.01,
      expected,
      actual: p.grossRev,
    });
  }
  const passed = checks.filter((c) => c.passed).length;
  return { checks, passed, total: checks.length, allPassed: passed === checks.length };
}

module.exports = router;
