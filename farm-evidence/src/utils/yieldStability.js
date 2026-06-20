import { mean, sampleVariance } from "simple-statistics";

function descStats(values = []) {
  const clean = values.filter((value) => typeof value === "number" && !Number.isNaN(value));
  const n = clean.length;
  if (n === 0) {
    return { n: 0, mean: 0, min: 0, max: 0, sd: 0, cv: 0 };
  }

  const avg = mean(clean);
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const sd = n > 1 ? Math.sqrt(sampleVariance(clean)) : 0;
  const cv = avg !== 0 ? (sd / Math.abs(avg)) * 100 : 0;

  return {
    n,
    mean: Number(avg.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    sd: Number(sd.toFixed(2)),
    cv: Number(cv.toFixed(2)),
  };
}

const cvClass = (cv) => {
  if (cv < 10) return "Low risk";
  if (cv < 20) return "Moderate risk";
  return "High risk";
};

export function yieldStability(yields = [], revenues = []) {
  const s = descStats(yields);
  const r = descStats(revenues);

  const belowAvgCount = yields.filter((yieldValue) => typeof yieldValue === "number" && yieldValue < s.mean).length;
  const probBelowAvg = s.n > 0 ? Number((belowAvgCount / s.n).toFixed(2)) : 0;
  const downsideRisk = s.mean !== 0 ? Number(((s.min / s.mean) * 100).toFixed(2)) : 0;

  return {
    ...s,
    yieldPerHa: Number((s.mean * 100).toFixed(2)),
    revenueStats: r,
    cvClass: cvClass(s.cv),
    downsideRisk,
    probBelowAvg,
  };
}
