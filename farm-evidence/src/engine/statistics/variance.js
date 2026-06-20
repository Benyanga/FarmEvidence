import { sampleVariance } from "simple-statistics";
import { assertArray, requireResearchMode } from "../guards.js";

export function computeSampleVariance(observations, _mean, mode) {
  requireResearchMode(mode, "computeSampleVariance");
  assertArray("observations", observations, { minLength: 2 });
  return sampleVariance(observations);
}

export function computeStdDev(variance, mode) {
  requireResearchMode(mode, "computeStdDev");
  return Math.sqrt(variance);
}
