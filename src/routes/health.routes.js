const express = require('express');
const router = express.Router();
const { isDBConnected } = require('../config/db');

// @desc    Healthcheck endpoint for application & MongoDB connection
// @route   GET /health or GET /api/health
router.get('/', (req, res) => {
  const dbStatus = isDBConnected();
  const uptime = process.uptime();

  const healthData = {
    status: dbStatus ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(uptime),
    service: 'product-api',
    mongodb: {
      status: dbStatus ? 'CONNECTED' : 'DISCONNECTED',
    },
  };

  if (!dbStatus) {
    return res.status(503).json(healthData);
  }

  return res.status(200).json(healthData);
});

module.exports = router;
