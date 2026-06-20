import { assertArray, assertNumber } from "../guards.js";

export function computeProfit(revenue, C_system) {
  const rev = assertNumber("revenue", revenue);
  const cost = assertNumber("C_system", C_system);
  return rev - cost;
}

export function computeTreatmentMeanProfit(plotProfits) {
  assertArray("plotProfits", plotProfits, { minLength: 1 });
  const total = plotProfits.reduce((sum, profit) => {
    if (profit === null || profit === undefined || Number.isNaN(Number(profit))) {
      throw new Error("plotProfit is required.");
    }
    return sum + Number(profit);
  }, 0);
  return total / plotProfits.length;
}
