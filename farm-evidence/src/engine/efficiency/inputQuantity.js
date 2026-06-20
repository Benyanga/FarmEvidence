import { assertNumber } from "../guards.js";

export function computeEfficiencyFactor(E_max_i, phi, CSI) {
  const eMax = assertNumber("E_max_i", E_max_i);
  const phase = assertNumber("phi", phi);
  const csi = assertNumber("CSI", CSI);
  const value = eMax * phase * csi;
  return Math.max(0, Math.min(1, value));
}

export function computeCAInputQuantity(Q_CF_i, E_i) {
  const qcf = assertNumber("Q_CF_i", Q_CF_i);
  const e = assertNumber("E_i", E_i);
  const q = qcf * (1 - e);
  return Math.min(qcf, Math.max(0, q));
}
