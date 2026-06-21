import request from 'supertest';
import { app } from '../testApp.js';

// Vitest-style tests
import { describe, it, beforeAll, afterAll, expect } from 'vitest';

describe('/api/trial-results', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    // clear any test seed
    if (typeof global !== 'undefined' && global.__TEST_SEED__) global.__TEST_SEED__ = {};
  });

  it('computes adoption_costs.CA = max(0, meanCF - meanCA)', async () => {
    const seasonRef = 'S1-2026';
    // seed the test app so it doesn't try to start MongoDB
    global.__TEST_SEED__ = global.__TEST_SEED__ || {};
    global.__TEST_SEED__[seasonRef] = {
      treatments: ['CF', 'CA'],
      treatmentProfits: {
        CF: [200],
        CA: [80],
      },
    };

    const res = await request(app).get(`/api/trial-results/${seasonRef}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const ad = res.body.data.adoption_costs;
    expect(ad).toBeDefined();
    // meanCF = 200, meanCA = 80 -> adoption = 120
    expect(Math.round(ad.CA)).toBe(120);
  });
});
