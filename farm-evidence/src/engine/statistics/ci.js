import jstat from "jstat";
import { assertNumber, requireResearchMode } from "../guards.js";

export function computeCI95(mean, stdDev, n, mode) {
  requireResearchMode(mode, "computeCI95");
  const meanValue = assertNumber("mean", mean, { allowZero: true });
  const stdevValue = assertNumber("stdDev", stdDev, { allowZero: true });
  const sampleSize = assertNumber("n", n, { allowZero: false });
  if (sampleSize < 2) {
    throw new Error("n must be at least 2 for confidence interval calculation.");
  }
  const tCritical = jstat.studentt.inv(0.975, sampleSize - 1);
  const margin = tCritical * (stdevValue / Math.sqrt(sampleSize));
  return { lower: meanValue - margin, upper: meanValue + margin };
}
