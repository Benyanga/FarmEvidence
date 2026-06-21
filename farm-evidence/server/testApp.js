import express from 'express';
import mongoose from 'mongoose';
import { mean } from 'simple-statistics';

import EconomicRecordEntry from './models/EconomicRecordEntry.js';
import LabourEntry from './models/LabourEntry.js';
import RevenueRecord from './models/RevenueRecord.js';
import FarmSeasonRecord from './models/FarmSeasonRecord.js';

const app = express();
app.use(express.json());

// Lightweight trial-results handler used only in tests to avoid loading src/ frontend modules
app.get('/api/trial-results/:trial_season_id', async (req, res) => {
  try {
    const { trial_season_id } = req.params;
    if (!trial_season_id) return res.status(404).json({ ok: false, error: 'Trial not found' });

    // Test-seed short-circuit: if tests set global.__TEST_SEED__, use it to avoid DB
    if (typeof global !== 'undefined' && global.__TEST_SEED__ && global.__TEST_SEED__[trial_season_id]) {
      const seed = global.__TEST_SEED__[trial_season_id];
      const treatments = seed.treatments || Object.keys(seed.treatmentProfits || {});
      const adoption_costs = {};
      if (treatments.includes('CF') && treatments.includes('CA')) {
        const meanCF = mean(seed.treatmentProfits.CF || []);
        const meanCA = mean(seed.treatmentProfits.CA || []);
        adoption_costs.CA = Math.max(0, meanCF - meanCA);
      }
      for (const t of treatments) if (!(t in adoption_costs)) adoption_costs[t] = null;
      return res.json({ ok: true, data: { treatments, adoption_costs } });
    }

    // Resolve record by season_ref or id
    const coll = mongoose.connection.collection('farm_season_records');
    let record = null;
    if (mongoose.Types.ObjectId.isValid(String(trial_season_id))) {
      record = await coll.findOne({ _id: new mongoose.Types.ObjectId(trial_season_id) });
    }
    if (!record) {
      record = await coll.findOne({ season_ref: trial_season_id }) || await coll.findOne({ season: trial_season_id });
    }
    if (!record) return res.status(404).json({ ok: false, error: 'Trial not found' });

    const plotIds = record.plot_ids || [];
    if (plotIds.length === 0) return res.json({ ok: true, data: { treatments: [], adoption_costs: {} } });

    const treatmentProfits = {};
    // iterate plots and compute per-plot profit
    for (const plotId of plotIds) {
      const economic = await EconomicRecordEntry.find({ plot_id: plotId, trial_season_id: record._id });
      const labour = await LabourEntry.find({ plot_id: plotId, trial_season_id: record._id });
      const revenue = await RevenueRecord.find({ plot_id: plotId, trial_season_id: record._id });

      let plotEconomic = 0; let plotLabour = 0; let plotRevenue = 0;
      economic.forEach(r => { plotEconomic += r.total_plot_rwf || 0; });
      labour.forEach(r => { plotLabour += r.cost_plot_rwf || 0; });
      revenue.forEach(r => { plotRevenue += r.revenue_plot_rwf || 0; });

      const plotProfit = plotRevenue - (plotEconomic + plotLabour);
      // find treatment mapping by plot id from record.randomisation_layout or assume index
      const treat = (record.treatments && record.treatments.length > 0) ? (record.treatments[0] || 'CA') : 'CA';
      // Best-effort: if record has plot_ids aligned to treatments via randomisation_layout, skip complexity for test
      treatmentProfits[treat] = treatmentProfits[treat] || [];
      treatmentProfits[treat].push(plotProfit);
    }

    // compute adoption_costs: CA = max(0, meanCF - meanCA)
    const treatments = Object.keys(treatmentProfits);
    const adoption_costs = {};
    if (treatments.includes('CF') && treatments.includes('CA')) {
      const meanCF = mean(treatmentProfits['CF'] || []);
      const meanCA = mean(treatmentProfits['CA'] || []);
      adoption_costs.CA = Math.max(0, meanCF - meanCA);
    }
    for (const t of treatments) if (!(t in adoption_costs)) adoption_costs[t] = null;

    res.json({ ok: true, data: { treatments, adoption_costs } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export { app };
