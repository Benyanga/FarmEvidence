import { computeDelta } from "../engine/trends/deltaEngine";
import { classifyTrend } from "../engine/trends/trendClassifier";

export function useTrend(values) {
  const deltaRows = computeDelta(values);
  const deltas = deltaRows.map((d) => d.delta);
  return { deltaRows, classification: classifyTrend(deltas) };
}
