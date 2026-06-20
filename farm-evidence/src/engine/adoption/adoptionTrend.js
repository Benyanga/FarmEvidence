import { assertArray, assertNumber } from "../guards.js";

function getDirection(series) {
  if (series.every((v) => v === 0)) return "Zero";
  let inc = 0;
  let dec = 0;
  for (let i = 1; i < series.length; i += 1) {
    if (series[i] > series[i - 1]) inc += 1;
    if (series[i] < series[i - 1]) dec += 1;
  }
  if (inc >= 2) return "Increasing";
  if (dec >= 2) return "Decreasing";
  return "Stable";
}

export function computeAdoptionCostTrend(adoptionCostHistory) {
  assertArray("adoptionCostHistory", adoptionCostHistory, { minLength: 1 });
  const values = adoptionCostHistory.map((v) => assertNumber("adoptionCost", v));
  const delta = values.map((value, index) => (index === 0 ? null : value - values[index - 1]));
  return { delta, trendDirection: getDirection(values) };
}
