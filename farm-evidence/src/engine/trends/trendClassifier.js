export function classifyTrend(deltas, { threshold = 0.0001 } = {}) {
  const valid = deltas.filter((d) => d !== null && d !== undefined);
  if (valid.length < 2) return "Insufficient";
  const positive = valid.every((d) => d > 0);
  const negative = valid.every((d) => d < 0);
  if (positive) return "Improving";
  if (negative) return "Declining";
  const stable = valid.every((d) => Math.abs(d) < threshold);
  if (stable) return "Stable";
  let alternating = 0;
  for (let i = 1; i < valid.length; i += 1) {
    if (Math.sign(valid[i]) !== Math.sign(valid[i - 1])) alternating += 1;
  }
  if (alternating >= 1) return "Volatile";
  return "Stable";
}
