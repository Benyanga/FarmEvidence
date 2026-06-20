import { calcInputRowCost } from './inputCost.js';
import { calcLabourRowCost } from './labourCost.js';
import { toMinutes } from './timeConverter.js';

/**
 * Computes all derived values for a single plot.
 * Returns a plain object — never mutates the document.
 *
 * @param {object} plot        - Plot document (plain JS object)
 * @param {object} trialParams - { marketPriceRWF, wageRateRWFPerDay, workingHoursPerDay, plotSizeM2 }
 * @returns {object}
 */
function aggregatePlot(plot, trialParams) {
  const { workingHoursPerDay = 8, plotSizeM2 = 100 } = trialParams;

  // ---- Input Costs ----
  let inputCostTotal = 0;
  let csdInputTotal = 0;
  let csiInputTotal = 0;

  for (const row of (plot.inputCosts || [])) {
    const cost = calcInputRowCost(row);
    inputCostTotal += cost;
    if (row.costType === 'C_SD') csdInputTotal += cost;
    else csiInputTotal += cost;
  }

  // ---- Labour Costs ----
  let labourCostTotal = 0;
  let csdLabourTotal = 0;
  let csiLabourTotal = 0;
  let labourTimeMinTotal = 0;

  for (const row of (plot.labourCosts || [])) {
    const cost = calcLabourRowCost(row, workingHoursPerDay);
    labourCostTotal += cost;
    if (row.costType === 'C_SD') csdLabourTotal += cost;
    else csiLabourTotal += cost;

    if (row.time && row.timeUnit) {
      labourTimeMinTotal += toMinutes(row.time, row.timeUnit, workingHoursPerDay) * (row.numLabourers || 1);
    }
  }

  const csdTotal = csdInputTotal + csdLabourTotal;
  const csiTotal = csiInputTotal + csiLabourTotal;
  const tpc = inputCostTotal + labourCostTotal; // Total Production Cost

  // ---- Extrapolation ----
  const extrapolationFactor = 10000 / plotSizeM2; // 100 for 100 m² plots
  const costPerM2 = tpc / plotSizeM2;
  const costPerHa = tpc * extrapolationFactor; // = costPerM2 × 10000

  // ---- Revenue ----
  const price = plot.marketPriceRWF || trialParams.marketPriceRWF || 1200;
  const yieldKg = plot.yieldKg || 0;
  const grossRev = yieldKg * price;
  const revPerM2 = grossRev / plotSizeM2;
  const revPerHa = grossRev * extrapolationFactor;

  // ---- Profitability ----
  const netBenefit = grossRev - tpc;
  const bcr = tpc > 0 ? grossRev / tpc : null;
  const roi = tpc > 0 ? (netBenefit / tpc) * 100 : null;
  const costPerKg = yieldKg > 0 ? tpc / yieldKg : null;
  const adjustedGM = grossRev - csdTotal; // Revenue minus system-dependent costs only

  return {
    plotId: plot.plotId,
    treatment: plot.treatment,
    replicate: plot.replicate,
    plotSizeM2,
    plotSizeHa: plotSizeM2 / 10000,
    inputCostTotal,
    labourCostTotal,
    labourTimeMin: labourTimeMinTotal,
    csdTotal,
    csiTotal,
    tpc,
    costPerM2,
    costPerHa,
    yieldKg,
    grossRev,
    revPerM2,
    revPerHa,
    netBenefit,
    bcr,
    roi,
    costPerKg,
    adjustedGM,
    extrapolationFactor,
  };
}

export { aggregatePlot };
