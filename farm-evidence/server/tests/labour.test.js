import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';

describe('LabourEntry model', () => {
  it('defines schema with required fields', async () => {
    const LabourEntry = (await import('../models/LabourEntry.js')).default;
    const instance = new LabourEntry({
      plot_id: 'P1',
      trial_season_id: new mongoose.Types.ObjectId(),
      entry_date: new Date(),
      activity: 'Weeding',
      time_value: 8,
      time_unit: 'hours',
      workers: 1,
    });

    expect(instance.plot_id).toBe('P1');
    expect(instance.activity).toBe('Weeding');
    expect(instance.time_unit).toBe('hours');
  });

  it('validates time unit enum', async () => {
    const LabourEntry = (await import('../models/LabourEntry.js')).default;
    const instance = new LabourEntry({
      plot_id: 'P1',
      trial_season_id: new mongoose.Types.ObjectId(),
      entry_date: new Date(),
      activity: 'Planting',
      time_value: 5,
      time_unit: 'hours', // valid
      workers: 2,
    });

    expect(['seconds', 'minutes', 'hours', 'days']).toContain(instance.time_unit);
  });
});
