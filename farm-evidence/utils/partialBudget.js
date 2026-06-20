function partialBudget(ca, cf, extrapolationFactor = 100) {
  const additionalYieldRevenue = Number(Math.max(0, ca.avgRevenue - cf.avgRevenue).toFixed(2));
  const labourCostSavings = Number(Math.max(0, cf.avgCSD - ca.avgCSD).toFixed(2));
  const mulchAcquisitionCost = Number(Math.max(0, ca.avgTPC - cf.avgTPC).toFixed(2));
  const csdLabourIncrease = Number(Math.max(0, ca.avgCSD - cf.avgCSD).toFixed(2));

  return {
    benefits: {
      additionalYieldRevenue,
      additionalYieldRevenueHa: Number((additionalYieldRevenue * extrapolationFactor).toFixed(2)),
      labourCostSavings,
      labourCostSavingsHa: Number((labourCostSavings * extrapolationFactor).toFixed(2)),
    },
    costs: {
      mulchAcquisitionCost,
      mulchAcquisitionCostHa: Number((mulchAcquisitionCost * extrapolationFactor).toFixed(2)),
      csdLabourIncrease,
      csdLabourIncreaseHa: Number((csdLabourIncrease * extrapolationFactor).toFixed(2)),
    },
  };
}

module.exports = { partialBudget };
