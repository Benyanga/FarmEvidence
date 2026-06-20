import { requireResearchMode } from "../guards.js";

export function computePooledStdDev(s_A, n_A, s_B, n_B) {
  return Math.sqrt((((n_A - 1) * s_A ** 2) + ((n_B - 1) * s_B ** 2)) / (n_A + n_B - 2));
}

export function computeCohenD(mean_A, mean_B, s_A, n_A, s_B, n_B, mode) {
  requireResearchMode(mode, "computeCohenD");
  const pooled = computePooledStdDev(s_A, n_A, s_B, n_B);
  const d = (mean_A - mean_B) / pooled;
  const abs = Math.abs(d);
  const magnitude = abs < 0.2 ? "Negligible" : abs < 0.5 ? "Small" : abs < 0.8 ? "Medium" : "Large";
  return { d, magnitude };
}

export function computeEtaSquared(SS_treatment, SS_total, mode) {
  requireResearchMode(mode, "computeEtaSquared");
  const etaSquared = SS_treatment / SS_total;
  const magnitude = etaSquared < 0.06 ? "Small" : etaSquared < 0.14 ? "Medium" : "Large";
  return { etaSquared, magnitude };
}
