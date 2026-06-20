// Main API router
const express = require('express');
const trialRoutes = require('./trial');

const router = express.Router();

router.use('/trial', trialRoutes);

module.exports = router;
