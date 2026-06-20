const router = require('express').Router();
const Trial = require('../models/Trial');
const Plot = require('../models/Plot');
const SeasonRecord = require('../models/SeasonRecord');
const { aggregatePlot } = require('../utils/plotAggregator');
const { runFullSeasonCBA } = require('../utils/fullCBAEngine');

// Close a season: validate minimum dataset, compute full CBA, save SeasonRecord
router.post('/close/:trialId', async (req, res) => {
  try {
    const trial = await Trial.findById(req.params.trialId).lean();
    if (!trial) return res.status(404).json({ error: 'Trial not found' });

    const plots = await Plot.find({ trialId: req.params.trialId }).lean();

    const violations = [];
    for (const p of plots) {
      const hasYield = p.yieldKg > 0;
      const inputCount = (p.inputCosts || []).length;
      const labourCount = (p.labourCosts || []).length;
      const costRecords = inputCount + labourCount;

      if (!hasYield) violations.push(`${p.plotId}: Missing yield`);
      if (costRecords < 3) violations.push(`${p.plotId}: Fewer than 3 cost records (has ${costRecords})`);
    }
    if (violations.length > 0) {
      return res.status(400).json({ error: 'Season close validation failed', violations });
    }

    const priorRecords = await SeasonRecord.find({ trialId: req.params.trialId }).lean();

    const params = {
      marketPriceRWF: trial.marketPriceRWF,
      wageRateRWF: trial.wageRateRWF,
      workingHoursPerDay: trial.workingHoursPerDay,
      plotSizeM2: trial.plotSizeM2
    };
    const aggregated = plots.map(p => aggregatePlot(p, params));
    const caPlots = aggregated.filter(p => p.treatment === 'CA');
    const cfPlots = aggregated.filter(p => p.treatment === 'CF');

    const result = runFullSeasonCBA(trial, caPlots, cfPlots, priorRecords);
    const seasonIndex = result.seasonIndex;

    await SeasonRecord.findOneAndUpdate(
      { trialId: trial._id, treatment: 'CA', seasonIndex },
      {
        ...result.ca,
        phase: result.phase,
        phi: result.phi,
        csi: result.csi,
        deltaC: result.deltaC,
        cnbThisSeason: result.cnbThisSeason,
        cnbCumulative: result.cnbCumulative,
        ttpReachedThisSeason: result.ttpReachedThisSeason,
        scenarioWeights: result.scenarioWeights,
        profitWorstCase: result.ca.scenarios.worst,
        profitBaseCase: result.ca.scenarios.normal,
        profitBestCase: result.ca.scenarios.best,
        expectedProfit: result.ca.expectedProfit,
        profitStdDev: result.ca.profitStdDev,
        revenue: result.ca.revenue,
        cTotal: result.ca.cTotal,
        cBase: result.ca.cBase,
        cSys: result.ca.cSys,
        cAdopt: result.cAdopt,
        closedAt: new Date()
      },
      { upsert: true, new: true }
    );

    await SeasonRecord.findOneAndUpdate(
      { trialId: trial._id, treatment: 'CF', seasonIndex },
      {
        ...result.cf,
        phase: result.phase,
        phi: result.phi,
        csi: result.csi,
        deltaC: -result.deltaC,
        cnbThisSeason: -result.cnbThisSeason,
        cnbCumulative: -result.cnbCumulative,
        ttpReachedThisSeason: false,
        scenarioWeights: result.scenarioWeights,
        profitWorstCase: result.cf.scenarios.worst,
        profitBaseCase: result.cf.scenarios.normal,
        profitBestCase: result.cf.scenarios.best,
        expectedProfit: result.cf.expectedProfit,
        profitStdDev: result.cf.profitStdDev,
        revenue: result.cf.revenue,
        cTotal: result.cf.cTotal,
        cBase: result.cf.cBase,
        cSys: result.cf.cSys,
        cAdopt: 0,
        closedAt: new Date()
      },
      { upsert: true, new: true }
    );

    await Plot.updateMany({ trialId: trial._id }, { seasonClosed: true, seasonClosedAt: new Date() });
    await Trial.findByIdAndUpdate(trial._id, { $inc: { currentSeasonIndex: 1 } });

    res.json({ success: true, seasonIndex, result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// GET trajectory data for a trial
router.get('/trajectory/:trialId', async (req, res) => {
  const records = await SeasonRecord.find({ trialId: req.params.trialId }).sort({ seasonIndex: 1 });
  res.json(records);
});

// GET CNB and TTP summary
router.get('/cnb/:trialId', async (req, res) => {
  const records = await SeasonRecord.find({ trialId: req.params.trialId, treatment: 'CA' }).sort({ seasonIndex: 1 });
  const cnbCumulative = records.reduce((s, r) => s + (r.cnbThisSeason || 0), 0);
  const ttp = records.find(r => r.ttpReachedThisSeason)?.seasonIndex || null;
  const currentSeason = records.length;
  res.json({ cnbCumulative, ttp, currentSeason, records });
});

module.exports = router;