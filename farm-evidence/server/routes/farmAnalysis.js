import express from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import Farm from '../../models/Farm.js';
import Plot from '../models/Plot.js';
import { aggregatePlot } from '../../utils/plotAggregator.js';
import { buildFarmTrajectory } from '../../utils/farmComparisonEngine.js';
import { calcBreakEven } from '../../utils/breakEven.js';
import { sensitivityAnalysis } from '../../utils/sensitivityAnalysis.js';
import { getPhase, computeSeasonIndex } from '../../utils/phaseEngine.js';
import { computeCSI, interpretCSI } from '../../utils/csiEngine.js';
import { computeAdoptionCost } from '../../utils/adoptionCost.js';
import { getFarmerMessage } from '../../utils/messagingEngine.js';

const router = express.Router();

/**
 * GET /api/farm-analysis/:farmId/:year/:season
 * Full analysis for ONE season of ONE farm — the Farmer Mode equivalent
 * of /api/analysis/:trialId
 */
router.get('/:farmId/:year/:season', requireAuth, async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.farmId);
    if (!farm) return res.status(404).json({ error: 'Farm not found' });
    if (farm.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this farm' });

    const record = await Plot.findOne({
      farmId: farm._id,
      year: parseInt(req.params.year),
      season: req.params.season,
      recordType: 'farm_season'
    }).lean();
    if (!record) return res.status(404).json({ error: 'No season record found for this farm' });

    const params = {
      marketPriceRWF: record.marketPriceRWF || farm.defaultMarketPriceRWF,
      wageRateRWF: farm.defaultWageRateRWF,
      workingHoursPerDay: farm.defaultWorkingHoursPerDay,
      plotSizeM2: record.plotSizeM2 || farm.defaultPlotSizeM2
    };

    const agg = aggregatePlot(record, params);

    // Phase + CSI (Farmer Mode uses the same model, single system)
    const t = computeSeasonIndex(farm.adoptionStartSeason, record.seasonIndexOverride || 1);
    const { phase, phi } = getPhase(t);
    const csi = computeCSI({
      j1: farm.csi_j1, j2: farm.csi_j2, j3: farm.csi_j3,
      j4: farm.csi_j4, j5: farm.csi_j5, j6: farm.csi_j6
    });
    const csiInterpretation = interpretCSI(csi);
    const cAdopt = computeAdoptionCost(farm.adoptionCostInitial || 0, t, 0.5);

    // Break-even (single system — no comparison)
    const ef = 10000 / params.plotSizeM2;
    const breakEven = calcBreakEven(agg.tpc, params.marketPriceRWF, agg.yieldKg, ef);

    // Sensitivity (single system)
    const sensitivity = sensitivityAnalysis(agg.grossRev, agg.tpc, agg.yieldKg, agg.csdTotal);

    const messageKey = phase === 'Mature' ? 'phase_mature'
      : phase === 'Stabilization' ? 'phase_stabilization'
      : csiInterpretation.messageKey;
    const farmerMessage = getFarmerMessage(messageKey, farm.language || 'en');

    res.json({
      farm,
      record: agg,
      phase, phi, csi, csiInterpretation, cAdopt,
      breakEven, sensitivity,
      farmerMessage,
      season: { year: record.year, season: record.season, crop: record.crop }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/farm-analysis/:farmId/trajectory
 * Full multi-season trajectory + crop-aware comparisons
 */
router.get('/:farmId/trajectory', requireAuth, async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.farmId);
    if (!farm) return res.status(404).json({ error: 'Farm not found' });
    if (farm.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this farm' });

    const records = await Plot.find({ farmId: farm._id, recordType: 'farm_season' })
      .sort({ year: 1, season: 1 }).lean();

    const trajectory = buildFarmTrajectory(farm, records);

    res.json({ farm, ...trajectory });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
