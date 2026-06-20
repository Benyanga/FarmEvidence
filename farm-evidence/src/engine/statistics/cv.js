import { assertNumber, requireResearchMode } from "../guards.js";

export function computeCV(stdDev, mean, mode) {
  requireResearchMode(mode, "computeCV");
  const stdevValue = assertNumber("stdDev", stdDev, { allowZero: true });
  const meanValue = assertNumber("mean", mean, { allowZero: false });
  const cv = (stdevValue / Math.abs(meanValue)) * 100;
  return { cv, warning: cv > 20 ? "HIGH experimental noise" : null };
}
