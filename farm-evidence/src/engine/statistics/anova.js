import { mean } from "simple-statistics";
import jstat from "jstat";
import { requireResearchMode } from "../guards.js";

export function computeOneWayANOVA(groups, mode) {
  requireResearchMode(mode, "computeOneWayANOVA");
  const all = groups.flatMap((g) => g.observations);
  const grandMean = mean(all);
  const k = groups.length;
  const N = all.length;
  let SS_treatment = 0;
  let SS_error = 0;
  for (const group of groups) {
    const m = mean(group.observations);
    SS_treatment += group.observations.length * ((m - grandMean) ** 2);
    for (const x of group.observations) SS_error += (x - m) ** 2;
  }
  const SS_total = SS_treatment + SS_error;
  const df_treatment = k - 1;
  const df_error = N - k;
  const MS_treatment = SS_treatment / df_treatment;
  const MS_error = SS_error / df_error;
  const F = MS_treatment / MS_error;
  const p_value = 1 - jstat.centralF.cdf(F, df_treatment, df_error);
  return { SS_treatment, SS_error, SS_total, df_treatment, df_error, MS_treatment, MS_error, F, p_value, reject_H0: p_value < 0.05 };
}
