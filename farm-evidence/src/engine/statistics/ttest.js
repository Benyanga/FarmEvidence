import { mean, sampleVariance } from "simple-statistics";
import jstat from "jstat";
import { floorToInt, requireResearchMode } from "../guards.js";

export function computeWelchStandardError(vA, nA, vB, nB) {
  return Math.sqrt((vA / nA) + (vB / nB));
}

export function computeWelchDF(vA, nA, vB, nB) {
  const numerator = ((vA / nA) + (vB / nB)) ** 2;
  const denominator = ((vA / nA) ** 2) / (nA - 1) + ((vB / nB) ** 2) / (nB - 1);
  return floorToInt(numerator / denominator);
}

export function computeWelchTTest(groupA, groupB, mode) {
  requireResearchMode(mode, "computeWelchTTest");
  const nA = groupA.length;
  const nB = groupB.length;
  const meanA = mean(groupA);
  const meanB = mean(groupB);
  const vA = sampleVariance(groupA);
  const vB = sampleVariance(groupB);
  const seDiff = computeWelchStandardError(vA, nA, vB, nB);
  const t_stat = (meanA - meanB) / seDiff;
  const df = computeWelchDF(vA, nA, vB, nB);
  const p_value = 2 * (1 - jstat.studentt.cdf(Math.abs(t_stat), df));
  return { t_stat, df, p_value, reject_H0: p_value < 0.05 };
}
