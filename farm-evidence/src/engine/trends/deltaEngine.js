import { assertArray } from "../guards.js";
import { classifyTrend } from "./trendClassifier.js";

export function computeDelta(values) {
  assertArray("values", values, { minLength: 1 });
  return values.map((value, idx) => ({
    season: idx + 1,
    delta: idx === 0 ? null : value - values[idx - 1],
  }));
}

function getLastDelta(deltas) {
  const valid = deltas.filter((d) => d !== null && d !== undefined);
  return valid.length ? valid[valid.length - 1] : null;
}

function interpretTrend(metric, deltas, values) {
  const lastDelta = getLastDelta(deltas.map((row) => row.delta));
  if (lastDelta === null) return "Insufficient history.";
  switch (metric) {
    case "profit":
      return lastDelta > 0 ? "Profit is improving." : "Profit decline flagged for WHY analysis.";
    case "yield":
      return lastDelta > 0 ? "Yield is recovering." : "Yield is falling; investigate weed competition.";
    case "weed":
      return lastDelta > 0 ? "Weed pressure is worsening." : "Weed pressure is stable or improving.";
    case "soil":
      return lastDelta > 0 ? "Soil condition is improving." : "Soil condition is stable or declining.";
    case "CPU":
      return lastDelta < 0
        ? "CPU is improving efficiency per unit. Keep monitoring input intensity."
        : "CPU is rising; this may indicate cost-efficiency risk if yield is not increasing.";
    case "laborCost":
      return lastDelta < 0
        ? "Labor cost is declining, which can reflect skill or mechanization maturity."
        : "Labor cost is rising; verify whether this is due to deliberate scaling or unexpected inefficiency.";
    case "adoptionCost":
      if (lastDelta < 0) return "Adoption cost is trending toward TTP.";
      if (lastDelta === 0 && values.length >= 2) return "Adoption cost has stabilized; check TTP confirmation.";
      return "Adoption cost trend requires more data.";
    default:
      return "Trend interpretation unavailable for this metric.";
  }
}

export function computeTrendAnalysis(metricSeries) {
  if (!metricSeries || typeof metricSeries !== "object") {
    throw new Error("Trend analysis requires a metric series object.");
  }
  return Object.entries(metricSeries).reduce((acc, [metric, values]) => {
    assertArray(metric, values, { minLength: 1 });
    const deltas = computeDelta(values);
    const deltaValues = deltas.map((row) => row.delta);
    const classification = classifyTrend(deltaValues);
    const interpretation = interpretTrend(metric, deltas, values);
    acc[metric] = { values, deltas, classification, interpretation };
    return acc;
  }, {});
}

export function buildTrendMetrics(sessionData, currentAdoptionCost) {
  const metrics = { ...(sessionData?.trendMetrics ?? {}) };

  if (!metrics.profit) {
    if (Array.isArray(sessionData?.profitHistory)) {
      metrics.profit = sessionData.profitHistory;
    } else if (Array.isArray(sessionData?.trendValues)) {
      metrics.profit = sessionData.trendValues;
    }
  }

  if (!metrics.yield && Array.isArray(sessionData?.yieldHistory)) {
    metrics.yield = sessionData.yieldHistory;
  }

  if (!metrics.weed && Array.isArray(sessionData?.weedHistory)) {
    metrics.weed = sessionData.weedHistory;
  }

  if (!metrics.soil && Array.isArray(sessionData?.soilHistory)) {
    metrics.soil = sessionData.soilHistory;
  }

  if (!metrics.CPU && (Array.isArray(sessionData?.CPUHistory) || Array.isArray(sessionData?.cpuHistory))) {
    metrics.CPU = Array.isArray(sessionData?.CPUHistory) ? sessionData.CPUHistory : sessionData.cpuHistory;
  }

  if (!metrics.laborCost && (Array.isArray(sessionData?.laborCostHistory) || Array.isArray(sessionData?.laborHistory))) {
    metrics.laborCost = Array.isArray(sessionData?.laborCostHistory) ? sessionData.laborCostHistory : sessionData.laborHistory;
  }

  if (!metrics.adoptionCost) {
    const adoptionSeries = Array.isArray(sessionData?.adoptionCostHistory)
      ? [...sessionData.adoptionCostHistory]
      : [];
    if (currentAdoptionCost !== null && currentAdoptionCost !== undefined) {
      adoptionSeries.push(currentAdoptionCost);
    }
    if (adoptionSeries.length) {
      metrics.adoptionCost = adoptionSeries;
    }
  }

  return metrics;
}
