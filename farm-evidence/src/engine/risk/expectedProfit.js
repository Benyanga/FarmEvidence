import { assertArray, assertNumber } from "../guards.js";

export function computeExpectedProfit(profit_best, profit_normal, profit_worst, p_best, p_normal, p_worst) {
  const sum = p_best + p_normal + p_worst;
  if (Math.abs(sum - 1) > 0.000001) {
    throw new Error("Scenario probabilities must sum to 1.00");
  }
  return (profit_best * p_best) + (profit_normal * p_normal) + (profit_worst * p_worst);
}

export function computeVariance(profits, probs, expectedProfit) {
  assertArray("profits", profits, { minLength: 1 });
  assertArray("probs", probs, { minLength: 1 });
  const e = assertNumber("expectedProfit", expectedProfit);
  let variance = 0;
  for (let i = 0; i < profits.length; i += 1) {
    variance += probs[i] * ((profits[i] - e) ** 2);
  }
  return { variance, stdDev: Math.sqrt(variance) };
}

export function getCSIAdjustedProbabilities(csi) {
  const v = assertNumber("csi", csi);
  const best = Math.min(0.5, 0.1 + (v * 0.4));
  const worst = Math.min(0.5, 0.1 + ((1 - v) * 0.4));
  const normal = Math.max(0, 1 - best - worst);
  return { p_best: best, p_normal: normal, p_worst: worst };
}
