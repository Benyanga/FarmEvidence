// Express routes for trial config and plot data
import express from 'express';
import { TrialConfig } from '../trialConfig.js';
import { generatePlots } from '../rcbd.js';

const router = express.Router();

// In-memory store for demo (replace with DB in production)
let trialConfig = null;
let plotData = {}; // { plotId: { ...data } }

// Get trial config
router.get('/config', (req, res) => {
  res.json(trialConfig || {});
});

// Set/update trial config
router.post('/config', (req, res) => {
  trialConfig = new TrialConfig(req.body);
  // Regenerate plots if treatments/replications changed
  const plots = generatePlots(trialConfig.treatments, trialConfig.replications);
  // Remove plotData for plots that no longer exist
  const validPlotIds = new Set(plots.map(p => p.plotId));
  plotData = Object.fromEntries(Object.entries(plotData).filter(([pid]) => validPlotIds.has(pid)));
  res.json({ trialConfig, plots });
});

// Get all plots
router.get('/plots', (req, res) => {
  if (!trialConfig) return res.status(400).json({ error: 'No trial config set' });
  const plots = generatePlots(trialConfig.treatments, trialConfig.replications);
  res.json(plots);
});

// Get plot data
router.get('/plot/:plotId', (req, res) => {
  res.json(plotData[req.params.plotId] || {});
});

// Set plot data
router.post('/plot/:plotId', (req, res) => {
  plotData[req.params.plotId] = req.body;
  res.json({ success: true });
});

// Get all plot data
router.get('/plot-data', (req, res) => {
  res.json(plotData);
});

// Reset all data
router.post('/reset', (req, res) => {
  trialConfig = null;
  plotData = {};
  res.json({ success: true });
});

export default router;
