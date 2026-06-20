/**
 * Full Cost-Benefit Analysis: given aggregated plot results for CA and CF,
 * compute all summary, CBA, and profitability indicators.
 *
 * @param {object[]} caPlots  - array of aggregatePlot() results for CA treatment
 * @param {object[]} cfPlots  - array of aggregatePlot() results for CF treatment
 * @param {object}   params   - { marketPriceRWF, wageRateRWF, plotSizeM2 }
 * @returns {object} Full CBA summary
 */
function runCBA(caPlots, cfPlots, params) {
  const { marketPriceRWF = 1200, plotSizeM2 = 100 } = params;
  const extrapolationFactor = 10000 / plotSizeM2;

  function avg(arr, key) {
    return arr.length > 0 ? arr.reduce((s, p) => s + (p[key] || 0), 0) / arr.length : 0;
  }

  const ca = {
    avgInputCost: avg(caPlots, 'inputCostTotal'),
    avgLabourCost: avg(caPlots, 'labourCostTotal'),
    avgLabourTime: avg(caPlots, 'labourTimeMin'),
    avgTPC: avg(caPlots, 'tpc'),
    avgCSD: avg(caPlots, 'csdTotal'),
    avgCSI: avg(caPlots, 'csiTotal'),
    avgYield: avg(caPlots, 'yieldKg'),
    avgRevenue: avg(caPlots, 'grossRev'),
    yields: caPlots.map(p => p.yieldKg),
    grossMargins: caPlots.map(p => p.netBenefit),
  };

  const cf = {
    avgInputCost: avg(cfPlots, 'inputCostTotal'),
    avgLabourCost: avg(cfPlots, 'labourCostTotal'),
    avgLabourTime: avg(cfPlots, 'labourTimeMin'),
    avgTPC: avg(cfPlots, 'tpc'),
    avgCSD: avg(cfPlots, 'csdTotal'),
    avgCSI: avg(cfPlots, 'csiTotal'),
    avgYield: avg(cfPlots, 'yieldKg'),
    avgRevenue: avg(cfPlots, 'grossRev'),
    yields: cfPlots.map(p => p.yieldKg),
    grossMargins: cfPlots.map(p => p.netBenefit),
  };

  ca.netBenefit = ca.avgRevenue - ca.avgTPC;
  cf.netBenefit = cf.avgRevenue - cf.avgTPC;

  ca.bcr = ca.avgTPC > 0 ? ca.avgRevenue / ca.avgTPC : null;
  cf.bcr = cf.avgTPC > 0 ? cf.avgRevenue / cf.avgTPC : null;

  ca.roi = ca.avgTPC > 0 ? (ca.netBenefit / ca.avgTPC) * 100 : null;
  cf.roi = cf.avgTPC > 0 ? (cf.netBenefit / cf.avgTPC) * 100 : null;

  ca.costPerKg = ca.avgYield > 0 ? ca.avgTPC / ca.avgYield : null;
  cf.costPerKg = cf.avgYield > 0 ? cf.avgTPC / cf.avgYield : null;

  ca.adjustedGM = ca.avgRevenue - ca.avgCSD;
  cf.adjustedGM = cf.avgRevenue - cf.avgCSD;

  function perHa(val) { return val * extrapolationFactor; }
  ca.perHa = {
    tpc: perHa(ca.avgTPC), revenue: perHa(ca.avgRevenue),
    netBenefit: perHa(ca.netBenefit), csd: perHa(ca.avgCSD),
    csi: perHa(ca.avgCSI), yield: perHa(ca.avgYield),
    adjustedGM: perHa(ca.adjustedGM),
  };
  cf.perHa = {
    tpc: perHa(cf.avgTPC), revenue: perHa(cf.avgRevenue),
    netBenefit: perHa(cf.netBenefit), csd: perHa(cf.avgCSD),
    csi: perHa(cf.avgCSI), yield: perHa(cf.avgYield),
    adjustedGM: perHa(cf.adjustedGM),
  };

  const labourTimeDiff = cf.avgLabourTime - ca.avgLabourTime;
  const labourCostDiff = ca.avgCSD - cf.avgCSD;

  return { ca, cf, labourTimeDiff, labourCostDiff, extrapolationFactor };
}

module.exports = { runCBA };
