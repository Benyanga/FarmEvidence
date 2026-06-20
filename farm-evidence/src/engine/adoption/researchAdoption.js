import { assertNumber } from "../guards.js";

export function computeAdoptionCostResearch(meanProfit_CF, meanProfit_CA) {
  const cf = assertNumber("meanProfit_CF", meanProfit_CF);
  const ca = assertNumber("meanProfit_CA", meanProfit_CA);
  return Math.max(0, cf - ca);
}
