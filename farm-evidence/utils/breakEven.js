/**
 * Break-even yield and price for a single treatment.
 * @param {number} avgTPC         - average total production cost (RWF/plot)
 * @param {number} marketPrice    - RWF/kg
 * @param {number} actualYield    - kg/plot
 * @param {number} extrapolationFactor
 */
function calcBreakEven(avgTPC, marketPrice, actualYield, extrapolationFactor = 100) {
  const beYieldPlot = avgTPC / marketPrice;             // kg/plot
  const beYieldHa = beYieldPlot * extrapolationFactor;
  const yieldSurplus = actualYield - beYieldPlot;
  const yieldMoS = actualYield > 0 ? yieldSurplus / actualYield : null;

  const bePricePlot = actualYield > 0 ? avgTPC / actualYield : null;  // RWF/kg
  const priceSurplus = bePricePlot !== null ? marketPrice - bePricePlot : null;
  const priceMoS = marketPrice > 0 && bePricePlot !== null
    ? priceSurplus / marketPrice : null;

  const status = (mos) => {
    if (mos === null) return 'Unknown';
    if (mos >= 0.3) return 'Strong';
    if (mos >= 0.15) return 'Moderate';
    return 'Weak';
  };

  return {
    beYieldPlot,
    beYieldHa,
    actualYield,
    yieldSurplus,
    yieldMoS,
    yieldStatus: status(yieldMoS),
    bePricePlot,
    marketPrice,
    priceSurplus,
    priceMoS,
    priceStatus: status(priceMoS),
  };
}

export { calcBreakEven };
