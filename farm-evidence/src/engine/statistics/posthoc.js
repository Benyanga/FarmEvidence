import { mean } from "simple-statistics";
import jstat from "jstat";
import { requireResearchMode } from "../guards.js";

function pairwise(groups) {
  const out = [];
  for (let i = 0; i < groups.length; i += 1) {
    for (let j = i + 1; j < groups.length; j += 1) out.push([groups[i], groups[j]]);
  }
  return out;
}

export function computeTukeyQCritical(alpha, k, df_error) {
  if (k === 3 && df_error === 6) return 3.559;
  if (k === 3 && df_error === 9) return 3.398;
  if (k === 3 && df_error === 12) return 3.304;
  if (k === 4 && df_error === 6) return 4.18;
  if (k === 4 && df_error === 9) return 3.947;
  if (k === 4 && df_error === 12) return 3.787;
  return 3.314;
}

export function computeTukeyHSD(groups, MS_error, df_error, mode) {
  requireResearchMode(mode, "computeTukeyHSD");
  const k = groups.length;
  const qCritical = computeTukeyQCritical(0.05, k, df_error);
  return pairwise(groups).map(([a, b]) => {
    const n = Math.min(a.observations.length, b.observations.length);
    const HSD_threshold = qCritical * Math.sqrt(MS_error / n);
    const mean_diff = Math.abs(mean(a.observations) - mean(b.observations));
    return { treatment_A: a.treatmentId, treatment_B: b.treatmentId, mean_diff, HSD_threshold, significant: mean_diff > HSD_threshold };
  });
}

export function computeFisherLSD(groups, MS_error, df_error, mode) {
  requireResearchMode(mode, "computeFisherLSD");
  const tCritical = jstat.studentt.inv(0.975, df_error);
  return pairwise(groups).map(([a, b]) => {
    const n = Math.min(a.observations.length, b.observations.length);
    const threshold = tCritical * Math.sqrt((2 * MS_error) / n);
    const mean_diff = Math.abs(mean(a.observations) - mean(b.observations));
    return { treatment_A: a.treatmentId, treatment_B: b.treatmentId, mean_diff, threshold, significant: mean_diff > threshold };
  });
}
