import express from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import crypto from 'crypto';
import Trial from '../models/Trial.js';
import Plot from '../models/Plot.js';

const router = express.Router();

function generateId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function describeSeries(values) {
  const nums = Array.isArray(values)
    ? values.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : [];
  const n = nums.length;
  if (n === 0) {
    return { n: 0, mean: 0, sd: 0, se: 0, ciLower: 0, ciUpper: 0 };
  }
  const mean = nums.reduce((sum, item) => sum + item, 0) / n;
  const variance = n > 1 ? nums.reduce((sum, item) => sum + (item - mean) ** 2, 0) / (n - 1) : 0;
  const sd = Math.sqrt(variance);
  const se = n > 1 ? sd / Math.sqrt(n) : 0;
  const ci = 1.96 * se;
  return {
    n,
    mean: Number(mean.toFixed(2)),
    sd: Number(sd.toFixed(2)),
    se: Number(se.toFixed(2)),
    ciLower: Number((mean - ci).toFixed(2)),
    ciUpper: Number((mean + ci).toFixed(2)),
  };
}



function calculatePlotMetrics(plot, trial) {
  const plotYield = safeNumber(plot.yieldKg);
  const marketPrice = safeNumber(
    plot.marketPriceRWF ?? plot.marketPrice ?? trial?.marketPriceRWF ?? trial?.marketPrice ?? 1200
  );
  const revenue = plotYield * marketPrice;

  const inputCosts = Array.isArray(plot.inputCosts) ? plot.inputCosts : Array.isArray(plot.inputs) ? plot.inputs : [];
  const labourCosts = Array.isArray(plot.labourCosts) ? plot.labourCosts : Array.isArray(plot.labour) ? plot.labour : [];
  const trialHoursPerDay = safeNumber(trial?.hoursPerDay ?? trial?.workingHoursPerDay ?? 8);

  const calculateLabourRowCost = (row) => {
    const numLabourers = safeNumber(row.numLabourers ?? row.labourers);
    const time = safeNumber(row.time);
    const wageRate = safeNumber(row.wageRateRWFPerDay ?? row.wageRate);
    const unit = String(row.timeUnit || '').toLowerCase();
    let days = 0;
    if (unit === 'day') {
      days = time;
    } else if (unit === 'hr' || unit === 'hour' || unit === 'hours') {
      days = trialHoursPerDay > 0 ? time / trialHoursPerDay : 0;
    } else if (unit === 'min' || unit === 'minute' || unit === 'minutes') {
      days = trialHoursPerDay > 0 ? time / 60 / trialHoursPerDay : 0;
    }
    return numLabourers * wageRate * days;
  };

  const allRows = [
    ...inputCosts,
    ...labourCosts.map((row) => ({
      ...row,
      _labourCost: calculateLabourRowCost(row),
    })),
  ];

  const csdCost = allRows
    .filter((row) => String(row.costType).toUpperCase() === 'C_SD')
    .reduce((sum, row) => {
      if (row._labourCost !== undefined) {
        return sum + safeNumber(row._labourCost);
      }
      return sum + safeNumber(row.quantity) * safeNumber(row.unitCostRWF ?? row.unitCost);
    }, 0);
  const csiCost = allRows
    .filter((row) => String(row.costType).toUpperCase() === 'C_SI')
    .reduce((sum, row) => {
      if (row._labourCost !== undefined) {
        return sum + safeNumber(row._labourCost);
      }
      return sum + safeNumber(row.quantity) * safeNumber(row.unitCostRWF ?? row.unitCost);
    }, 0);
  const totalCost = csdCost + csiCost;
  const grossMargin = revenue - totalCost;

  return {
    plotId: plot.plotId,
    treatment: plot.treatment,
    replicate: plot.replicate,
    yieldKg: plotYield,
    marketPrice,
    revenue,
    csdCost,
    csiCost,
    totalCost,
    grossMargin,
  };
}

function buildAnalysisResult(trial, plots) {
  const treatmentGroups = { CA: [], CF: [] };
  plots.forEach((plot) => {
    const metrics = calculatePlotMetrics(plot, trial);
    const treatment = String(metrics.treatment || 'CF').toUpperCase().trim();
    if (treatment === 'CA') {
      treatmentGroups.CA.push(metrics);
    } else {
      treatmentGroups.CF.push(metrics);
    }
  });

  const buildMetrics = (metrics) => {
    const yieldValues = metrics.map((item) => item.yieldKg);
    const grossMargins = metrics.map((item) => item.grossMargin);
    const csdValues = metrics.map((item) => item.csdCost);
    const csiValues = metrics.map((item) => item.csiCost);
    const revenue = metrics.reduce((sum, item) => sum + item.revenue, 0);
    const totalCost = metrics.reduce((sum, item) => sum + item.totalCost, 0);
    const netBenefit = metrics.reduce((sum, item) => sum + item.grossMargin, 0);
    const totalYield = yieldValues.reduce((sum, item) => sum + item, 0);
    const costPerKg = totalYield > 0 ? totalCost / totalYield : 0;
    const bcr = totalCost > 0 ? revenue / totalCost : 0;
    return {
      yieldValues,
      grossMargins,
      csdValues,
      csiValues,
      revenue,
      totalCost,
      netBenefit,
      costPerKg,
      bcr,
    };
  };

  const ca = buildMetrics(treatmentGroups.CA);
  const cf = buildMetrics(treatmentGroups.CF);

  return {
    trialName: trial.trialName || trial.name || 'Trial',
    season: trial.season || '',
    location: trial.location || '',
    stats: {
      yield: {
        descCA: describeSeries(ca.yieldValues),
        descCF: describeSeries(cf.yieldValues),
      },
      grossMargin: {
        descCA: describeSeries(ca.grossMargins),
        descCF: describeSeries(cf.grossMargins),
      },
      csd: {
        descCA: describeSeries(ca.csdValues),
        descCF: describeSeries(cf.csdValues),
      },
      csi: {
        descCA: describeSeries(ca.csiValues),
        descCF: describeSeries(cf.csiValues),
      },
    },
    cbaMetrics: {
      ca: {
        revenue: Number(ca.revenue.toFixed(2)),
        totalCost: Number(ca.totalCost.toFixed(2)),
        netBenefit: Number(ca.netBenefit.toFixed(2)),
        costPerKg: Number(ca.costPerKg.toFixed(2)),
        bcr: Number(ca.bcr.toFixed(2)),
      },
      cf: {
        revenue: Number(cf.revenue.toFixed(2)),
        totalCost: Number(cf.totalCost.toFixed(2)),
        netBenefit: Number(cf.netBenefit.toFixed(2)),
        costPerKg: Number(cf.costPerKg.toFixed(2)),
        bcr: Number(cf.bcr.toFixed(2)),
      },
    },
  };
}

// Trial endpoints
router.post('/trials', requireAuth, async (req, res) => {
  try {
    const id = String(req.body.trialId || generateId());
    // Normalize treatments: accept either array of strings or array of {name, code}
    const rawTreatments = Array.isArray(req.body.treatments) ? req.body.treatments : undefined;
    const treatments = Array.isArray(rawTreatments)
      ? rawTreatments.map((t) => (typeof t === 'string' ? t : String(t.code ?? t.name ?? t).trim()))
      : undefined;

    const trialData = {
      trialId: id,
      trialName: req.body.trialName || req.body.name || 'Trial',
      ...req.body,
    };
    if (treatments !== undefined) trialData.treatments = treatments;

    const trial = new Trial(trialData);
    await trial.save();
    res.json({ trialId: id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/trials/:trialId', requireAuth, async (req, res) => {
  try {
    const trial = await Trial.findOne({ trialId: req.params.trialId });
    if (!trial) {
      return res.status(404).json({ error: `Trial ${req.params.trialId} not found.` });
    }
    if (trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this trial' });
    res.json(trial.toObject({ virtuals: true }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/trials/:trialId', requireAuth, async (req, res) => {
  try {
    const trial = await Trial.findOne({ trialId: req.params.trialId });
    if (!trial) {
      return res.status(404).json({ error: `Trial ${req.params.trialId} not found.` });
    }
    if (trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this trial' });
    const updated = await Trial.findOneAndUpdate(
      { trialId: req.params.trialId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Plot endpoints
router.get('/plots/trial/:trialId', requireAuth, async (req, res) => {
  try {
    const trial = await Trial.findOne({ trialId: req.params.trialId });
    if (!trial) {
      return res.status(404).json({ error: `Trial ${req.params.trialId} not found.` });
    }
    if (trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this trial' });
    const plots = await Plot.find({ trialId: trial._id });
    res.json(plots.map((p) => p.toObject()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/plots/:plotId', requireAuth, async (req, res) => {
  try {
    const plot = await Plot.findOne({ plotId: req.params.plotId });
    if (!plot) {
      return res.status(404).json({ error: `Plot ${req.params.plotId} not found.` });
    }
    // Verify ownership via trial
    const trial = await Trial.findById(plot.trialId);
    if (trial && trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this plot' });
    res.json(plot.toObject());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/plots/:plotId', requireAuth, async (req, res) => {
  try {
    const plot = await Plot.findOne({ plotId: req.params.plotId });
    if (!plot) {
      return res.status(404).json({ error: `Plot ${req.params.plotId} not found.` });
    }
    // Verify ownership via trial
    const trial = await Trial.findById(plot.trialId);
    if (trial && trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this plot' });

    if (req.body.yieldKg !== undefined) {
      plot.yieldKg = safeNumber(req.body.yieldKg);
    }
    if (req.body.marketPriceRWF !== undefined) {
      plot.marketPriceRWF = safeNumber(req.body.marketPriceRWF);
    } else if (req.body.marketPrice !== undefined) {
      plot.marketPriceRWF = safeNumber(req.body.marketPrice);
    }
    if (req.body.labourDisaggregated !== undefined) {
      plot.labourDisaggregated = req.body.labourDisaggregated;
    } else if (req.body.laborDisaggregated !== undefined) {
      plot.labourDisaggregated = req.body.laborDisaggregated;
    }
    if (req.body.agronomicData !== undefined) {
      plot.agronomicData = req.body.agronomicData;
    }
    if (req.body.inputCosts !== undefined) {
      plot.inputCosts = req.body.inputCosts;
    }
    if (req.body.labourCosts !== undefined) {
      plot.labourCosts = req.body.labourCosts;
    }

    plot.updatedAt = new Date();
    await plot.save();
    res.json(plot.toObject());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/plots', requireAuth, async (req, res) => {
  try {
    const { trialId, plotId, treatment, replicate, plotSizeM2 } = req.body || {};
    if (!trialId || !plotId) {
      return res.status(400).json({ error: 'trialId and plotId are required.' });
    }
    const trial = await Trial.findOne({ trialId });
    if (!trial) {
      return res.status(404).json({ error: `Trial ${trialId} not found.` });
    }
    if (trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this trial' });
    const normalizedPlotId = String(plotId).trim();
    const plot = new Plot({
      plotId: normalizedPlotId,
      trialId: trial._id,
      treatment: treatment || 'CF',
      replicate: String(replicate || 1),
      plotSizeM2: plotSizeM2 ?? trial.plotSizeM2 ?? 100,
      marketPriceRWF: trial.marketPriceRWF ?? trial.marketPrice ?? 1200,
      inputCosts: [],
      labourCosts: [],
    });
    await plot.save();
    res.json(plot.toObject());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/plots/:plotId/inputs', requireAuth, async (req, res) => {
  try {
    const plot = await Plot.findOne({ plotId: req.params.plotId });
    if (!plot) {
      return res.status(404).json({ error: `Plot ${req.params.plotId} not found.` });
    }
    // Verify ownership via trial
    const trial = await Trial.findById(plot.trialId);
    if (trial && trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this plot' });
    const row = {
      id: req.body.id || generateId(),
      date: req.body.date,
      item: req.body.item,
      costType: req.body.costType,
      quantity: req.body.quantity,
      unit: req.body.unit,
      unitCostRWF: req.body.unitCostRWF ?? req.body.unitCost,
      notes: req.body.notes,
    };
    plot.inputCosts.push(row);
    plot.updatedAt = new Date();
    await plot.save();
    res.json(row);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/plots/:plotId/inputs/:rowId', requireAuth, async (req, res) => {
  try {
    const plot = await Plot.findOne({ plotId: req.params.plotId });
    if (!plot) {
      return res.status(404).json({ error: `Plot ${req.params.plotId} not found.` });
    }
    // Verify ownership via trial
    const trial = await Trial.findById(plot.trialId);
    if (trial && trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this plot' });
    plot.inputCosts = plot.inputCosts.filter((row) => String(row.id) !== String(req.params.rowId));
    plot.updatedAt = new Date();
    await plot.save();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/plots/:plotId/labour', requireAuth, async (req, res) => {
  try {
    const plot = await Plot.findOne({ plotId: req.params.plotId });
    if (!plot) {
      return res.status(404).json({ error: `Plot ${req.params.plotId} not found.` });
    }
    // Verify ownership via trial
    const trial = await Trial.findById(plot.trialId);
    if (trial && trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this plot' });
    const row = {
      id: req.body.id || generateId(),
      date: req.body.date,
      practice: req.body.practice,
      costType: req.body.costType,
      numLabourers: req.body.numLabourers ?? req.body.labourers,
      time: req.body.time,
      timeUnit: req.body.timeUnit,
      wageRateRWFPerDay: req.body.wageRateRWFPerDay ?? req.body.wageRate,
      notes: req.body.notes,
    };
    plot.labourCosts.push(row);
    plot.updatedAt = new Date();
    await plot.save();
    res.json(row);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/plots/:plotId/labour/:rowId', requireAuth, async (req, res) => {
  try {
    const plot = await Plot.findOne({ plotId: req.params.plotId });
    if (!plot) {
      return res.status(404).json({ error: `Plot ${req.params.plotId} not found.` });
    }
    // Verify ownership via trial
    const trial = await Trial.findById(plot.trialId);
    if (trial && trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this plot' });
    plot.labourCosts = plot.labourCosts.filter((row) => String(row.id) !== String(req.params.rowId));
    plot.updatedAt = new Date();
    await plot.save();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/plots/:plotId/yield', requireAuth, async (req, res) => {
  try {
    const plot = await Plot.findOne({ plotId: req.params.plotId });
    if (!plot) {
      return res.status(404).json({ error: `Plot ${req.params.plotId} not found.` });
    }
    // Verify ownership via trial
    const trial = await Trial.findById(plot.trialId);
    if (trial && trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this plot' });
    if (req.body.yieldKg !== undefined) {
      plot.yieldKg = safeNumber(req.body.yieldKg);
    }
    if (req.body.marketPriceRWF !== undefined) {
      plot.marketPriceRWF = safeNumber(req.body.marketPriceRWF);
    } else if (req.body.marketPrice !== undefined) {
      plot.marketPriceRWF = safeNumber(req.body.marketPrice);
    }
    plot.updatedAt = new Date();
    await plot.save();
    res.json(plot.toObject());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Analysis endpoint
router.get('/analysis/:trialId', requireAuth, async (req, res) => {
  try {
    const trial = await Trial.findOne({ trialId: req.params.trialId });
    if (!trial) {
      return res.status(404).json({ error: `Trial ${req.params.trialId} not found.` });
    }
    if (trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this trial' });
    const plots = await Plot.find({ trialId: trial._id });
    const result = buildAnalysisResult(trial, plots);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
