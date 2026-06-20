import express from 'express';
import mongoose from 'mongoose';
import FarmSeasonRecord from './models/FarmSeasonRecord.js';

const router = express.Router();

function normalizeFarmId(farmId) {
  if (!farmId) return '';
  return String(farmId).trim();
}

function normalizeRecordName(record) {
  const name = record.farmName || record.farm_name || record.siteName || record.site_name || record.trialName || record.title;
  return name ? String(name).trim() : '';
}

function buildFarmSeasonQuery(recordData) {
  const farmId = normalizeFarmId(recordData.farm_id || recordData.farmId || recordData.farm_name || recordData.farmName || recordData.site_name || recordData.siteName);
  const seasonRef = recordData.season_ref || (recordData.season && recordData.year != null ? `${recordData.season}-${recordData.year}` : null);
  const trialName = normalizeRecordName(recordData);

  if (!farmId || !seasonRef) {
    return null;
  }

  const query = {
    $and: [
      {
        $or: [
          { farm_id: farmId },
          { farmId: farmId },
          { farm_name: farmId },
          { farmName: farmId },
        ],
      },
      {
        $or: [
          { season_ref: seasonRef },
          { season: seasonRef },
          { season_label: seasonRef },
        ],
      },
    ],
  };

  if (trialName) {
    query.$and.push({
      $or: [
        { farmName: trialName },
        { farm_name: trialName },
        { siteName: trialName },
        { site_name: trialName },
        { trialName: trialName },
        { title: trialName },
      ],
    });
  }

  return query;
}

router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    console.log('Received POST /api/farm-seasons', JSON.stringify(payload));
    const recordData = { ...payload };

    recordData.farm_id = normalizeFarmId(recordData.farm_id || recordData.farmId || recordData.farm_name || recordData.farmName || recordData.site_name || recordData.siteName);
    recordData.farmId = recordData.farm_id;
    recordData.farm_name = recordData.farm_name || recordData.farmName || recordData.site_name || recordData.siteName;
    recordData.farmName = recordData.farmName || recordData.farm_name || recordData.siteName || recordData.site_name;

    if (!recordData.season_ref && recordData.season && recordData.year != null) {
      recordData.season_ref = `${recordData.season}-${recordData.year}`;
    }

    let record;
    if (payload.id && mongoose.Types.ObjectId.isValid(String(payload.id))) {
      record = await FarmSeasonRecord.findByIdAndUpdate(payload.id, recordData, {
        new: true,
        upsert: true,
        runValidators: true,
      });
    } else {
      const query = buildFarmSeasonQuery(recordData);
      if (query) {
        record = await FarmSeasonRecord.findOneAndUpdate(
          query,
          recordData,
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
      } else {
        const farmId = recordData.farm_id || `farm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        recordData.farm_id = farmId;
        recordData.farmId = farmId;
        record = new FarmSeasonRecord(recordData);
        await record.save();
      }
    }

    res.json(record);
  } catch (err) {
    console.error('Failed to save farm season record', { body: req.body, error: err.message, stack: err.stack });
    res.status(400).json({ error: err.message });
  }
});

router.get('/id/:id', async (req, res) => {
  try {
    const record = await FarmSeasonRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/by-farm/:farmId', async (req, res) => {
  try {
    const farmId = normalizeFarmId(req.params.farmId);
    const records = await FarmSeasonRecord.find({
      $or: [
        { farm_id: farmId },
        { farmId },
        { farm_name: farmId },
        { farmName: farmId },
      ],
    }).sort({ year: -1, season: 1 });
    res.json(records);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/by-farm/:farmId/:seasonRef', async (req, res) => {
  try {
    const farmId = normalizeFarmId(req.params.farmId);
    const seasonRef = String(req.params.seasonRef);
    const record = await FarmSeasonRecord.findOne({
      $and: [
        {
          $or: [
            { farm_id: farmId },
            { farmId },
            { farm_name: farmId },
            { farmName: farmId },
          ],
        },
        {
          $or: [
            { season_ref: seasonRef },
            { season: seasonRef },
            { season_label: seasonRef },
          ],
        },
      ],
    });
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
