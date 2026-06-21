import request from 'supertest';
import { app } from '../index.js';
import mongoose from 'mongoose';
import FarmSeasonRecord from '../models/FarmSeasonRecord.js';
import EconomicRecordEntry from '../models/EconomicRecordEntry.js';
import LabourEntry from '../models/LabourEntry.js';
import RevenueRecord from '../models/RevenueRecord.js';

// Vitest-style tests
import { describe, it, beforeAll, afterAll, expect } from 'vitest';

describe('/api/trial-results', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    // Ensure mongoose connected (server/index.js uses MongoMemoryServer fallback)
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  });

  afterAll(async () => {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch (e) {
      // ignore
    }
  });

  it('computes adoption_costs.CA = max(0, meanCF - meanCA)', async () => {
    // Create a minimal trial season record with two plots
    // Create via the Mongoose model so other model hooks work
    const trialDoc = await FarmSeasonRecord.create({
      site_name: 'test-site',
      plot_ids: ['P1', 'P2'],
      treatments: ['CF', 'CA'],
      plot_size_ha: 0.25,
      year: 2026,
      season: 'S1',
    });
    const trial = trialDoc;
    // Also ensure the raw collection the server reads from has a matching document
    const raw = { ...trialDoc.toObject() };
    // use the `farm_season_records` collection name the server expects
    await mongoose.connection.collection('farm_season_records').insertOne(raw);

    // P1 -> CF: revenue 300, cost 100 => profit 200
    await EconomicRecordEntry.create({
      plot_id: 'P1', trial_season_id: trial._id, mode: 'research', entry_date: new Date(), item_activity: 'input', category: 'SIC', sub_category: 'Transport', total_plot_rwf: 100,
    });
    await LabourEntry.create({ plot_id: 'P1', trial_season_id: trial._id, entry_date: new Date(), activity: 'work', time_value: 0, time_unit: 'days', workers: 1 });
    await RevenueRecord.create({ plot_id: 'P1', trial_season_id: trial._id, mode: 'research', yield_raw_kg: 10, selling_price_rwf_kg: 30 });

    // P2 -> CA: revenue 200, cost 120 => profit 80
    await EconomicRecordEntry.create({
      plot_id: 'P2', trial_season_id: trial._id, mode: 'research', entry_date: new Date(), item_activity: 'input', category: 'SIC', sub_category: 'Transport', total_plot_rwf: 120,
    });
    await LabourEntry.create({ plot_id: 'P2', trial_season_id: trial._id, entry_date: new Date(), activity: 'work', time_value: 0, time_unit: 'days', workers: 1 });
    await RevenueRecord.create({ plot_id: 'P2', trial_season_id: trial._id, mode: 'research', yield_raw_kg: 8, selling_price_rwf_kg: 25 });

    const seasonRef = `${trial.season}-${trial.year}`;
    const res = await request(app).get(`/api/trial-results/${seasonRef}`);
    // debug output when tests fail
    console.log('API response status:', res.status);
    console.log('API response body:', JSON.stringify(res.body));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const ad = res.body.data.adoption_costs;
    expect(ad).toBeDefined();
    // meanCF = 200, meanCA = 80 -> adoption = 120
    expect(Math.round(ad.CA)).toBe(120);
  });
});
