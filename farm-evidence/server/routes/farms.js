import express from 'express';
import Farm from '../../models/Farm.js';
import Plot from '../models/Plot.js';
import { requireAuth } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Create a new Farm (persistent entity)
router.post('/', requireAuth, async (req, res) => {
  try {
    const farm = await Farm.create({ ...req.body, ownerId: req.user._id });

    // Immediately create the first FarmSeasonRecord for the creation year+season
    await Plot.create({
      farmId: farm._id,
      plotId: `farm_season_${farm._id.toString()}_${farm.createdYear}${farm.createdSeason}`,
      year: farm.createdYear,
      season: farm.createdSeason,
      plotSizeM2: farm.defaultPlotSizeM2,
      marketPriceRWF: farm.defaultMarketPriceRWF,
      recordType: 'farm_season',
      inputCosts: [],
      labourCosts: [],
      crop: req.body.firstSeasonCrop || null
    });

    res.status(201).json(farm);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Get all farms (Farmer Mode Setup list — farms appear in ALL seasons from creation onward)
// Query params: ?year=2026&season=B (used to determine if a season record exists yet)
router.get('/', requireAuth, async (req, res) => {
  const farms = await Farm.find({ ownerId: req.user._id, active: true }).sort({ createdAt: -1 });

  const { year, season } = req.query;
  if (year && season) {
    // Annotate each farm with whether a season record exists for this year+season
    const farmsWithStatus = await Promise.all(farms.map(async (farm) => {
      const record = await Plot.findOne({
        farmId: farm._id, year: parseInt(year), season, recordType: 'farm_season'
      });
      return {
        ...farm.toJSON(),
        hasSeasonRecord: !!record,
        seasonRecordId: record?._id || null,
        seasonCrop: record?.crop || null,
        seasonComplete: record ? (record.yieldKg > 0) : false
      };
    }));
    return res.json(farmsWithStatus);
  }

  res.json(farms);
});

// Get one farm
router.get('/:id', requireAuth, async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });
  if (farm.ownerId.toString() !== req.user._id.toString())
    return res.status(403).json({ error: 'Not authorized to access this farm' });
  res.json(farm);
});

// Update farm (CSI, defaults, etc.)
router.patch('/:id', requireAuth, async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });
  if (farm.ownerId.toString() !== req.user._id.toString())
    return res.status(403).json({ error: 'Not authorized to access this farm' });
  const updated = await Farm.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Create a NEW season record for an EXISTING farm
// Called when farmer clicks "Add this season's data" on a farm that doesn't
// yet have a record for the current year+season
router.post('/:id/seasons', requireAuth, async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) return res.status(404).json({ error: 'Farm not found' });
    if (farm.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this farm' });

    const { year, season, crop, plotSizeM2, marketPriceRWF } = req.body;

    // Prevent duplicates
    const existing = await Plot.findOne({ farmId: farm._id, year, season, recordType: 'farm_season' });
    if (existing) return res.status(409).json({ error: 'Season record already exists for this farm', record: existing });

    const record = await Plot.create({
      farmId: farm._id,
      plotId: `farm_season_${farm._id.toString()}_${year}${season}`,
      year, season, crop,
      plotSizeM2: plotSizeM2 || farm.defaultPlotSizeM2,
      marketPriceRWF: marketPriceRWF || farm.defaultMarketPriceRWF,
      recordType: 'farm_season',
      inputCosts: [],
      labourCosts: []
    });

    res.status(201).json(record);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Get all season records for a farm (for trajectory/comparison)
router.get('/:id/seasons', requireAuth, async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });
  if (farm.ownerId.toString() !== req.user._id.toString())
    return res.status(403).json({ error: 'Not authorized to access this farm' });
  const records = await Plot.find({ farmId: req.params.id, recordType: 'farm_season' })
    .sort({ year: 1, season: 1 });
  res.json(records);
});

// Get a specific season record for a farm
router.get('/:id/seasons/:year/:season', requireAuth, async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });
  if (farm.ownerId.toString() !== req.user._id.toString())
    return res.status(403).json({ error: 'Not authorized to access this farm' });
  const record = await Plot.findOne({
    farmId: req.params.id,
    year: parseInt(req.params.year),
    season: req.params.season,
    recordType: 'farm_season'
  });
  if (!record) return res.status(404).json({ error: 'No season record found' });
  res.json(record);
});

export default router;
