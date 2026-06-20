const { descStats } = require('./statistics');

/**
 * Yield stability and risk metrics for a treatment.
 * @param {number[]} yields  - per-plot yields
 * @param {number[]} revenues - per-plot gross revenues
 */
function yieldStability(yields = [], revenues = []) {
  const s = descStats(yields);
  const r = descStats(revenues);

  const cvClass = (cv) => {
    if (cv < 10) return 'Low risk';
    if (cv < 20) return 'Moderate risk';
    return 'High risk';
  };

  const belowAvgCount = yields.filter((y) => typeof y === 'number' && y < s.mean).length;
  const probBelowAvg = s.n > 0 ? Number((belowAvgCount / s.n).toFixed(2)) : 0;
  const downsideRisk = s.mean !== 0 ? Number(((s.min / s.mean) * 100).toFixed(2)) : 0;

  return {
    ...s,
    yieldPerHa: Number((s.mean * 100).toFixed(2)),     // for 100 m² plots
    revenueStats: r,
    cvClass: cvClass(s.cv),
    downsideRisk,
    probBelowAvg,
  };
}

module.exports = { yieldStability };
