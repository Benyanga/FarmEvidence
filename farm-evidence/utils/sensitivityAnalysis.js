function sensitivityAnalysis(avgRevenue, avgTPC, avgYield, avgCSD) {
  const basePrice = avgYield > 0 ? avgRevenue / avgYield : 0;
  const scenarios = [
    {
      name: 'Pessimistic',
      priceChangePercent: -10,
      newPrice: Number((basePrice * 0.9).toFixed(2)),
      labourChangePercent: 10,
      newWage: null,
    },
    {
      name: 'Expected',
      priceChangePercent: 0,
      newPrice: Number(basePrice.toFixed(2)),
      labourChangePercent: 0,
      newWage: null,
    },
    {
      name: 'Optimistic',
      priceChangePercent: 10,
      newPrice: Number((basePrice * 1.1).toFixed(2)),
      labourChangePercent: -10,
      newWage: null,
    },
  ];

  const computeResults = (scenario) => {
    const revenue = avgYield * scenario.newPrice;
    const changeInRevenue = revenue - avgRevenue;
    const labourCostDelta = avgTPC * (scenario.labourChangePercent / 100);
    const totalCost = avgTPC + labourCostDelta;
    const grossMargin = revenue - totalCost;
    const bcr = totalCost > 0 ? revenue / totalCost : null;
    const roi = totalCost > 0 ? ((grossMargin / totalCost) * 100) : null;
    return {
      name: scenario.name,
      priceChangePercent: scenario.priceChangePercent,
      newPrice: scenario.newPrice,
      labourChangePercent: scenario.labourChangePercent,
      newWage: scenario.newWage,
      revenue: Number(revenue.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      grossMargin: Number(grossMargin.toFixed(2)),
      bcr: bcr !== null ? Number(bcr.toFixed(2)) : null,
      roi: roi !== null ? Number(roi.toFixed(2)) : null,
      costPerKg: avgYield > 0 ? Number((totalCost / avgYield).toFixed(2)) : null,
      avgRevenue: Number(avgRevenue.toFixed(2)),
      avgTPC: Number(avgTPC.toFixed(2)),
      avgYield: Number(avgYield.toFixed(2)),
      avgCSD: Number(avgCSD.toFixed(2)),
    };
  };

  const caScenarios = scenarios.map(computeResults);
  const cfScenarios = scenarios.map(computeResults);

  return {
    scenarios,
    ca: { scenarios: caScenarios },
    cf: { scenarios: cfScenarios },
    pessimistic: { ...scenarios[0], ...caScenarios[0] },
    expected: { ...scenarios[1], ...caScenarios[1] },
    optimistic: { ...scenarios[2], ...caScenarios[2] },
  };
}

export { sensitivityAnalysis };
