import { mean, sampleVariance } from "simple-statistics";

export function safeNumber(value) {
  return typeof value === "number" && !Number.isNaN(value) ? value : 0;
}

export function describeSeries(values = []) {
  const clean = values.filter((value) => typeof value === "number" && !Number.isNaN(value));
  const n = clean.length;
  if (n === 0) {
    return { n: 0, mean: 0, sd: 0, se: 0, ciLower: 0, ciUpper: 0 };
  }
  const avg = mean(clean);
  const sd = n > 1 ? Math.sqrt(sampleVariance(clean)) : 0;
  const se = n > 1 ? sd / Math.sqrt(n) : 0;
  const ci = 1.96 * se;
  return {
    n,
    mean: Number(avg.toFixed(2)),
    sd: Number(sd.toFixed(2)),
    se: Number(se.toFixed(2)),
    ciLower: Number((avg - ci).toFixed(2)),
    ciUpper: Number((avg + ci).toFixed(2)),
  };
}

export function groupPlotsByTreatment(plots = []) {
  return plots.reduce((groups, plot) => {
    const treatment = plot.treatment || "Unknown";
    groups[treatment] = groups[treatment] || [];
    groups[treatment].push(plot);
    return groups;
  }, {});
}

export function buildDescriptiveStats(plots = []) {
  const groups = groupPlotsByTreatment(plots);
  return Object.fromEntries(
    Object.entries(groups).map(([treatment, groupPlots]) => {
      const yieldValues = groupPlots.map((row) => row.yield_kg_ha).filter((v) => typeof v === "number");
      const profitValues = groupPlots.map((row) => row.net_benefit).filter((v) => typeof v === "number");
      const costValues = groupPlots.map((row) => row.total_cost).filter((v) => typeof v === "number");
      return [treatment, {
        yield: describeSeries(yieldValues),
        net_benefit: describeSeries(profitValues),
        total_cost: describeSeries(costValues),
      }];
    }),
  );
}

export function formatNumber(value, dp = 0) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: dp, minimumFractionDigits: dp });
}

export function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatPercent(value, dp = 2) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value * 100).toFixed(dp)}%`;
}

export { yieldStability } from "./yieldStability.js";
